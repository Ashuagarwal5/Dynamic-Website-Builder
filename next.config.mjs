/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the LAN hostname used to access this local development server.
  allowedDevOrigins: ["192.168.1.39"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
