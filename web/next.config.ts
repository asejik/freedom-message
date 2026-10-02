import type { NextConfig } from "next";

// Sent on every response. A full Content-Security-Policy is intentionally not
// set yet: it needs an allowlist for fonts, audio, Supabase and analytics and
// should be trialled in report-only mode first.
const securityHeaders = [
  // Stop other sites embedding ours in a frame (clickjacking the admin area)
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // Stop browsers guessing content types
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send only our origin, not full URLs, to other sites
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Browser features the site never uses
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // No `images.remotePatterns`: the app renders plain <img> tags and never uses
  // next/image, so the /_next/image optimizer must not fetch remote images at all.

  // Don't advertise the framework in an X-Powered-By header
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
