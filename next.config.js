/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/.data/**',
          '**/.local_blobs/**',
          '**/analytics_store.json',
          '**/src/data/analytics_store.json',
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
        ],
      };
    }
    return config;
  },
};

module.exports = nextConfig;
