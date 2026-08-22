import os
import json
import sys
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(SCRIPT_DIR, '.env')
ROOT = os.path.join(SCRIPT_DIR, '..')
INPUT_PATH = os.path.join(ROOT, 'output', 'clc_enriched_staging.json')

# ── Configuration ─────────────────────────────────────────────────────────────
BATCH_SIZE = 100

def run():
    print('=' * 70)
    print('  CLC Sermon Platform — Database Hydration Script')
    print('=' * 70)

    # 1. Load Environment & Initialize Supabase
    load_dotenv(ENV_PATH)
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not supabase_url or not supabase_key:
        print("❌ ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
        sys.exit(1)

    print("🔌 Connecting to Supabase...")
    supabase: Client = create_client(supabase_url, supabase_key)

    # 2. Load Enriched JSON Data
    if not os.path.exists(INPUT_PATH):
        print(f"❌ Input file {INPUT_PATH} not found.")
        sys.exit(1)

    print(f"📂 Loading enriched data from {INPUT_PATH}...")
    with open(INPUT_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    records = data.get('records', [])
    print(f"📊 Found {len(records)} records to process.\n")

    # 3. Extract Unique Preachers & Series
    print("🔄 Pass 1: Extracting & Upserting Preachers and Series...")
    
    unique_preachers = set()
    unique_series = set()

    for r in records:
        if r.get('preacher') and str(r['preacher']).strip() and str(r['preacher']).lower() != 'nan':
            unique_preachers.add(str(r['preacher']).strip())
        if r.get('series') and str(r['series']).strip() and str(r['series']).lower() != 'nan':
            unique_series.add(str(r['series']).strip())

    preacher_map = {} # name -> id
    series_map = {} # name -> id

    # Upsert Preachers
    if unique_preachers:
        preachers_to_insert = [{"name": p} for p in unique_preachers]
        res = supabase.table('preachers').upsert(preachers_to_insert, on_conflict='name').execute()
        for p in res.data:
            preacher_map[p['name']] = p['id']
        print(f"   ✅ Processed {len(res.data)} preachers.")

    # Upsert Series
    if unique_series:
        series_to_insert = [{"name": s} for s in unique_series]
        res = supabase.table('series').upsert(series_to_insert, on_conflict='name').execute()
        for s in res.data:
            series_map[s['name']] = s['id']
        print(f"   ✅ Processed {len(res.data)} series.")

    # 4. Data Preparation (Mapping String -> UUID)
    print("\n🔄 Pass 2: Mapping string names to UUIDs and preparing final payload...")
    final_sermons = []
    
    for idx, r in enumerate(records):
        # We must have at least a title, date, and URL. If we don't, skip or handle gracefully.
        if not r.get('title') or not r.get('date_preached') or not r.get('audio_url'):
            continue
            
        preacher_id = None
        if r.get('preacher') and str(r['preacher']).strip() in preacher_map:
            preacher_id = preacher_map[str(r['preacher']).strip()]
            
        series_id = None
        if r.get('series') and str(r['series']).strip() in series_map:
            series_id = series_map[str(r['series']).strip()]

        date_preached = r.get('date_preached')  # Already in YYYY-MM-DD from pipeline

        sermon = {
            "title": str(r['title']).strip(),
            "date_preached": date_preached,
            "audio_url": str(r['audio_url']).strip(),
            "preacher_id": preacher_id,
            "series_id": series_id,
            "transcript_text": r.get('transcript_text', None),
            "ai_summary": r.get('ai_summary', None),
            "ai_tags": r.get('ai_tags', [])
        }
        final_sermons.append(sermon)

    print(f"   ✅ Prepared {len(final_sermons)} sermons for insertion.")

    # 5. Batch Insert into Supabase
    print("\n🔄 Pass 3: Batch Uploading to Supabase...")
    
    total_batches = (len(final_sermons) // BATCH_SIZE) + (1 if len(final_sermons) % BATCH_SIZE > 0 else 0)
    successful_inserts = 0
    
    for i in range(total_batches):
        start_idx = i * BATCH_SIZE
        end_idx = start_idx + BATCH_SIZE
        batch = final_sermons[start_idx:end_idx]
        
        try:
            # We don't want to insert transcripts again and again if we run this multiple times.
            # But the requirement doesn't mention on_conflict for sermons. 
            # We'll just insert.
            res = supabase.table('sermons').insert(batch).execute()
            successful_inserts += len(res.data)
            print(f"   ✅ Batch {i+1}/{total_batches} uploaded successfully ({len(res.data)} records).")
        except Exception as e:
            print(f"   ❌ Error uploading batch {i+1}: {e}")

    print("\n" + "="*70)
    print(f"🎉 SUCCESS: Hydrated database with {successful_inserts} sermons!")
    print("="*70)

if __name__ == '__main__':
    run()
