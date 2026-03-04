/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: [
        'pdf-parse',
        'winston',
        'winston-daily-rotate-file',
        '@sentry/node',
        '@sentry/profiling-node',
        'openai'
      ],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
