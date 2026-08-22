import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { supabase, SERMON_LIST_SELECT } from '@/lib/supabase';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ── In-memory LRU intent cache (avoids redundant Groq calls for repeated queries) ──
const INTENT_CACHE_MAX = 100;
const INTENT_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const intentCache = new Map<string, { intent: { topic: string; preacher: string | null }; ts: number }>();

function getCachedIntent(key: string) {
  const entry = intentCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > INTENT_CACHE_TTL_MS) {
    intentCache.delete(key);
    return null;
  }
  return entry.intent;
}

function setCachedIntent(key: string, intent: { topic: string; preacher: string | null }) {
  // Evict oldest if at capacity
  if (intentCache.size >= INTENT_CACHE_MAX) {
    const oldest = intentCache.keys().next().value;
    if (oldest !== undefined) intentCache.delete(oldest);
  }
  intentCache.set(key, { intent, ts: Date.now() });
}

// ── In-memory Rate Limiter (30 requests/min per IP) ──
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  // Periodic cleanup if map grows
  if (rateLimitMap.size > 1000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetTime) rateLimitMap.delete(k);
    }
  }

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  entry.count += 1;
  return false;
}

export async function GET(request: Request) {
  try {
    // 0. Rate limiting check
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'client-ip';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many search requests. Please slow down and try again shortly." },
        { status: 429 }
      );
    }

    // Early env validation — surface missing keys clearly
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("[SEARCH API ERROR]: Missing Supabase environment variables.");
      return NextResponse.json(
        { error: "Server misconfiguration: Missing Supabase environment variables." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // 1. No query -> Return latest sermons
    if (!query || !query.trim()) {
      const { data, error } = await supabase
        .from('sermons')
        .select(SERMON_LIST_SELECT)
        .order('date_preached', { ascending: false })
        .limit(20);

      if (error) {
        console.error("[SEARCH API ERROR] Supabase latest fetch:", error);
        throw error;
      }
      return NextResponse.json({ answer: null, results: data ?? [] });
    }

    // 2. Extract intent with Groq (best-effort, with fallback and caching)
    const cacheKey = query.trim().toLowerCase();
    let intent = getCachedIntent(cacheKey);

    if (!intent) {
      intent = { topic: query.trim(), preacher: null };

      if (process.env.GROQ_API_KEY) {
        try {
          const completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
              {
                role: "system",
                content: `You are a search intent extractor for a church sermon database.
Extract the core topic from the user's query (1 to 3 words max), and the preacher's name (if mentioned).
IMPORTANT: "topic" MUST be a short phrase or keyword (e.g. "faith", "love commandment", "healing", "vision"). Do NOT return long sentences.
Return a strict JSON object with EXACTLY two keys: "topic" (string) and "preacher" (string | null).
Example: "messages on the love commandment by pastor temi" -> {"topic": "love commandment", "preacher": "temi"}`
              },
              { role: "user", content: query }
            ],
            temperature: 0,
            response_format: { type: "json_object" }
          });

          const parsed = JSON.parse(completion.choices[0].message.content || '{}');
          if (parsed.topic) intent.topic = parsed.topic;
          if (parsed.preacher) intent.preacher = parsed.preacher;
        } catch (groqErr) {
          console.warn("[SEARCH API WARN] Groq intent extraction failed, using raw query:", groqErr);
        }
      }

      setCachedIntent(cacheKey, intent);
    }

    // 3. Query Supabase with explicit field selection (no transcript_text)
    const safeTopic = intent.topic.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();

    // Use !inner for preacher join when filtering by preacher
    let searchSelect = SERMON_LIST_SELECT;
    if (intent.preacher) {
      searchSelect = searchSelect.replace('preachers(id, name)', 'preachers!inner(id, name)');
    }
    
    let dbQuery = supabase
      .from('sermons')
      .select(searchSelect)
      .or(`title.ilike.%${safeTopic}%,ai_summary.ilike.%${safeTopic}%`);

    if (intent.preacher) {
      dbQuery = dbQuery.ilike('preachers.name', `%${intent.preacher}%`);
    }

    // Fetch a focused candidate pool (top 50 is sufficient since we keep top 20 after scoring)
    const { data, error } = await dbQuery.order('date_preached', { ascending: false }).limit(50);

    if (error) {
      console.error("[SEARCH API ERROR] Supabase search query:", error);
      throw error;
    }

    let results = (data as any[]) ?? [];

    // 4. Rigorous Relevance Scoring
    if (safeTopic) {
      const lowerTopic = safeTopic.toLowerCase();
      
      const getScore = (sermon: any) => {
        let score = 0;
        const title = (sermon.title || "").toLowerCase();
        const summary = (sermon.ai_summary || "").toLowerCase();
        
        if (title === lowerTopic) score += 100; // Exact match
        else if (title.includes(lowerTopic)) {
          // If the title contains the phrase, it's highly relevant.
          score += 60;
          // Bonus if it starts with the topic
          if (title.startsWith(lowerTopic)) score += 10;
        }
        else if (summary.includes(lowerTopic)) score += 20;
        
        return score;
      };

      results.sort((a, b) => {
        const scoreA = getScore(a);
        const scoreB = getScore(b);
        if (scoreA !== scoreB) {
          return scoreB - scoreA; // Highest score first
        }
        // Tie-breaker: Latest date first
        const dateA = new Date(a.date_preached).getTime();
        const dateB = new Date(b.date_preached).getTime();
        return dateB - dateA;
      });
      
      // Slice top 20 dominant results
      results = results.slice(0, 20);
    }

    // 5. Conversational RAG response
    let answer = null;
    if (process.env.GROQ_API_KEY && results.length > 0) {
      try {
        const topContext = results.slice(0, 5).map(s => `- Title: "${s.title}"\nPreacher: ${s.preachers?.name}\nDate: ${s.date_preached}\nSummary: ${s.ai_summary}`).join("\n\n");
        
        const ragCompletion = await groq.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content: `You are an AI assistant for a church sermon database. Based ONLY on the provided sermon results, answer the user's search query in an organized, helpful, and concise manner.
Rules:
- Start with a brief 1-sentence introduction.
- If referencing multiple sermons, list each on its own line prefixed with "• " (e.g. • "Title" – explanation).
- Do NOT use markdown bold asterisks (no '**' or '*').
- Keep each description concise (1 sentence).
- Optionally end with a 1-sentence helpful summary.`
            },
            {
              role: "user",
              content: `User query: "${query}"\n\nSearch Results:\n${topContext}`
            }
          ],
          temperature: 0.3,
        });

        let rawAnswer = ragCompletion.choices[0].message.content || "";
        // Clean any accidental markdown asterisks or bullet formatting artifacts
        rawAnswer = rawAnswer
          .replace(/\*\*/g, '')
          .replace(/\n\s*\*\s*/g, '\n• ')
          .replace(/\s*\*\s*(?=[“"A-Z0-9])/g, '\n• ')
          .trim();

        answer = rawAnswer || null;
      } catch (ragErr) {
        console.warn("[SEARCH API WARN] Groq RAG generation failed:", ragErr);
      }
    }

    return NextResponse.json({ answer, results });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[SEARCH API ERROR]:", message);
    return NextResponse.json(
      { error: `Search failed: ${message}` },
      { status: 500 }
    );
  }
}
