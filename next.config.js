/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  experimental: {
    serverComponentsExternalPackages: ['archiver', 'node-forge']
  },
  // Exclude backup files from TypeScript checking
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config) => {
    // Ignore backup directory during build
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/backup/**', '**/node_modules/**']
    }
    return config
  }
}

module.exports = nextConfig