import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
