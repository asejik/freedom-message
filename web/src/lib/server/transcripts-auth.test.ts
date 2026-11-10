import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  validatePasscode,
  getTranscriptsPasscode,
  createTranscriptsSessionToken,
  verifyTranscriptsSessionToken,
  extractTranscriptsCookie,
  verifyTranscriptsAccess,
  TRANSCRIPTS_COOKIE_NAME,
} from "./transcripts-auth";

describe("transcripts-auth", () => {
  const originalPasscode = process.env.TRANSCRIPTS_ACCESS_PASSCODE;
  const originalKey = process.env.TRANSCRIPTS_ACCESS_KEY;

  beforeEach(() => {
    delete process.env.TRANSCRIPTS_ACCESS_KEY;
    process.env.TRANSCRIPTS_ACCESS_PASSCODE = "unit-test-passcode-123";
  });

  afterEach(() => {
    process.env.TRANSCRIPTS_ACCESS_PASSCODE = originalPasscode;
    process.env.TRANSCRIPTS_ACCESS_KEY = originalKey;
  });

  it("retrieves passcode from env or fallback key", () => {
    expect(getTranscriptsPasscode()).toBe("unit-test-passcode-123");

    delete process.env.TRANSCRIPTS_ACCESS_PASSCODE;
    process.env.TRANSCRIPTS_ACCESS_KEY = "fallback-key-456";
    expect(getTranscriptsPasscode()).toBe("fallback-key-456");

    delete process.env.TRANSCRIPTS_ACCESS_KEY;
    expect(getTranscriptsPasscode()).toBe("");
  });

  it("validates passcode correctly and rejects incorrect or empty input", () => {
    expect(validatePasscode("unit-test-passcode-123")).toBe(true);
    expect(validatePasscode("  unit-test-passcode-123  ")).toBe(true);
    expect(validatePasscode("wrong-code")).toBe(false);
    expect(validatePasscode("")).toBe(false);

    delete process.env.TRANSCRIPTS_ACCESS_PASSCODE;
    expect(validatePasscode("unit-test-passcode-123")).toBe(false);
  });

  it("creates and verifies HMAC session tokens", () => {
    const token = createTranscriptsSessionToken("unit-test-passcode-123");
    expect(typeof token).toBe("string");
    expect(token.length).toBe(64); // sha256 hex string

    expect(verifyTranscriptsSessionToken(token)).toBe(true);
    expect(verifyTranscriptsSessionToken("invalid-token")).toBe(false);
    expect(verifyTranscriptsSessionToken(null)).toBe(false);
    expect(verifyTranscriptsSessionToken(undefined)).toBe(false);

    // If passcode in env changes, previous tokens are invalidated
    process.env.TRANSCRIPTS_ACCESS_PASSCODE = "new-different-passcode";
    expect(verifyTranscriptsSessionToken(token)).toBe(false);
  });

  it("extracts transcripts cookie from Request header", () => {
    const validReq = new Request("http://localhost/api/transcripts", {
      headers: {
        cookie: `some_other=1; ${TRANSCRIPTS_COOKIE_NAME}=test_token_val; another=2`,
      },
    });
    expect(extractTranscriptsCookie(validReq)).toBe("test_token_val");

    const emptyReq = new Request("http://localhost/api/transcripts");
    expect(extractTranscriptsCookie(emptyReq)).toBe(null);
  });

  it("verifies transcripts access via cookie", async () => {
    const token = createTranscriptsSessionToken("unit-test-passcode-123");
    const authedReq = new Request("http://localhost/api/transcripts", {
      headers: {
        cookie: `${TRANSCRIPTS_COOKIE_NAME}=${token}`,
      },
    });

    const authedResult = await verifyTranscriptsAccess(authedReq);
    expect(authedResult.authorized).toBe(true);

    const unauthedReq = new Request("http://localhost/api/transcripts");
    const unauthedResult = await verifyTranscriptsAccess(unauthedReq);
    expect(unauthedResult.authorized).toBe(false);
    expect(unauthedResult.reason).toContain("Unauthorized");
  });
});
