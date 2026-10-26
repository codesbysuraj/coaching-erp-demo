import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  turbopack: {
    root: path.resolve(__dirname),
  },
  webpack: (config) => {
    config.context = path.resolve(__dirname);
    config.resolve = config.resolve || {};
    config.resolve.modules = [
      path.resolve(__dirname, "node_modules"),
      "node_modules",
      ...(config.resolve.modules || []),
    ];
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  allowedDevOrigins: ["192.168.0.106", "192.168.0.107"],
};

export default nextConfig;
