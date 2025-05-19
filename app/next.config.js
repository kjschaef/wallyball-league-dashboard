/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use proper configuration options for Next.js
  experimental: {
    serverActions: true,
  },
  // Added output: 'standalone' for better production builds
  output: 'standalone',
}

// Use CommonJS syntax for Next.js configuration when in the app directory
module.exports = nextConfig