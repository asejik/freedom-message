import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AudioProvider } from "@/components/providers/AudioProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { GlobalPlayer } from "@/components/audio/GlobalPlayer";

import { AnimatedBackground } from "@/components/layout/AnimatedBackground";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { MobileHeader } from "@/components/layout/MobileHeader";

// Klarheit font for Headings & Titles
const klarheit = localFont({
  src: [
    {
      path: "../fonts/ESKlarheitGrotesk-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/ESKlarheitGrotesk-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/ESKlarheitGrotesk-SemiBold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/ESKlarheitGrotesk-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/ESKlarheitGrotesk-ExtraBold.otf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-heading",
  display: "swap",
});

// Geist font for Body & UI
const geist = localFont({
  src: [
    {
      path: "../fonts/Geist-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/Geist-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/Geist-SemiBold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/Geist-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Freedom Messages",
    template: "%s | Freedom Messages",
  },
  description: "A curated library of sermon audio recordings by Apostle Muyiwa Areo and ministers.",
  manifest: "/manifest.json",
  applicationName: "Freedom Messages",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Freedom Messages",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.muyiwaareo.com",
    siteName: "Freedom Messages",
    title: "Freedom Messages — Sermon Library",
    description: "Stream and search hundreds of sermons by Apostle Muyiwa Areo.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Freedom Messages",
    description: "Stream and search hundreds of sermons by Apostle Muyiwa Areo.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${klarheit.variable} ${geist.variable} h-full antialiased`}>
      <head>
        <meta name="theme-color" content="#030303" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
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
              {children}
            </main>

            {/* Floating Audio Player */}
            <GlobalPlayer />

            {/* Mobile Bottom Navigation Bar */}
            <BottomNav />

          </AudioProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
