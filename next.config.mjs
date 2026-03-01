/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  serverExternalPackages: ['winston', 'winston-daily-rotate-file', '@sentry/node', '@sentry/profiling-node'],
};

export default nextConfig;
