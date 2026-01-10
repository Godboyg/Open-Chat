import { source } from "motion/react-client";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source : "/api/app/:path*",
        destination: "https://open-chat-v9i4.onrender.com/:path*",
      }
    ]
  },
  images: {
    domains: [
      "lh3.googleusercontent.com",
      "https://images.pexels.com",
      "images.pexels.com",
    ],
  }
};

export default nextConfig;
