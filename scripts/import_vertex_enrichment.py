import os
import json
import re
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing Supabase credentials in .env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def clean_filename_to_title(filename):
    name = re.sub(r'\.txt$', '', filename)
    name = re.sub(r'^\d+_', '', name)
    return name.strip()

def main():
    json_path = "../output/sermon_analysis.json"
    if not os.path.exists(json_path):
        json_path = "output/sermon_analysis.json"
        
    print(f"📂 Loading Vertex AI JSON from {json_path}...")
    with open(json_path, 'r', encoding='utf-8') as f:
        analysis_data = json.load(f)
        
    print(f"Loaded {len(analysis_data)} records from JSON.")

    print("🔍 Fetching all sermons from Supabase to build a title mapping...")
    
    db_sermons = []
    offset = 0
    limit = 1000
    while True:
        response = supabase.table("sermons").select("id, title").range(offset, offset + limit - 1).execute()
        if not response.data:
            break
        db_sermons.extend(response.data)
        if len(response.data) < limit:
            break
        offset += limit
    
    # Create a mapping of lowercased title to ID
    title_to_id = {s['title'].lower().strip(): s['id'] for s in db_sermons}
    print(f"Found {len(title_to_id)} sermons in Database.")

    success_count = 0
    missing_count = 0

    print("🚀 Starting bulk update...")
    for item in analysis_data:
        filename = item.get("filename", "")
        extracted_title = clean_filename_to_title(filename).lower()
        
        sermon_id = title_to_id.get(extracted_title)
        
        if not sermon_id:
            for db_title, db_id in title_to_id.items():
                if extracted_title in db_title or db_title in extracted_title:
                    sermon_id = db_id
                    break
                    
        if not sermon_id:
            # print(f"⚠️ Could not find DB match for filename: {filename}")
            missing_count += 1
            continue

        summary = item.get("summary", "")
        key_verses = item.get("key_scriptures", [])
        if not isinstance(key_verses, list):
            key_verses = [key_verses]
            
        prayer_focus_raw = item.get("prayer_focus", [])
        if isinstance(prayer_focus_raw, list):
            prayer_focus = "\n".join([f"• {p}" for p in prayer_focus_raw])
        else:
            prayer_focus = str(prayer_focus_raw)

        try:
            supabase.table("sermons").update({
                "ai_summary": summary,
                "key_verses": key_verses,
                "prayer_focus": prayer_focus
            }).eq("id", sermon_id).execute()
            
            success_count += 1
            if success_count % 50 == 0:
                print(f"Updated {success_count} sermons...")
        except Exception as e:
            print(f"❌ Error updating {filename}: {e}")

    print(f"✅ Finished! Successfully updated {success_count} sermons.")
    if missing_count > 0:
        print(f"⚠️ {missing_count} sermons could not be matched to the database.")

if __name__ == "__main__":
    main()
