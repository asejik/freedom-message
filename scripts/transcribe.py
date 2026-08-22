import os
from faster_whisper import WhisperModel

# Define your folders
INPUT_FOLDER = "./audio_files"
OUTPUT_FOLDER = "./transcripts"

os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Load the model.
# "small" is a good balance of speed and accuracy.
# If you have an NVIDIA GPU, change device to "cuda" and compute_type to "float16".
print("Loading Whisper model...")
model = WhisperModel("small", device="cpu", compute_type="int8")

valid_extensions = (".mp3", ".wav", ".m4a", ".aac", ".flac")

# Loop through all files in the folder
for filename in os.listdir(INPUT_FOLDER):
    if filename.lower().endswith(valid_extensions):
        filepath = os.path.join(INPUT_FOLDER, filename)
        output_filepath = os.path.join(OUTPUT_FOLDER, filename.rsplit('.', 1)[0] + ".txt")

        # Skip files that already have a transcript
        if os.path.exists(output_filepath):
            print(f"Skipping {filename} - already transcribed.")
            continue

        print(f"Processing: {filename}...")

        # Start transcription
        segments, info = model.transcribe(filepath, beam_size=5)

        # Save text to file as it processes
        with open(output_filepath, "w", encoding="utf-8") as f:
            for segment in segments:
                f.write(segment.text + "\n")

        print(f"Finished saving: {filename}.txt")

print("All audio files transcribed.")