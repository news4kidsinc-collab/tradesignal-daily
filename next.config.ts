import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Real market data requires server-side route handlers so API keys are never exposed.
  // Do not use output: "export" for this research version.
  images: {
    unoptimized: false
  }
};

export default nextConfig;
