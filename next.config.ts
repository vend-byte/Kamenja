import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },

  // Allows the dev server to work when opened from your local
  // network IP (e.g. on your phone or another device), not just
  // "localhost".
  allowedDevOrigins: ["192.168.100.44"],
};

export default nextConfig;