import { describe, expect, it } from "vitest";
import { getErrorMessage, isHttpUrl, MAX_LIST_LIMIT, parsePaging, seededShuffle, usableImageUrl } from "@/lib/utils";

describe("isHttpUrl", () => {
  it("accepts http and https URLs, ignoring surrounding spaces", () => {
    expect(isHttpUrl("https://archive.org/download/x/y.mp3")).toBe(true);
    expect(isHttpUrl(" http://example.com/a ")).toBe(true);
  });

  it("rejects script and data URLs in any letter case", () => {
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("JaVaScRiPt:alert(1)")).toBe(false);
    expect(isHttpUrl(" javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("rejects relative, protocol-relative and non-string values", () => {
    expect(isHttpUrl("//evil.example/x")).toBe(false);
    expect(isHttpUrl("ERROR")).toBe(false);
    expect(isHttpUrl("")).toBe(false);
    expect(isHttpUrl(null)).toBe(false);
    expect(isHttpUrl(undefined)).toBe(false);
    expect(isHttpUrl(42)).toBe(false);
  });
});

describe("parsePaging", () => {
  it("uses page 1 and 20 rows when nothing is given", () => {
    expect(parsePaging(null, null)).toEqual({ page: 1, limit: 20 });
    expect(parsePaging("", " ")).toEqual({ page: 1, limit: 20 });
  });

  it("accepts whole numbers and lowers an oversized limit to the maximum", () => {
    expect(parsePaging("3", "50")).toEqual({ page: 3, limit: 50 });
    expect(parsePaging("1", "5000")).toEqual({ page: 1, limit: MAX_LIST_LIMIT });
  });

  it("rejects zero, negative, fractional and non-numeric values", () => {
    for (const [page, limit] of [["0", "20"], ["-3", "20"], ["1", "-5"], ["1", "0"], ["1.5", "20"], ["1", "abc"], ["2e3", "20"], ["99999999999999999999", "20"]]) {
      expect(parsePaging(page, limit)).toBeNull();
    }
  });
});

describe("seededShuffle", () => {
  const items = Array.from({ length: 20 }, (_, i) => i);

  it("gives the same order for the same seed (server and browser agree)", () => {
    expect(seededShuffle(items, 1791027806038)).toEqual(seededShuffle(items, 1791027806038));
  });

  it("keeps every item exactly once and leaves the input untouched", () => {
    const shuffled = seededShuffle(items, 42);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(items);
    expect(items[0]).toBe(0);
  });

  it("gives different orders for different seeds", () => {
    expect(seededShuffle(items, 1)).not.toEqual(seededShuffle(items, 2));
  });
});

describe("usableImageUrl", () => {
  it("returns http(s) image URLs, trimmed", () => {
    expect(usableImageUrl(" https://x.supabase.co/a.webp ")).toBe("https://x.supabase.co/a.webp");
  });

  it("returns null for the stored \"ERROR\" placeholder, empty and missing values", () => {
    expect(usableImageUrl("ERROR")).toBeNull();
    expect(usableImageUrl("")).toBeNull();
    expect(usableImageUrl(null)).toBeNull();
    expect(usableImageUrl(undefined)).toBeNull();
  });
});

describe("getErrorMessage", () => {
  it("reads the message from Error instances", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("reads the message from Supabase-style plain objects", () => {
    expect(getErrorMessage({ message: "duplicate key", code: "23505" })).toBe("duplicate key");
  });

  it("falls back to a string for anything else", () => {
    expect(getErrorMessage("plain text")).toBe("plain text");
    expect(getErrorMessage({ message: 123 })).toBe("[object Object]");
    expect(getErrorMessage(null)).toBe("null");
  });
});
