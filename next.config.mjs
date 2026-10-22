/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the LAN hostname used to access this local development server.
  allowedDevOrigins: [
    "192.168.1.39",
    "192.168.1.27",
  ],
  cacheComponents: true,
  partialPrefetching: true,
  // Uploaded images are served by the backend at /uploads. The app saves them
  // as same-origin paths (/uploads/...), and this forwards those requests to the
  // backend, so images load from the app's own origin (no CORS or localhost URLs).
  async rewrites() {
    const backend = (process.env.BASEURL || "").replace(/\/$/, "");
    if (!backend) return [];
    return [{ source: "/uploads/:path*", destination: `${backend}/uploads/:path*` }];
  },
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
