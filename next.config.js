/** @type {import('next').NextConfig} */
const nextConfig = {

  // Static export doesn't support dynamic route handlers with request.url access
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
