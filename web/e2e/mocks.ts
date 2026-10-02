import type { Page, Route } from "@playwright/test";

// ── Fixture data ─────────────────────────────────────────────────────────────

const preacher = { id: "p1", name: "Apostle Test Preacher" };
const otherPreacher = { id: "p2", name: "Pastor Example" };
const faithSeries = { id: "s1", name: "Walking by Faith", thumbnail_url: null };
const loveSeries = { id: "s2", name: "The Love Commandment", thumbnail_url: null };

export const SERMONS = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Faith for Today",
    date_preached: "2026-05-17",
    audio_url: "https://archive.org/download/test/faith-for-today.mp3",
    artwork_url: null,
    preacher_id: preacher.id,
    series_id: faithSeries.id,
    preachers: preacher,
    series: faithSeries,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    title: "The Love Commandment 4",
    date_preached: "2026-04-12",
    audio_url: "https://archive.org/download/test/love-commandment-4.mp3",
    artwork_url: null,
    preacher_id: otherPreacher.id,
    series_id: loveSeries.id,
    preachers: otherPreacher,
    series: loveSeries,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    title: "Healing Grace",
    date_preached: "2026-03-01",
    audio_url: "https://archive.org/download/test/healing-grace.mp3",
    artwork_url: null,
    preacher_id: preacher.id,
    series_id: null,
    preachers: preacher,
    series: null,
  },
];

export const FAITH_SERMON = SERMONS[0];

/** Extra fields only the sermon detail page loads */
const DETAIL_FIELDS = {
  ai_summary: "A practical message on trusting God in everyday decisions.",
  ai_tags: ["Faith", "Trust"],
  key_verses: ["Hebrews 11:1"],
  prayer_focus: "• For grace to walk by faith",
  play_count: 0,
  download_count: 0,
  created_at: "2026-05-18T00:00:00Z",
};

export const AI_ANSWER = "Here are sermons that speak to your question about faith.";

// ── Request handlers ─────────────────────────────────────────────────────────

const json = (route: Route, body: unknown, status = 200, headers: Record<string, string> = {}) =>
  route.fulfill({ status, contentType: "application/json", headers, body: JSON.stringify(body) });

/** The app's own catalog API: supports the filters the pages send */
function handleCatalog(route: Route) {
  const params = new URL(route.request().url()).searchParams;
  const contains = (value: string | null | undefined, needle: string | null) =>
    !needle || (value ?? "").toLowerCase().includes(needle.toLowerCase());

  const data = SERMONS.filter(
    (s) =>
      contains(s.title, params.get("title")) &&
      contains(s.title, params.get("tag")) &&
      contains(s.preachers.name, params.get("preacher")) &&
      contains(s.series?.name, params.get("series")) &&
      (!params.get("year") || s.date_preached.startsWith(params.get("year")!))
  );
  return json(route, { data, count: data.length, page: 1, limit: 20 });
}

/** Direct Supabase REST calls made from the browser (preachers, series, sermon detail, related, favourites) */
function handleSupabase(route: Route) {
  const url = new URL(route.request().url());
  const table = url.pathname.split("/").pop();
  const wantsSingleRow = (route.request().headers()["accept"] ?? "").includes("vnd.pgrst.object");

  if (table === "preachers") return json(route, [preacher, otherPreacher]);
  if (table === "series") return json(route, [faithSeries, loveSeries], 200, { "content-range": "0-1/2" });

  if (table === "sermons") {
    const idFilter = url.searchParams.get("id") ?? "";
    if (wantsSingleRow) {
      const sermon = SERMONS.find((s) => idFilter === `eq.${s.id}`);
      return sermon
        ? json(route, { ...sermon, ...DETAIL_FIELDS })
        : json(route, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" }, 406);
    }
    if (idFilter.startsWith("in.")) return json(route, SERMONS.filter((s) => idFilter.includes(s.id)));
    // "Related sermons": everything except the one being viewed
    return json(route, SERMONS.filter((s) => idFilter !== `neq.${s.id}`));
  }
  return json(route, []);
}

/**
 * Replaces every backend the pages talk to with predictable fixtures.
 * Audio requests are aborted: the tests check the player UI, not sound.
 */
export async function mockBackend(page: Page) {
  await page.route("**/api/sermons**", handleCatalog);
  await page.route("**/api/search**", (route) => json(route, { answer: AI_ANSWER, results: SERMONS.slice(0, 2) }));
  await page.route("**/rest/v1/**", handleSupabase);
  await page.route("https://archive.org/**", (route) => route.abort());
}
