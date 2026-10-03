import { describe, expect, it } from "vitest";
import { getErrorMessage, isHttpUrl, usableImageUrl } from "@/lib/utils";

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
