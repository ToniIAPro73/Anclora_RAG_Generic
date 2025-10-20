import { join } from "path";
import dotenv from "dotenv";
import type { NextConfig } from "next";

dotenv.config({
  path: join(__dirname, "..", "..", ".env"),
});

const nextConfig: NextConfig = {
  /* config options here */

  // Disable caching in development to always serve fresh content
  ...(process.env.NODE_ENV === 'development' && {
    webpack: (config) => {
      config.cache = false;
      return config;
    },
  }),

  // Add headers to prevent browser caching in development
  async headers() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
            },
            {
              key: 'Pragma',
              value: 'no-cache',
            },
            {
              key: 'Expires',
              value: '0',
            },
          ],
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
