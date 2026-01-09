import { source } from "motion/react-client";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source : "/api/app/:path*",
        destination: "http://localhost:9100/:path*",
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
