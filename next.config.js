/** @type {import('next').NextConfig} */

function normalizeVariant(value) {
  if (value == null || String(value).trim() === "") return "default";
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^["']|["']$/g, "");
}

// Prefer NEXT_PUBLIC_*; fall back to SITE_VARIANT so Vercel builds pick up either name.
const siteVariantForBuild = normalizeVariant(
  process.env.NEXT_PUBLIC_SITE_VARIANT || process.env.SITE_VARIANT || "default"
);

const nextConfig = {
  env: {
    NEXT_PUBLIC_SITE_VARIANT: siteVariantForBuild,
  },
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
