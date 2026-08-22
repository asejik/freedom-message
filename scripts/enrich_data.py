"""
enrich_data.py — CLC Sermon Platform: Groq AI Enrichment Pipeline
=================================================================
Epic 3b: Aggressively optimized script to generate AI summaries and tags
from transcripts using the Groq Cloud API.

Features:
  - Incremental Processing: Resumes from where it left off by checking `clc_enriched_staging.json`.
  - Strict Rate Limiting: 4-second delay between calls to respect free tier RPM/TPM.
  - Exponential Backoff: Retries up to 3 times on 429/503 errors.
  - Zero Data Loss: Overwrites the JSON output file after *every single* successful call.
  - Fast Model: Uses `llama3-8b-8192` with strict JSON mode.

Prerequisites:
  1. Create a `.env` file in this `scripts/` directory.
  2. Add your Groq API key: `GROQ_API_KEY=your_key_here`
"""

import os
import json
import time
import sys
from dotenv import load_dotenv
from groq import Groq, APIError

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR    = os.path.dirname(os.path.abspath(__file__))
ENV_PATH      = os.path.join(SCRIPT_DIR, '.env')
ROOT          = os.path.join(SCRIPT_DIR, '..')
INPUT_PATH    = os.path.join(ROOT, 'output', 'clc_consolidated_staging.json')
OUTPUT_PATH   = os.path.join(ROOT, 'output', 'clc_enriched_staging.json')

# ── Load Environment & Groq Client ────────────────────────────────────────────
load_dotenv(ENV_PATH)
api_key = os.getenv('GROQ_API_KEY')

if not api_key:
    print(f"❌ ERROR: GROQ_API_KEY not found.")
    print(f"Please create a .env file at {ENV_PATH} and add your key.")
    sys.exit(1)

client = Groq(api_key=api_key)
MODEL_NAME = "llama-3.1-8b-instant"

# ── Configuration ─────────────────────────────────────────────────────────────
RATE_LIMIT_DELAY = 4.0        # Seconds to wait between every call
MAX_RETRIES      = 3          # Max retries for 429/503 errors
BASE_BACKOFF     = 10.0       # Base backoff time in seconds (multiplied on retry)
MAX_TOKENS       = 2500       # Rough limit to avoid hitting TPM limits on large transcripts

SYSTEM_PROMPT = """You are an expert theologian and content summarizer.
Your task is to analyze the provided church sermon transcript and extract:
1. A concise 2-3 sentence summary (`summary`).
2. A list of 3-5 thematic keywords or tags (`tags`).

You MUST return your response as a raw, valid JSON object with EXACTLY these two keys: "summary" (string) and "tags" (array of strings). Do NOT wrap the JSON in markdown blocks like ```json. Do NOT include any other text."""

def get_enrichment(transcript: str) -> dict:
    """Calls Groq API to get summary and tags. Implements retry and backoff."""
    # Truncate transcript to avoid massive token consumption
    # Rough estimate: 1 char = ~0.25 tokens. Let's limit to first 10,000 chars.
    truncated_text = transcript[:10000]

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Transcript:\n{truncated_text}"}
                ],
                temperature=0.3,
                max_tokens=300,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from Groq")
                
            return json.loads(content)

        except Exception as e:
            err_msg = str(e).lower()
            if "429" in err_msg or "503" in err_msg or "rate limit" in err_msg:
                if attempt == MAX_RETRIES:
                    print(f"      ❌ Failed after {MAX_RETRIES} attempts due to rate limits: {e}")
                    return None
                wait_time = BASE_BACKOFF * (2 ** (attempt - 1))
                print(f"      ⚠️ Rate limited. Retrying in {wait_time}s (Attempt {attempt}/{MAX_RETRIES})...")
                time.sleep(wait_time)
            else:
                print(f"      ❌ API Error: {e}")
                return None

    return None

def run():
    print('=' * 70)
    print('  CLC Sermon Platform — Groq AI Enrichment Pipeline')
    print('=' * 70)

    # 1. Load Data (incremental logic)
    if os.path.exists(OUTPUT_PATH):
        print(f"Loading existing enriched data from {OUTPUT_PATH}...")
        with open(OUTPUT_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
    else:
        if not os.path.exists(INPUT_PATH):
            print(f"❌ Input file {INPUT_PATH} not found. Run pipeline.py first.")
            sys.exit(1)
        print(f"Loading raw staging data from {INPUT_PATH}...")
        with open(INPUT_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)

    records = data.get('records', [])
    total_records = len(records)
    
    # Count how many are left
    pending_records = [r for r in records if r.get('ai_summary') is None and r.get('transcript_text')]
    processed_count = total_records - len(pending_records)
    
    print(f"Total Records: {total_records}")
    print(f"Already Processed: {processed_count}")
    print(f"Pending Enrichment: {len(pending_records)}\n")

    if len(pending_records) == 0:
        print("✅ All records enriched. Pipeline complete!")
        sys.exit(0)

    # 2. Process Loop
    try:
        for idx, record in enumerate(records):
            if record.get('ai_summary') is not None:
                continue
                
            transcript = record.get('transcript_text')
            if not transcript:
                continue

            sn = record['sn']
            title = record['title']
            year = record['year']
            
            print(f"[{year}] Processing S/N {sn}: {title[:40]}...")
            
            # API Call
            result = get_enrichment(transcript)
            
            if result:
                record['ai_summary'] = result.get('summary')
                record['ai_tags'] = result.get('tags', [])
                
                # Zero Data Loss: Save immediately after success
                with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print(f"      ✅ Saved. Waiting {RATE_LIMIT_DELAY}s...")
            else:
                print(f"      ⏭️ Skipped due to error.")
                
            # Strict Rate Limiting
            time.sleep(RATE_LIMIT_DELAY)
            
    except KeyboardInterrupt:
        print("\n\n⏸️ Script interrupted by user. Progress has been saved.")
        print(f"Run the script again to resume from where you left off.")
        sys.exit(0)

    print("\n✅ Enrichment Pipeline Complete!")

if __name__ == '__main__':
    run()
