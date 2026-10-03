import type { Metadata } from "next";

// Kept out of search results: it is not a page for listeners.
export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
