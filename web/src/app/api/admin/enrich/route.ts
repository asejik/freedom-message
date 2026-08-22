import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Groq from 'groq-sdk';
import { execFile } from 'child_process';
import path from 'path';
import util from 'util';

const execFileAsync = util.promisify(execFile);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
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

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Verify Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      artwork_url?: string | null;
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
      artwork_url: null,
      ai_summary: null,
      ai_tags: [],
      key_verses: [],
      prayer_focus: null,
    };

    // 2. Audio Metadata & Artwork Extraction (if audio_url provided)
    if (audio_url && audio_url.trim()) {
      try {
        const pythonBin = path.resolve(process.cwd(), '../.venv/bin/python');
        const scriptPath = path.resolve(process.cwd(), '../scripts/extract_audio_metadata.py');

        const { stdout } = await execFileAsync(pythonBin, [scriptPath, audio_url.trim()], {
          timeout: 45000,
        });

        if (stdout && stdout.trim()) {
          const parsedAudio = JSON.parse(stdout.trim());
          if (parsedAudio.title && !result.title) result.title = parsedAudio.title;
          if (parsedAudio.preacher) result.preacher = parsedAudio.preacher;
          if (parsedAudio.series) result.series = parsedAudio.series;
          if (parsedAudio.date_preached) {
            let d = parsedAudio.date_preached;
            if (/^\d{4}$/.test(d)) {
              d = `${d}-01-01`;
            }
            result.date_preached = d;
          }
          if (parsedAudio.artwork_url) result.artwork_url = parsedAudio.artwork_url;
          if (parsedAudio.error) result.audio_error = parsedAudio.error;
        }
      } catch (audioErr: any) {
        console.warn("[ENRICH API] Audio extraction note:", audioErr.message);
        result.audio_error = audioErr.message || "Audio metadata extraction skipped or failed";
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
        } catch (aiErr: any) {
          console.warn(`[ENRICH API] Model ${model} failed, trying next fallback:`, aiErr.message);
          result.ai_error = aiErr.message;
        }
      }

      if (!aiSuccess) {
        console.error("[ENRICH API] All Groq models failed:", result.ai_error);
      }
    }

    return NextResponse.json({ data: result });

  } catch (error: any) {
    console.error("[ENRICH API] Server error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during enrichment" },
      { status: 500 }
    );
  }
}
