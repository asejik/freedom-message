import csv
import json
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_DIR    = os.path.join(SCRIPT_DIR, '..', 'csv')

urls = []
with open(os.path.join(CSV_DIR, 'sermon_urls.csv'), 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    next(reader) # skip header
    for row in reader:
        if len(row) > 1:
            urls.append(row[1])

code_template = f"""import assemblyai as aai
import os
import urllib.parse # We added this to clean up the %20 characters

aai.settings.api_key = "85067b2a9a8048bbb46997a504037a02"

output_dir = "/content/drive/MyDrive/Audio_Transcripts"
os.makedirs(output_dir, exist_ok=True)

audio_urls = {json.dumps(urls, indent=4)}

print(f"Starting batch transcription for {{len(audio_urls)}} files...")

config = aai.TranscriptionConfig(speaker_labels=False, format_text=True)
transcriber = aai.Transcriber()
transcripts = transcriber.transcribe_group(audio_urls, config=config)

# We added 'enumerate' here to count each file starting at 1
for index, transcript in enumerate(transcripts, start=1):
    if transcript.status == aai.TranscriptStatus.error:
        print(f"Error on {{transcript.audio_url}}: {{transcript.error}}")
        continue
        
    # 1. Extract the raw filename from the URL
    raw_name = transcript.audio_url.split('/')[-1].split('?')[0]
    
    # 2. Decode the %20 (spaces) and %27 (apostrophes) into normal text
    clean_name = urllib.parse.unquote(raw_name)
    
    # 3. Strip the .mp3/.wav extension off the end if it exists
    if "." in clean_name:
        clean_name = clean_name.rsplit(".", 1)[0]
        
    # 4. Prepend the number so it is guaranteed unique (e.g., 1_Aligning_And_Realigning.txt)
    final_filename = f"{{index}}_{{clean_name}}.txt"
    file_path = os.path.join(output_dir, final_filename)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(transcript.text)
        
    print(f"Saved: {{final_filename}}")
    
print("Batch complete! Check your Google Drive.")
"""

with open(os.path.join(SCRIPT_DIR, 'assemblyai_script.py'), 'w', encoding='utf-8') as f:
    f.write(code_template)
print("Generated assemblyai_script.py successfully!")
