import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No `images.remotePatterns`: the app renders plain <img> tags and never uses
  // next/image, so the /_next/image optimizer must not fetch remote images at all.
};

export default nextConfig;
