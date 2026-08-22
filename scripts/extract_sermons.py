import requests
from bs4 import BeautifulSoup
import csv
import urllib.parse
import os

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_DIR    = os.path.join(SCRIPT_DIR, '..', 'csv')
os.makedirs(CSV_DIR, exist_ok=True)

# 1. Define the target URL
base_url = "https://archive.org/download/clc-2024-sermons/"
response = requests.get(base_url)
soup = BeautifulSoup(response.text, "html.parser")

mp3_data = []

# 2. Extract all .mp3 links
for link in soup.find_all("a"):
    href = link.get("href")
    if href and href.endswith(".mp3"):
        full_url = base_url + href
        clean_name = urllib.parse.unquote(href).replace(".mp3", "")
        mp3_data.append([clean_name, full_url])

# 3. Export to a spreadsheet (CSV)
with open(os.path.join(CSV_DIR, "sermon_urls.csv"), "w", newline="", encoding="utf-8") as file:
    writer = csv.writer(file)
    writer.writerow(["Sermon Title", "Audio URL"])
    writer.writerows(mp3_data)

print(f"Successfully extracted {len(mp3_data)} MP3 URLs to sermon_urls.csv")
