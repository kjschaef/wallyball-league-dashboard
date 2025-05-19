/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Updated the experimental config to use the correct property
  experimental: {
    serverExternalPackages: ['drizzle-orm'],
  },
  // Added output: 'standalone' for better production builds
  output: 'standalone',
}

// Use CommonJS syntax for Next.js configuration when in the app directory
module.exports = nextConfig