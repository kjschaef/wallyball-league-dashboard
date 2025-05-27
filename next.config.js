/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
  typescript: {
    // This will allow the build to proceed even if there are type errors
    ignoreBuildErrors: false,
  },
  eslint: {
    // This will allow the build to proceed even if there are ESLint errors
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig