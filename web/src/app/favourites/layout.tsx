import type { Metadata } from "next";

// Kept out of search results: favourites are saved on each device, so a crawler sees an empty list.
export const metadata: Metadata = {
  title: "Favourites",
  robots: { index: false, follow: true },
};

export default function FavouritesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
