/** @type {import('next').NextConfig} */
const nextConfig = {
  // Polling avoids thousands of native file watchers on macOS (reduces EMFILE / corrupt .next from failed watches).
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
