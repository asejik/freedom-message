// Favourites are stored per device in localStorage (the site has no visitor accounts).

const FAVOURITES_KEY = "favourite_sermons";

export function readFavourites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(FAVOURITES_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function isFavourite(sermonId: string): boolean {
  return readFavourites().includes(sermonId);
}

/** Adds or removes a sermon and tells other components on the page to refresh. */
export function toggleFavourite(sermonId: string): void {
  try {
    const favs = readFavourites();
    const updated = favs.includes(sermonId) ? favs.filter((id) => id !== sermonId) : [...favs, sermonId];
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(updated));
    // The native "storage" event only fires in OTHER tabs, so notify this one too
    window.dispatchEvent(new Event("storage"));
  } catch {
    // Storage unavailable (private mode / quota): favourites just won't persist
  }
}

/** Subscribe to favourite changes from this tab or others. Returns an unsubscribe function. */
export function subscribeToFavourites(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}
