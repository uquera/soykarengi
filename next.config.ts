import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El VPS corre la app con PM2 desde .next/standalone
  output: "standalone",
};

export default nextConfig;
