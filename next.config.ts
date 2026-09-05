import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // pdfkit reads its built-in font metrics from node_modules at runtime —
  // keep it external so the bundler doesn't break those fs reads.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
