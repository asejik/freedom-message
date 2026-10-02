import { useCallback, useSyncExternalStore } from "react";
import { isFavourite, subscribeToFavourites, toggleFavourite } from "@/lib/favourites";

/** Whether a sermon is in this device's favourites, plus a toggle. Stays in sync across components and tabs. */
export function useFavourite(sermonId: string | undefined): [boolean, () => void] {
  const isFav = useSyncExternalStore(
    subscribeToFavourites,
    () => (sermonId ? isFavourite(sermonId) : false),
    () => false // server render: favourites are unknown until the browser loads
  );

  const toggle = useCallback(() => {
    if (sermonId) toggleFavourite(sermonId);
  }, [sermonId]);

  return [isFav, toggle];
}
