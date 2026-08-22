import os
import sys
import io
import re
from PIL import Image
from mutagen.id3 import ID3
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv("web/.env.local")
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing Supabase credentials in .env.local")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
BUCKET_NAME = "artwork"

def clean_filename_to_title(filename):
    name = re.sub(r'\.mp3$', '', filename, flags=re.IGNORECASE)
    name = re.sub(r'^\d+_', '', name)
    return name.strip().lower()

def extract_and_process_local_artwork(mp3_path: str) -> bytes:
    """Extract APIC frame from local file, resize, and convert to WebP."""
    try:
        audio = ID3(mp3_path)
        apics = audio.getall('APIC')
        if not apics:
            return None
            
        artwork_data = apics[0].data
        img = Image.open(io.BytesIO(artwork_data))
        
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
            
        img.thumbnail((400, 400), Image.Resampling.LANCZOS)
        
        output = io.BytesIO()
        img.save(output, format="WEBP", quality=80)
        return output.getvalue()
    except Exception as e:
        return None

def main(local_directory):
    print(f"🔍 Scanning local directory: {local_directory}")
    
    # Build a mapping of cleaned filename to absolute local path
    local_files = {}
    for root, _, files in os.walk(local_directory):
        for file in files:
            if file.lower().endswith('.mp3'):
                clean_name = clean_filename_to_title(file)
                local_files[clean_name] = os.path.join(root, file)
                
    print(f"📦 Found {len(local_files)} MP3s on local disk.")

    print("\n🔍 Fetching the 165 sermons marked as ERROR from Supabase...")
    sermons = []
    offset = 0
    limit = 1000
    while True:
        response = supabase.table("sermons").select("id, title, audio_url") \
            .eq("artwork_url", "ERROR") \
            .range(offset, offset + limit - 1).execute()
        if not response.data:
            break
        sermons.extend(response.data)
        if len(response.data) < limit:
            break
        offset += limit

    print(f"🎯 Found {len(sermons)} sermons to process.")

    success = 0
    no_artwork = 0
    missing_local = 0

    for sermon in sermons:
        sermon_id = sermon['id']
        db_title = sermon['title'].strip().lower()
        
        # Try to match DB title to local filename
        match_path = None
        
        # Exact match attempt (if DB title equals clean filename)
        if db_title in local_files:
            match_path = local_files[db_title]
        else:
            # Fuzzy match attempt
            for local_clean, path in local_files.items():
                if db_title in local_clean or local_clean in db_title:
                    match_path = path
                    break
                    
        if not match_path:
            print(f"   ⚠️ Could not find local MP3 for: {sermon['title']}")
            missing_local += 1
            continue
            
        print(f"Processing local file: {os.path.basename(match_path)}")
        webp_data = extract_and_process_local_artwork(match_path)
        
        if webp_data:
            file_path = f"{sermon_id}.webp"
            try:
                # Upload to Supabase Storage
                supabase.storage.from_(BUCKET_NAME).upload(
                    path=file_path,
                    file=webp_data,
                    file_options={"content-type": "image/webp", "upsert": "true"}
                )
                public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)
                supabase.table("sermons").update({"artwork_url": public_url}).eq("id", sermon_id).execute()
                print(f"   ✅ Saved artwork ({len(webp_data) // 1024}KB)")
                success += 1
            except Exception as e:
                print(f"   ❌ Upload failed: {e}")
        else:
            # It TRULY has no artwork embedded in the ID3 tags.
            supabase.table("sermons").update({"artwork_url": ""}).eq("id", sermon_id).execute()
            print("   🚫 No artwork embedded in this local MP3. Marked as genuinely empty.")
            no_artwork += 1

    print("\n🎉 Local processing complete!")
    print(f"✅ Successes: {success}")
    print(f"🚫 Genuinely Empty: {no_artwork}")
    print(f"⚠️ Missing Local Match: {missing_local}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/extract_local_artwork.py /path/to/your/audio/folder")
        exit(1)
    main(sys.argv[1])
