import type { NextConfig } from "next";

function getSupabaseHost() {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : "ddelyhoaflwtlzjwtihq.supabase.co";
  } catch {
    return "ddelyhoaflwtlzjwtihq.supabase.co";
  }
}

const supabaseHost = getSupabaseHost();

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb"
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost
      }
    ]
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' https: wss:",
      "media-src 'self' data: blob: https:",
      `form-action 'self'`,
      `upgrade-insecure-requests`
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy-Report-Only", value: csp }
        ]
      }
    ];
  }
};

export default nextConfig;
