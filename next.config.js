/** @type {import('next').NextConfig} */
const nextConfig = {
  // api routing is handled automatically by Next.js App Router or Vercel Functions
  async rewrites() {
    return process.env.NODE_ENV === 'development'
      ? [
          {
            source: '/api/:path*',
            destination: 'http://127.0.0.1:8000/api/:path*',
          },
        ]
      : [];
  },
}

module.exports = nextConfig
