import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { supabase, SERMON_CARD_SELECT } from '@/lib/supabase';

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

const MAX_QUERY_LENGTH = 200;

// Words too common to narrow a sermon search
const SEARCH_STOPWORDS = new Set([
  'a', 'an', 'and', 'the', 'of', 'on', 'in', 'to', 'for', 'by', 'with',
  'about', 'is', 'are', 'how', 'what', 'my', 'your', 'our',
]);

// Distinct meaningful words from the extracted topic (capped to keep the filter small)
function topicWords(topic: string): string[] {
  const words = topic.toLowerCase().split(/\s+/).filter((w) => w.length > 1 && !SEARCH_STOPWORDS.has(w));
  return Array.from(new Set(words)).slice(0, 5);
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

    // Bound prompt size: every character here is sent to (and billed by) the AI provider
    if (query && query.length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        { error: `Search is limited to ${MAX_QUERY_LENGTH} characters. Please shorten your question.` },
        { status: 400 }
      );
    }

    // 1. No query -> Return latest sermons
    if (!query || !query.trim()) {
      const { data, error } = await supabase
        .from('sermons')
        .select(SERMON_CARD_SELECT)
        .order('date_preached', { ascending: false })
        .limit(20);

      if (error) {
        console.error("[SEARCH API ERROR] Supabase latest fetch:", error);
        throw error;
      }
      // Same "latest sermons" list for every visitor: cache at the CDN for 5 minutes
      return NextResponse.json(
        { answer: null, results: data ?? [] },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } }
      );
    }

    // 2. Extract intent with Groq (best-effort, with fallback and caching)
    const cacheKey = query.trim().toLowerCase();
    let intent = getCachedIntent(cacheKey);

    if (!intent) {
      intent = { topic: query.trim(), preacher: null };

      if (process.env.GROQ_API_KEY) {
        try {
          // Small model + low reasoning: this only extracts a 1-3 word topic
          const completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            reasoning_effort: "low",
            max_completion_tokens: 200,
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

    // Card fields plus ai_summary, which is needed server-side for scoring and
    // the RAG answer but stripped before responding (cards never display it).
    // Use !inner for preacher join when filtering by preacher
    let searchSelect = `${SERMON_CARD_SELECT}, ai_summary`;
    if (intent.preacher) {
      searchSelect = searchSelect.replace('preachers(id, name)', 'preachers!inner(id, name)');
    }
    
    // Match words individually so "holy spirit baptism" finds "The Baptism of the Holy Spirit"
    const words = topicWords(safeTopic);
    const wordMatch = (word: string) => `title.ilike.%${word}%,ai_summary.ilike.%${word}%`;

    // Fetch a focused candidate pool (top 50 is sufficient since we keep top 20 after scoring)
    const runQuery = (orFilter: string) => {
      let dbQuery = supabase.from('sermons').select(searchSelect).or(orFilter);
      if (intent.preacher) {
        dbQuery = dbQuery.ilike('preachers.name', `%${intent.preacher}%`);
      }
      return dbQuery.order('date_preached', { ascending: false }).limit(50);
    };

    // Every word must appear in the title or summary; with 0–1 words this is the old single-term match
    const allWordsFilter = words.length > 1
      ? `and(${words.map((w) => `or(${wordMatch(w)})`).join(',')})`
      : wordMatch(words[0] ?? safeTopic);

    let { data, error } = await runQuery(allWordsFilter);

    // No sermon has every word: fall back to any of them (scoring ranks those matching more words first)
    if (!error && (data?.length ?? 0) === 0 && words.length > 1) {
      ({ data, error } = await runQuery(words.map(wordMatch).join(',')));
    }

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

        // Per-word relevance, so sermons matching more of the query rank higher
        for (const word of words) {
          if (title.includes(word)) score += 15;
          else if (summary.includes(word)) score += 5;
        }
        
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
          reasoning_effort: "low",
          max_completion_tokens: 800, // includes reasoning tokens; answer is ~7 short lines
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

    const cardResults = results.map((sermon) => {
      const card = { ...sermon };
      delete card.ai_summary;
      return card;
    });

    return NextResponse.json({ answer, results: cardResults });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    // Details stay in the server log; clients get a generic message (no DB internals)
    console.error("[SEARCH API ERROR]:", message);
    return NextResponse.json(
      { error: "Search failed. Please try again." },
      { status: 500 }
    );
  }
}
