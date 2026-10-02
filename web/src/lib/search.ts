// Pure search helpers used by /api/search (kept here so they can be unit tested).

/** Words too common to narrow a sermon search */
const SEARCH_STOPWORDS = new Set([
  'a', 'an', 'and', 'the', 'of', 'on', 'in', 'to', 'for', 'by', 'with',
  'about', 'is', 'are', 'how', 'what', 'my', 'your', 'our',
]);

/** Distinct meaningful words from the extracted topic (capped to keep the filter small) */
export function topicWords(topic: string): string[] {
  const words = topic.toLowerCase().split(/\s+/).filter((w) => w.length > 1 && !SEARCH_STOPWORDS.has(w));
  return Array.from(new Set(words)).slice(0, 5);
}

/** The fields relevance scoring looks at */
export interface ScorableSermon {
  title: string;
  date_preached: string;
  ai_summary?: string | null;
}

/**
 * Relevance of one sermon to a topic. The whole phrase in the title scores
 * highest; each individual word then adds points (title > summary) so sermons
 * matching more of the query rank above those matching less.
 */
export function scoreSermon(sermon: ScorableSermon, topic: string, words: string[]): number {
  const lowerTopic = topic.toLowerCase();
  const title = (sermon.title || "").toLowerCase();
  const summary = (sermon.ai_summary || "").toLowerCase();
  let score = 0;

  if (title === lowerTopic) score += 100; // Exact match
  else if (title.includes(lowerTopic)) {
    score += 60;
    if (title.startsWith(lowerTopic)) score += 10;
  }
  else if (summary.includes(lowerTopic)) score += 20;

  for (const word of words) {
    if (title.includes(word)) score += 15;
    else if (summary.includes(word)) score += 5;
  }

  return score;
}

/** Sorts by relevance (highest first), newest first on ties. Returns a new array. */
export function rankSermons<T extends ScorableSermon>(sermons: T[], topic: string, words: string[]): T[] {
  return [...sermons].sort((a, b) => {
    const diff = scoreSermon(b, topic, words) - scoreSermon(a, topic, words);
    if (diff !== 0) return diff;
    return new Date(b.date_preached).getTime() - new Date(a.date_preached).getTime();
  });
}
