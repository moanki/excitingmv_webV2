import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
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
        hostname: "ddelyhoaflwtlzjwtihq.supabase.co"
      }
    ]
  }
};

export default nextConfig;
