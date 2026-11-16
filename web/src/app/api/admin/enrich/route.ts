import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isMessagesAdmin } from '@/utils/supabase/admin';
import Groq from 'groq-sdk';
import { getErrorMessage } from "@/lib/utils";
import { id3TagSize, parseId3 } from "@/lib/id3";
import { detectImageMime } from "@/lib/images";

const GROQ_TIMEOUT_MS = 45_000; // enrichment sends up to 15k characters of transcript

// SDK defaults are a 60 s timeout and 2 retries per call, so a slow Groq could hold a
// request for minutes. Every Groq step here is best-effort, so fail fast instead.
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: GROQ_TIMEOUT_MS,
  maxRetries: 1,
});

// Primary and fallback models available on Groq
const GROQ_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.6-27b"
];

/**
 * Validates that an audio URL is a valid public HTTP/HTTPS URL and not an internal/private address (SSRF mitigation).
 */
function isSafePublicUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    
    // Block localhost and loopback
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0') return false;
    // Block cloud metadata (AWS, GCP, Azure) and private networks (RFC 1918 / RFC 3927)
    if (host.startsWith('169.254.') || host.startsWith('10.') || host.startsWith('192.168.')) return false;
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)) return false;
    
    return true;
  } catch {
    return false;
  }
}

/** True for https?://archive.org or any *.archive.org host (where all sermon audio lives). */
function isArchiveOrgUrl(urlString: string): boolean {
  try {
    const { protocol, hostname } = new URL(urlString);
    const host = hostname.toLowerCase();
    return ['http:', 'https:'].includes(protocol) && (host === 'archive.org' || host.endsWith('.archive.org'));
  } catch {
    return false;
  }
}

const AUDIO_FETCH_TIMEOUT_MS = 20_000;
const FIRST_CHUNK_BYTES = 256 * 1024; // enough for the text tags of any file
// The cover is sent back to the browser as base64 inside the JSON response, and
// Vercel caps a response at 4.5 MB, so larger tags are not downloaded in full.
const MAX_TAG_BYTES = 3 * 1024 * 1024;
const MAX_REDIRECTS = 5;

/**
 * Fetches a byte range, following redirects by hand so that every hop is checked
 * to still be on archive.org (archive.org/download/... redirects to a storage node).
 */
async function fetchArchiveRange(url: string, from: number, to: number): Promise<Response> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isArchiveOrgUrl(current)) throw new Error("The audio link redirected away from archive.org.");
    const res = await fetch(current, {
      headers: { Range: `bytes=${from}-${to}` },
      redirect: 'manual',
      signal: AbortSignal.timeout(AUDIO_FETCH_TIMEOUT_MS),
    });
    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location) {
      await res.body?.cancel();
      current = new URL(location, current).toString();
      continue;
    }
    if (!res.ok) throw new Error(`Audio download failed (HTTP ${res.status}).`);
    return res;
  }
  throw new Error("The audio link redirected too many times.");
}

/** Reads at most `limit` bytes of a response, then stops the download. */
async function readBytes(res: Response, limit: number): Promise<Buffer> {
  if (!res.body) return Buffer.alloc(0);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (received < limit) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
  }
  await reader.cancel();
  return Buffer.concat(chunks).subarray(0, limit);
}

/**
 * Downloads only the ID3 tag at the start of an archive.org MP3 (not the audio)
 * and returns its text fields plus the embedded cover image, if any.
 */
