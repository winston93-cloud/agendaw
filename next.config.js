/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
}

module.exports = nextConfig
