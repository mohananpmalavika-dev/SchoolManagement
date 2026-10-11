/** @type {import('next').NextConfig} */
const path = require('node:path');
module.exports = {
  // Isolated QA builds can run without locking an existing .next server.
  distDir: process.env.WEB_BUILD_DIR || '.next',
  outputFileTracingRoot: path.join(__dirname, '../..'),
  reactStrictMode: true, poweredByHeader: false, output: 'standalone',
  transpilePackages: ['@krypton/types', '@krypton/utils'],
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self)' },
    ] }, { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] }];
  },
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${process.env.API_URL || 'http://localhost:3001'}/api/v1/:path*` }];
  },
};
