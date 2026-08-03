import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  turbopack: {
    root: path.join(__dirname),
  },
  // Ship the local demo DB + covers/avatars with serverless functions
  outputFileTracingIncludes: {
    "/*": ["./demo-data/**/*"],
  },
};

export default nextConfig;
