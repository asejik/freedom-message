import type { Metadata } from "next";
import { Geist, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import { AudioProvider } from "@/components/providers/AudioProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { GlobalPlayer } from "@/components/audio/GlobalPlayer";

import { AnimatedBackground } from "@/components/layout/AnimatedBackground";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Analytics } from "@vercel/analytics/next";
import { DEFAULT_SHARE_IMAGE, OPEN_GRAPH_BASE, SITE_URL } from "@/lib/seo";

// Fonts are downloaded at build time and served from our own domain as compressed,
// Latin-only woff2 variable fonts (was nine uncompressed .otf files, ~278 KB).
// Headings: Schibsted Grotesk (SIL Open Font License), the closest openly licensed
// match to ES Klarheit Grotesk, whose trial files were not licensed for a public site.
const headingFont = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

// Body & UI: Geist (SIL Open Font License)
const bodyFont = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Icon font: request ONLY the icons the app uses (12 KB instead of the full 1.1 MB font).
// IMPORTANT: when you use a new Material Symbols icon anywhere, add its name here (keep the
// list alphabetical, as Google requires) or it will render as plain text.
// display=block keeps icon names from flashing as words while the font loads.
const MATERIAL_SYMBOLS = [
  "arrow_back", "auto_awesome", "calendar_today", "check", "chevron_left", "chevron_right",
  "close", "cloud_off", "download", "error_outline", "expand_more", "explore_off", "favorite",
  "favorite_border", "headphones", "home", "info", "language", "library_music", "menu_book",
  "more_vert", "music_note", "open_in_new", "pause", "pause_circle", "play_arrow", "play_circle",
  "refresh", "search", "search_off", "share", "sign_language", "smart_toy", "volume_up",
];
const MATERIAL_SYMBOLS_URL =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1" +
  `&icon_names=${MATERIAL_SYMBOLS.join(",")}&display=block`;

export const metadata: Metadata = {
  // Makes every relative URL in metadata (canonicals, preview images) absolute
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Messages",
    template: "%s | Messages",
  },
  description: "A library of over 1,400 sermon recordings by Apostle Muyiwa Areo and other ministers.",
  manifest: "/manifest.json",
  applicationName: "Messages",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Messages",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  // No `url` here: each page sets its own (a shared one would point every preview at one page)
  openGraph: {
    ...OPEN_GRAPH_BASE,
    title: "Messages — Sermon Library",
    description: "Stream and search over 1,400 sermons by Apostle Muyiwa Areo and other ministers.",
  },
  twitter: {
    card: "summary_large_image",
    images: [DEFAULT_SHARE_IMAGE],
    title: "Messages",
    description: "Stream and search over 1,400 sermons by Apostle Muyiwa Areo and other ministers.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable} h-full antialiased`}>
      <head>
        <meta name="theme-color" content="#030303" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link href={MATERIAL_SYMBOLS_URL} rel="stylesheet" />
      </head>
      <body className="h-screen w-screen overflow-hidden flex text-on-background relative bg-[#030303]">
        <AnimatedBackground />
        <QueryProvider>
          <AudioProvider>
            
            {/* Sidebar (Desktop / Tablet Left Rail) */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative w-full flex flex-col pb-20 md:pb-8">
              {/* Mobile-only top header */}
              <MobileHeader />
              {/* Pages must keep their natural height (flex items shrink by default, which made
                  them collapse to the screen height and the footer overlap their content) */}
              <div className="grow shrink-0 flex flex-col">{children}</div>
              <SiteFooter />
            </main>

            {/* Floating Audio Player */}
            <GlobalPlayer />

            {/* Mobile Bottom Navigation Bar */}
            <BottomNav />

          </AudioProvider>
        </QueryProvider>

        {/* Vercel Web Analytics: page views and visitor counts */}
        <Analytics />
      </body>
    </html>
  );
}
