import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isFavourite, readFavourites, toggleFavourite } from "@/lib/favourites";

// Minimal browser stand-ins: favourites only need localStorage and a "storage" event
let store: Record<string, string>;
let dispatched: string[];

beforeEach(() => {
  store = {};
  dispatched = [];
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => { store[key] = value; },
  });
  vi.stubGlobal("window", { dispatchEvent: (event: Event) => { dispatched.push(event.type); return true; } });
});

afterEach(() => vi.unstubAllGlobals());

describe("favourites", () => {
  it("starts empty", () => {
    expect(readFavourites()).toEqual([]);
    expect(isFavourite("a")).toBe(false);
  });

  it("adds, then removes, a sermon and announces each change", () => {
    toggleFavourite("a");
    toggleFavourite("b");
    expect(readFavourites()).toEqual(["a", "b"]);
    expect(isFavourite("a")).toBe(true);

    toggleFavourite("a");
    expect(readFavourites()).toEqual(["b"]);
    expect(dispatched).toEqual(["storage", "storage", "storage"]);
  });

  it("recovers from corrupted or non-array stored data", () => {
    store.favourite_sermons = "{not json";
    expect(readFavourites()).toEqual([]);
    store.favourite_sermons = '{"a":1}';
    expect(readFavourites()).toEqual([]);
  });
});
