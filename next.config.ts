import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  turbopack: {
    resolveAlias: {
      "@firebase/firestore": "@firebase/firestore/dist/index.esm.js",
    }
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  async rewrites() {
    return {
      afterFiles: [
        {
          source: '/:file([^/]+\\.html)',
          destination: '/api/serve-root-file?file=:file',
        },
        {
          source: '/:file([^/]+\\.txt)',
          destination: '/api/serve-root-file?file=:file',
        },
        {
          source: '/:file([^/]+\\.xml)',
          destination: '/api/serve-root-file?file=:file',
        },
        {
          source: '/:file([^/]+\\.js)',
          destination: '/api/serve-root-file?file=:file',
        }
      ]
    };
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.netprofit.in',
          },
        ],
        destination: 'https://netprofit.in/:path*',
        permanent: true,
      },
    ];
  },
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
