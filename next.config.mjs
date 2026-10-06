/** @type {import('next').NextConfig} */
const backendOrigin = (
  process.env.BACKEND_ORIGIN || "https://apltravelbackend.onrender.com"
).replace(/\/$/, "");

/** Phase 8: public site/CMS may use local backend while travel APIs stay on Render. */
const publicSiteOrigin = (
  process.env.PUBLIC_SITE_ORIGIN || backendOrigin
).replace(/\/$/, "");

const mediaHost = (() => {
  try {
    return new URL(publicSiteOrigin).hostname;
  } catch {
    return "localhost";
  }
})();

const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/public/:path*",
        destination: `${publicSiteOrigin}/api/v1/public/:path*`,
      },
      {
        source: "/media/:path*",
        destination: `${publicSiteOrigin}/media/:path*`,
      },
      {
        source: "/api/v1/:path*",
        destination: `${backendOrigin}/api/v1/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: publicSiteOrigin.startsWith("https") ? "https" : "http",
        hostname: mediaHost,
      },
    ],
  },
};

export default nextConfig;
