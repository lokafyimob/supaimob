/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client')
    }
    return config
  },
  // Skip building during static generation if DATABASE_URL is not available
  // This prevents Prisma from failing during build time on Vercel
  env: {
    SKIP_ENV_VALIDATION: '1'
  }
}

module.exports = nextConfig