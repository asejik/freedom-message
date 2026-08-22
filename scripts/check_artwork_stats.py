import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv("web/.env.local")
supabase = create_client(os.getenv("NEXT_PUBLIC_SUPABASE_URL"), os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY"))

offset = 0
limit = 1000
total = 0
has_url = 0
empty = 0
errors = 0
nulls = 0

while True:
    res = supabase.table("sermons").select("artwork_url").range(offset, offset+limit-1).execute()
    if not res.data: break
    for row in res.data:
        total += 1
        val = row.get("artwork_url")
        if val is None:
            nulls += 1
        elif val == "":
            empty += 1
        elif val == "ERROR":
            errors += 1
        else:
            has_url += 1
    if len(res.data) < limit: break
    offset += limit

print(f"Total Sermons: {total}")
print(f"Valid Artwork URLs: {has_url}")
print(f"Marked Empty (\"\"): {empty}")
print(f"Marked ERROR: {errors}")
print(f"Unprocessed (NULL): {nulls}")
