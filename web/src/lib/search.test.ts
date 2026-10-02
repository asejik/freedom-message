import { describe, expect, it } from "vitest";
import { rankSermons, scoreSermon, topicWords } from "@/lib/search";

describe("topicWords", () => {
  it("splits a topic into lowercase words", () => {
    expect(topicWords("Holy Spirit Baptism")).toEqual(["holy", "spirit", "baptism"]);
  });

  it("drops stopwords and one-letter words", () => {
    expect(topicWords("the baptism of the holy spirit")).toEqual(["baptism", "holy", "spirit"]);
    expect(topicWords("a b grace")).toEqual(["grace"]);
  });

  it("removes duplicates and caps the list at five words", () => {
    expect(topicWords("faith faith hope love joy peace patience")).toEqual(["faith", "hope", "love", "joy", "peace"]);
  });

  it("returns nothing for an empty or stopword-only topic", () => {
    expect(topicWords("")).toEqual([]);
    expect(topicWords("of the and")).toEqual([]);
  });
});

describe("scoreSermon", () => {
  const sermon = (title: string, ai_summary: string | null = null) => ({ title, ai_summary, date_preached: "2024-01-01" });

  it("scores an exact title match highest", () => {
    const exact = scoreSermon(sermon("Faith"), "faith", ["faith"]);
    const partial = scoreSermon(sermon("Walking by Faith"), "faith", ["faith"]);
    expect(exact).toBeGreaterThan(partial);
  });

  it("ranks a title match above a summary-only match", () => {
    const inTitle = scoreSermon(sermon("The Love Commandment 4"), "love commandment", ["love", "commandment"]);
    const inSummary = scoreSermon(sermon("Sunday Service", "A message on the love commandment."), "love commandment", ["love", "commandment"]);
    expect(inTitle).toBeGreaterThan(inSummary);
  });

  it("gives points for each word even when the exact phrase is absent", () => {
    // The original bug: "holy spirit baptism" never appears as a phrase
    const score = scoreSermon(sermon("The Baptism of the Holy Spirit"), "holy spirit baptism", ["holy", "spirit", "baptism"]);
    expect(score).toBe(45);
  });

  it("scores zero when nothing matches and tolerates a missing summary", () => {
    expect(scoreSermon(sermon("Giving"), "healing", ["healing"])).toBe(0);
  });
});

describe("rankSermons", () => {
  it("orders by relevance, then newest first on ties, without mutating the input", () => {
    const input = [
      { title: "Unrelated", ai_summary: null, date_preached: "2026-01-01" },
      { title: "Faith for Today", ai_summary: null, date_preached: "2020-01-01" },
      { title: "Faith for Tomorrow", ai_summary: null, date_preached: "2023-01-01" },
    ];
    const ranked = rankSermons(input, "faith", ["faith"]);
    expect(ranked.map((s) => s.title)).toEqual(["Faith for Tomorrow", "Faith for Today", "Unrelated"]);
    expect(input[0].title).toBe("Unrelated");
  });
});
