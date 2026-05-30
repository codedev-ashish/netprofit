import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@firebase/firestore": path.resolve(process.cwd(), "node_modules/@firebase/firestore/dist/index.esm.js"),
      };
    }
    return config;
  }
};

export default nextConfig;
