/** @type {import('next').NextConfig} */
const path = require('node:path');
module.exports = {
  outputFileTracingRoot: path.join(__dirname, '../..'),
  reactStrictMode: true, poweredByHeader: false, output: 'standalone',
  transpilePackages: ['@krypton/types', '@krypton/utils'],
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ] }, { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] }];
  },
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${process.env.API_URL || 'http://localhost:3001'}/api/v1/:path*` }];
  },
};