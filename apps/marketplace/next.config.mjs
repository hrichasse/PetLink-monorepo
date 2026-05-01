import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tells Next.js to trace files from the monorepo root so Prisma's
  // engine binary and generated client are included in every
  // serverless function bundle on Vercel.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  experimental: {
    instrumentationHook: true,
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PATCH,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Authorization, Content-Type" }
        ]
      }
    ];
  }
};

export default nextConfig;
