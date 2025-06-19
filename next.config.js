/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client')
    }
    return config
  },
  env: {
    SKIP_ENV_VALIDATION: '1'
  },
  eslint: {
    ignoreDuringBuilds: true,
    dirs: [] // Don't lint any directories
  },
  typescript: {
    ignoreBuildErrors: true
  }
}

module.exports = nextConfig