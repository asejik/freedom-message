import json
import re
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv("web/.env.local")
supabase = create_client(os.getenv("NEXT_PUBLIC_SUPABASE_URL"), os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY"))

with open("output/sermon_analysis.json") as f:
    data = json.load(f)

db_sermons = []
offset = 0
limit = 1000
while True:
    res = supabase.table("sermons").select("id, title").range(offset, offset+limit-1).execute()
    if not res.data: break
    db_sermons.extend(res.data)
    if len(res.data) < limit: break
    offset += limit

title_to_id = {s['title'].lower().strip(): s['id'] for s in db_sermons}

def clean(filename):
    name = re.sub(r'\.txt$', '', filename)
    name = re.sub(r'^\d+_', '', name)
    return name.strip().lower()

matches = 0
misses = []
for item in data:
    f = item.get("filename", "")
    t = clean(f)
    if t in title_to_id:
        matches += 1
    else:
        # try fuzzy
        found = False
        for dt in title_to_id.keys():
            if t in dt or dt in t:
                matches += 1
                found = True
                break
        if not found:
            misses.append(t)

print(f"Matches: {matches}")
print(f"Misses: {len(misses)}")
if misses:
    print("Example misses:")
    for m in misses[:10]:
        print(f" - {m}")
