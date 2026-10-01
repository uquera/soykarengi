import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El VPS corre la app con PM2 desde .next/standalone
  output: "standalone",

  // El trazado no arrastra nodemailer (solo lo usan server actions) y el
  // standalone quedaba sin él: los correos reventaban en producción.
  outputFileTracingIncludes: {
    "/*": ["node_modules/nodemailer/**/*"],
  },
};

export default nextConfig;
