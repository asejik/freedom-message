import os
import sys
import json
import io
import uuid
import tempfile
import requests
from dotenv import load_dotenv
import mutagen
from mutagen.id3 import ID3, APIC
from mutagen.mp3 import MP3
from PIL import Image
from supabase import create_client, Client

# Load environment variables
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "../web/.env.local"))
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

BUCKET_NAME = "artwork"

def get_supabase_client():
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    try:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        sys.stderr.write(f"Supabase client init error: {e}\n")
        return None

def process_and_upload_image(raw_bytes: bytes) -> str:
    """Process raw image bytes to WebP and upload to Supabase Storage."""
    img = Image.open(io.BytesIO(raw_bytes))
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
    img.thumbnail((600, 600), Image.Resampling.LANCZOS)
    
    output = io.BytesIO()
    img.save(output, format="WEBP", quality=88)
    webp_bytes = output.getvalue()

    supabase = get_supabase_client()
    if not supabase:
        return None

    file_name = f"{uuid.uuid4()}.webp"
    supabase.storage.from_(BUCKET_NAME).upload(
        file_name,
        webp_bytes,
        file_options={"content-type": "image/webp", "upsert": "true"}
    )
    return supabase.storage.from_(BUCKET_NAME).get_public_url(file_name)

def extract_metadata(audio_url: str):
    result = {
        "title": None,
        "preacher": None,
        "series": None,
        "date_preached": None,
        "artwork_url": None,
        "error": None
    }

    if not audio_url:
        result["error"] = "No audio URL provided"
        return result

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "*/*"
    }

    tmp_path = None
    try:
        clean_url = audio_url.strip()
        
        # 1. First try: Download first 8MB with Range request for instant extraction
        range_headers = {**headers, "Range": "bytes=0-8388608"}
        r = requests.get(clean_url, headers=range_headers, timeout=20, allow_redirects=True)
        r.raise_for_status()

        fd, tmp_path = tempfile.mkstemp(suffix=".mp3")
        with os.fdopen(fd, 'wb') as f:
            f.write(r.content)

        found_artwork = False

        # Attempt extraction using ID3
        try:
            audio = ID3(tmp_path)
            if 'TIT2' in audio and audio['TIT2'].text:
                result["title"] = str(audio['TIT2'].text[0]).strip()
            if 'TPE1' in audio and audio['TPE1'].text:
                result["preacher"] = str(audio['TPE1'].text[0]).strip()
            elif 'TPE2' in audio and audio['TPE2'].text:
                result["preacher"] = str(audio['TPE2'].text[0]).strip()
            if 'TALB' in audio and audio['TALB'].text:
                result["series"] = str(audio['TALB'].text[0]).strip()
            if 'TDRC' in audio and audio['TDRC'].text:
                result["date_preached"] = str(audio['TDRC'].text[0]).strip()
            elif 'TYER' in audio and audio['TYER'].text:
                result["date_preached"] = str(audio['TYER'].text[0]).strip()

            apics = audio.getall('APIC')
            if apics:
                artwork_url = process_and_upload_image(apics[0].data)
                if artwork_url:
                    result["artwork_url"] = artwork_url
                    found_artwork = True
        except Exception as e:
            sys.stderr.write(f"ID3 initial check note: {e}\n")

        # 2. Fallback: If artwork wasn't in the first 8MB, download the full MP3 file
        if not found_artwork and r.status_code == 206:
            try:
                os.remove(tmp_path)
                full_r = requests.get(clean_url, headers=headers, timeout=60, stream=True, allow_redirects=True)
                full_r.raise_for_status()
                
                fd, tmp_path = tempfile.mkstemp(suffix=".mp3")
                with os.fdopen(fd, 'wb') as f:
                    for chunk in full_r.iter_content(chunk_size=32768):
                        f.write(chunk)

                full_audio = ID3(tmp_path)
                apics = full_audio.getall('APIC')
                if apics:
                    artwork_url = process_and_upload_image(apics[0].data)
                    if artwork_url:
                        result["artwork_url"] = artwork_url
            except Exception as full_err:
                sys.stderr.write(f"Full download check note: {full_err}\n")

    except Exception as fetch_err:
        result["error"] = f"Audio download failed: {str(fetch_err)}"
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass

    return result

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing audio URL argument"}))
        sys.exit(1)

    url = sys.argv[1]
    data = extract_metadata(url)
    print(json.dumps(data))
