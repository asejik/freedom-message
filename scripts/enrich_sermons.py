import os
import json
import time
import requests
import re
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or not GROQ_API_KEY:
    print("❌ Missing Supabase or Groq credentials in .env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Groq API Configuration
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
HEADERS = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json"
}

def generate_enrichment(transcript_text, title):
    prompt = f"""You are an expert theologian and sermon summarizer.
Based on the following sermon text (or title if text is short), generate:
1. A concise 2-3 paragraph summary.
2. An array of Key Verses referenced or highly relevant (e.g. ["John 3:16", "Psalm 23:1-4"]). Limit to 5.
3. A specific Prayer Focus based on the sermon's message (1 paragraph).

Title: {title}
Sermon excerpt: {transcript_text[:4000] if transcript_text else "No transcript available."}

Respond EXACTLY in valid JSON format. Do not add markdown blocks like ```json.
{{
  "summary": "...",
  "key_verses": ["...", "..."],
  "prayer_focus": "..."
}}
"""

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "response_format": {"type": "json_object"}
    }

    max_retries = 3
    for attempt in range(max_retries):
        response = requests.post(GROQ_URL, headers=HEADERS, json=payload)
        if response.status_code == 200:
            return response.json()['choices'][0]['message']['content']
        elif response.status_code == 429:
            try:
                error_data = response.json()
                message = error_data.get("error", {}).get("message", "")
                print(f"Rate limited: {message}")
                if "Please try again in" in message:
                    wait_string = message.split("Please try again in")[-1]
                    
                    h_match = re.search(r"([\d.]+)\s*h(?:[^\w]|$)", wait_string)
                    m_match = re.search(r"([\d.]+)\s*m(?:[^\w]|$)", wait_string) 
                    s_match = re.search(r"([\d.]+)\s*s(?:[^\w]|$)", wait_string) 
                    ms_match = re.search(r"([\d.]+)\s*ms(?:[^\w]|$)", wait_string)
                    
                    hours = float(h_match.group(1)) if h_match else 0
                    minutes = float(m_match.group(1)) if m_match and not ms_match else 0
                    seconds = float(s_match.group(1)) if s_match and not ms_match else 0
                    milliseconds = float(ms_match.group(1)) if ms_match else 0
                    
                    total_sleep = (hours * 3600) + (minutes * 60) + seconds + (milliseconds / 1000)
                    
                    if total_sleep > 0:
                        print(f"⏱️ Sleeping for exact cooldown time: {total_sleep:.2f} seconds...")
                        time.sleep(total_sleep + 1)
                    else:
                        print("⚠️ Could not parse exact time, falling back to 5 seconds sleep...")
                        time.sleep(5)
                else:
                    time.sleep(5)
            except Exception as e:
                print(f"Error parsing rate limit: {e}")
                time.sleep(5)
            # Loop will naturally retry after sleeping
        else:
            print(f"Groq error: {response.text}")
            return None
            
    print("❌ Max retries exceeded.")
    return None

def main():
    print("🔍 Fetching sermons that need enrichment...")
    while True:
        # Fetch 10 at a time to respect rate limits
        response = supabase.table("sermons") \
            .select("id, title, transcript_text") \
            .is_("prayer_focus", "null") \
            .limit(10).execute()
        
        sermons = response.data
        if not sermons:
            print("✅ All sermons have been enriched!")
            break

        print(f"Processing batch of {len(sermons)} sermons...")
        
        for sermon in sermons:
            print(f"Enriching: {sermon['title']}")
            
            result_json_str = generate_enrichment(sermon.get('transcript_text'), sermon['title'])
            if not result_json_str:
                print(f"  ❌ Failed to generate for {sermon['id']}")
                time.sleep(2) # Backoff
                continue
            if result_json_str:
                try:
                    parsed_result = json.loads(result_json_str)
                    
                    supabase.table("sermons").update({
                        "ai_summary": parsed_result.get("summary"),
                        "key_verses": parsed_result.get("key_verses", []),
                        "prayer_focus": parsed_result.get("prayer_focus")
                    }).eq("id", sermon["id"]).execute()
                    
                    print("  ✅ Success")
                    # Proactive Pacing: Sleep for 15 seconds to safely stay under the 6000 TPM limit
                    # (Each request is ~1400 tokens. 4 requests per minute = 1 request every 15s)
                    time.sleep(15)
                except Exception as e:
                    print(f"  ❌ DB/JSON Error: {e}")
                    time.sleep(2)

if __name__ == "__main__":
    main()
