import { describe, expect, it } from "vitest";
import { createAttemptLimiter } from "@/lib/server/rate-limit";

describe("createAttemptLimiter", () => {
  it("blocks a key after the allowed attempts, and only that key", () => {
    const limiter = createAttemptLimiter(3, 60_000, () => 1_000);
    for (let i = 0; i < 3; i++) {
      expect(limiter.isBlocked("1.2.3.4")).toBe(false);
      limiter.record("1.2.3.4");
    }
    expect(limiter.isBlocked("1.2.3.4")).toBe(true);
    expect(limiter.isBlocked("5.6.7.8")).toBe(false);
  });

  it("says how long to wait, and lets the key try again after the window", () => {
    let time = 0;
    const limiter = createAttemptLimiter(1, 60_000, () => time);
    limiter.record("ip");
    time = 15_000;
    expect(limiter.isBlocked("ip")).toBe(true);
    expect(limiter.retryAfterSeconds("ip")).toBe(45);

    time = 60_001;
    expect(limiter.isBlocked("ip")).toBe(false);
    expect(limiter.retryAfterSeconds("ip")).toBe(0);
  });
});
