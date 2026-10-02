import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import { isMessagesAdmin } from "@/utils/supabase/admin";

const user = (overrides: Partial<User>): User =>
  ({ id: "u1", aud: "authenticated", created_at: "", app_metadata: {}, user_metadata: {}, ...overrides }) as User;

describe("isMessagesAdmin", () => {
  it("is true only when app_metadata.messages_admin is exactly true", () => {
    expect(isMessagesAdmin(user({ app_metadata: { messages_admin: true } }))).toBe(true);
  });

  it("is false for an ordinary logged-in account (the shared project allows sign-up)", () => {
    expect(isMessagesAdmin(user({ app_metadata: { provider: "email" } }))).toBe(false);
  });

  it("ignores the flag in user_metadata, which users can edit themselves", () => {
    expect(isMessagesAdmin(user({ user_metadata: { messages_admin: true } }))).toBe(false);
  });

  it("is not fooled by truthy look-alikes or another app's flag", () => {
    expect(isMessagesAdmin(user({ app_metadata: { messages_admin: "true" } }))).toBe(false);
    expect(isMessagesAdmin(user({ app_metadata: { messages_admin: 1 } }))).toBe(false);
    expect(isMessagesAdmin(user({ app_metadata: { ces_admin: true } }))).toBe(false);
  });

  it("is false with no user", () => {
    expect(isMessagesAdmin(null)).toBe(false);
    expect(isMessagesAdmin(undefined)).toBe(false);
  });
});
