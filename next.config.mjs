/** @type {import('next').NextConfig} */
const backendOrigin = (
  process.env.BACKEND_ORIGIN || "https://apltravelbackend.onrender.com"
).replace(/\/$/, "");

const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
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
    ],
  },
};

export default nextConfig;
