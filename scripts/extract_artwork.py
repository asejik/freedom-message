import os
import io
import requests
import tempfile
from dotenv import load_dotenv
from supabase import create_client, Client
from mutagen.id3 import ID3
from PIL import Image

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing Supabase credentials in .env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
BUCKET_NAME = "artwork"

def ensure_bucket():
    try:
        buckets = supabase.storage.list_buckets()
        if not any(b.name == BUCKET_NAME for b in buckets):
            print(f"Creating bucket '{BUCKET_NAME}'...")
            supabase.storage.create_bucket(BUCKET_NAME, options={"public": True})
    except Exception as e:
        print(f"Error checking/creating bucket: {e}")

import tempfile
import requests
from mutagen.id3 import ID3
from PIL import Image
import io

def get_full_audio_file(url: str) -> str:
    """Download the entire MP3 to ensure we find the ID3 tag no matter where it is."""
    try:
        r = requests.get(url, stream=True, timeout=30)
        r.raise_for_status()
        
        fd, path = tempfile.mkstemp(suffix=".mp3")
        with os.fdopen(fd, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
        return path
    except Exception as e:
        print(f"Failed to fetch {url}: {e}")
        return None

def extract_and_process_artwork(audio_url: str) -> bytes:
    """Download the full MP3, extract the APIC frame, resize, and convert to WebP."""
    tmp_path = get_full_audio_file(audio_url)
    if not tmp_path:
        return None
        
    try:
        audio = ID3(tmp_path)
        apics = audio.getall('APIC')
        if not apics:
            os.remove(tmp_path)
            return None
            
        artwork_data = apics[0].data
        img = Image.open(io.BytesIO(artwork_data))
        
        # Convert to RGB (required for JPEG/WebP) and resize
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
            
        img.thumbnail((400, 400), Image.Resampling.LANCZOS)
        
        output = io.BytesIO()
        img.save(output, format="WEBP", quality=80)
        os.remove(tmp_path)
        return output.getvalue()
    except Exception as e:
        # File has no ID3 tags
        os.remove(tmp_path)
        return None

import concurrent.futures

def process_sermon(sermon):
    sermon_id = sermon['id']
    audio_url = sermon['audio_url']
    print(f"Processing: {sermon_id}")
    
    webp_data = extract_and_process_artwork(audio_url)
    
    if not webp_data:
        # Mark as ERROR instead of empty so we know it failed due to server issues, not missing tags.
        # This allows us to easily find and retry these specific sermons later!
        supabase.table("sermons").update({"artwork_url": "ERROR"}).eq("id", sermon_id).execute()
        print(f"   ⚠️ Marked {sermon_id} as ERROR due to download failure.")
        return
    
    if webp_data:
        file_path = f"{sermon_id}.webp"
        try:
            # Upload to Supabase Storage
            supabase.storage.from_(BUCKET_NAME).upload(
                path=file_path,
                file=webp_data,
                file_options={"content-type": "image/webp", "upsert": "true"}
            )
            
            # Get public URL
            public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)
            
            # Update DB
            supabase.table("sermons").update({"artwork_url": public_url}).eq("id", sermon_id).execute()
            print(f"   ✅ Saved artwork ({len(webp_data) // 1024}KB) for {sermon_id}")
        except Exception as e:
            print(f"   ❌ Upload failed for {sermon_id}: {e}")
    else:
        # Prevent checking the same file repeatedly
        supabase.table("sermons").update({"artwork_url": ""}).eq("id", sermon_id).execute()
        print(f"   ⚠️ No artwork found for {sermon_id}. Marked as empty.")

def main():
    ensure_bucket()
    
    print("\n🔍 Fetching all sermons missing artwork (or previously marked ERROR)...")
    sermons = []
    offset = 0
    limit = 1000
    
    while True:
        response = supabase.table("sermons").select("id, audio_url") \
            .or_("artwork_url.is.null,artwork_url.eq.ERROR,artwork_url.eq.") \
            .range(offset, offset + limit - 1).execute()
            
        if not response.data:
            break
            
        sermons.extend(response.data)
        if len(response.data) < limit:
            break
        offset += limit
        
    if not sermons:
        print("✅ All sermons have artwork processed!")
        return

    print(f"Found {len(sermons)} sermons. Starting concurrent processing with 5 workers...")
    
    # Because we fetched the list upfront, it will process each sermon exactly ONCE per run.
    # It will safely retry 'ERROR' sermons without ever getting stuck in an infinite loop!
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        executor.map(process_sermon, sermons)
        
    print("\n✅ Finished the processing run!")

if __name__ == "__main__":
    main()