async function readAudioTags(audioUrl: string) {
  const firstRes = await fetchArchiveRange(audioUrl, 0, FIRST_CHUNK_BYTES - 1);
  let bytes = await readBytes(firstRes, FIRST_CHUNK_BYTES);

  const tagSize = id3TagSize(bytes);
  if (tagSize === null) {
    return { tag: null, image: null, note: "This audio file has no embedded details or artwork (no ID3 tag)." };
  }

  let note: string | null = null;
  if (tagSize > bytes.length) {
    if (tagSize > MAX_TAG_BYTES) {
      note = "The embedded artwork is too large to extract automatically. Please upload it instead.";
    } else if (firstRes.status === 206) {
      const restRes = await fetchArchiveRange(audioUrl, bytes.length, tagSize - 1);
      if (restRes.status === 206) {
        bytes = Buffer.concat([bytes, await readBytes(restRes, tagSize - bytes.length)]);
      } else {
        await restRes.body?.cancel();
      }
    }
  }

  const tag = parseId3(bytes);
  const mime = tag.picture ? detectImageMime(tag.picture) : null;
  const image = tag.picture && mime ? { mime, base64: tag.picture.toString('base64') } : null;
  if (!image && !note) {
    note = tag.picture
      ? "The embedded artwork is in a format that can't be used (only JPEG, PNG and WebP)."
      : "No embedded artwork was found in this audio file.";
  }
  return { tag, image, note };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Verify Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isMessagesAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { audio_url, transcript_text, title: inputTitle } = body;

    if (!audio_url && !transcript_text && !inputTitle) {
      return NextResponse.json({ error: "Please provide an audio URL, transcript, or title to enrich." }, { status: 400 });
    }

    if (audio_url && typeof audio_url === 'string' && !isSafePublicUrl(audio_url.trim())) {
      return NextResponse.json({ error: "Invalid audio URL. Only public HTTP/HTTPS URLs are allowed." }, { status: 400 });
    }

    const result: {
      title?: string | null;
      preacher?: string | null;
      series?: string | null;
      date_preached?: string | null;
      /** Cover found inside the MP3; the form compresses and uploads it. */
      artwork_image?: { mime: string; base64: string } | null;
      ai_summary?: string | null;
      ai_tags?: string[];
      key_verses?: string[];
      prayer_focus?: string | null;
      audio_error?: string | null;
      ai_error?: string | null;
    } = {
      title: inputTitle || null,
      preacher: null,
      series: null,
      date_preached: null,
      artwork_image: null,
      ai_summary: null,
      ai_tags: [],
      key_verses: [],
      prayer_focus: null,
    };

    // 2. Audio Metadata & Artwork Extraction (if audio_url provided)
    //    The tag is downloaded server-side, so only allow the host the library
    //    actually uses rather than any "public-looking" URL.
    if (audio_url && audio_url.trim() && !isArchiveOrgUrl(audio_url.trim())) {
      result.audio_error = "Automatic audio details are only read from archive.org links.";
    } else if (audio_url && audio_url.trim()) {
      try {
        const { tag, image, note } = await readAudioTags(audio_url.trim());
        if (tag) {
          if (tag.title && !result.title) result.title = tag.title;
          if (tag.artist) result.preacher = tag.artist;
          if (tag.album) result.series = tag.album;
          if (tag.date) {
            // Tags hold "2024", "2024-05" or a full timestamp; the form needs YYYY-MM-DD.
            const [, year, month, day] = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/.exec(tag.date) ?? [];
            if (year) result.date_preached = `${year}-${month ?? '01'}-${day ?? '01'}`;
          }
        }
        result.artwork_image = image;
        if (note) result.audio_error = note;
      } catch (audioErr) {
        console.warn("[ENRICH API] Audio extraction note:", getErrorMessage(audioErr));
        result.audio_error = getErrorMessage(audioErr) || "Audio metadata extraction skipped or failed";
      }
    }

    // 3. AI Enrichment with Groq (if transcript or title provided)
    const effectiveTitle = result.title || inputTitle || "";
    const textForAnalysis = (transcript_text && transcript_text.trim()) 
      ? transcript_text.trim().slice(0, 15000) 
      : null;

    if (process.env.GROQ_API_KEY && (textForAnalysis || effectiveTitle)) {
      let aiSuccess = false;

      for (const model of GROQ_MODELS) {
        try {
          const promptContent = textForAnalysis
            ? `Sermon Title (if known): ${effectiveTitle || "Unknown"}\n\nTranscript Excerpt:\n${textForAnalysis}`
            : `Sermon Title: ${effectiveTitle}\n(Enrich based on the sermon title and biblical context.)`;

          const completion = await groq.chat.completions.create({
            model,
            messages: [
              {
                role: "system",
                content: `You are an expert Christian theologian, sermon archivist, and content curator.
Analyze the sermon transcript and title to extract metadata for a church audio library.
Return a valid JSON object with EXACTLY the following keys:
{
  "title": "A clear, compelling title for the sermon (if not already clearly titled, extract from the message)",
  "preacher": "The preacher/speaker name mentioned in the transcript or context (e.g. Apostle Muyiwa Areo, Pastor Temitope Areo)",
  "date_preached": "Estimated or mentioned date in YYYY-MM-DD format, or null if unknown",
  "summary": "A comprehensive 2-3 paragraph theological summary of the sermon's core message, revelation, and teachings (About this Sermon).",
  "tags": ["3 to 6 high-level thematic tags, e.g. Faith, Grace, Spiritual Authority, Purpose, Healing"],
  "key_verses": ["List of 3 to 6 scriptures referenced or central to the message, e.g. Ephesians 1:16-23, Romans 8:1"],
  "prayer_focus": "A structured bulleted list of 3-6 actionable prayer points or declarations derived from the sermon (e.g. • For revelation of God's purpose\\n• For grace to walk in dominion...)"
}`
              },
              { role: "user", content: promptContent }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
          });

          const rawContent = completion.choices[0]?.message?.content || '{}';
          const parsedAI = JSON.parse(rawContent);

          if (parsedAI.title && !result.title) result.title = parsedAI.title;
          if (parsedAI.preacher && !result.preacher) result.preacher = parsedAI.preacher;
          if (parsedAI.date_preached && !result.date_preached && /^\d{4}-\d{2}-\d{2}$/.test(parsedAI.date_preached)) {
            result.date_preached = parsedAI.date_preached;
          }
          if (parsedAI.summary) result.ai_summary = parsedAI.summary;
          if (Array.isArray(parsedAI.tags)) result.ai_tags = parsedAI.tags;
          if (Array.isArray(parsedAI.key_verses)) result.key_verses = parsedAI.key_verses;
          if (parsedAI.prayer_focus) {
            result.prayer_focus = typeof parsedAI.prayer_focus === 'string'
              ? parsedAI.prayer_focus
              : Array.isArray(parsedAI.prayer_focus)
                ? parsedAI.prayer_focus.map((p: string) => `• ${p}`).join('\n')
                : String(parsedAI.prayer_focus);
          }

          aiSuccess = true;
          break; // Successfully enriched with current model
        } catch (aiErr) {
          console.warn(`[ENRICH API] Model ${model} failed, trying next fallback:`, getErrorMessage(aiErr));
          result.ai_error = getErrorMessage(aiErr);
        }
      }

      if (!aiSuccess) {
        console.error("[ENRICH API] All Groq models failed:", result.ai_error);
      }
    }

    return NextResponse.json({ data: result });

  } catch (error) {
    console.error("[ENRICH API] Server error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) || "Internal server error during enrichment" },
      { status: 500 }
    );
  }
}
