/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@inherenttech/ui', '@inherenttech/shared'],
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
};

module.exports = nextConfig;
