import { describe, expect, it } from "vitest";
import { detectImageMime } from "@/lib/images";

const bytes = (...values: number[]) => Buffer.from(values);

describe("detectImageMime", () => {
  it("recognises JPEG, PNG and WebP by their signature bytes", () => {
    expect(detectImageMime(bytes(0xff, 0xd8, 0xff, 0xe0, 0x00))).toBe("image/jpeg");
    expect(detectImageMime(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00))).toBe("image/png");
    expect(detectImageMime(Buffer.concat([Buffer.from("RIFF"), bytes(1, 2, 3, 4), Buffer.from("WEBP")]))).toBe("image/webp");
  });

  it("rejects files that only claim to be images", () => {
    expect(detectImageMime(Buffer.from("<html><script>alert(1)</script></html>"))).toBeNull();
    expect(detectImageMime(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull();
    expect(detectImageMime(Buffer.from('{"name":"x"}'))).toBeNull();
  });

  it("rejects RIFF files that are not WebP, and empty or truncated input", () => {
    expect(detectImageMime(Buffer.concat([Buffer.from("RIFF"), bytes(1, 2, 3, 4), Buffer.from("WAVE")]))).toBeNull();
    expect(detectImageMime(Buffer.alloc(0))).toBeNull();
    expect(detectImageMime(bytes(0xff, 0xd8))).toBeNull();
  });
});
