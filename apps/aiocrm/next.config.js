/** @type {import('next').NextConfig} */
const nextConfig = {
  // Container-friendly: emits a minimal standalone server bundle into
  // .next/standalone — Dockerfiles copy this + .next/static + public.
  output: 'standalone',
  // Monorepo: tells Next where to root the file-tracing pass so workspace
  // deps in packages/* are included in the standalone bundle.
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
  transpilePackages: ['@inherenttech/ui', '@inherenttech/shared'],
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
};

module.exports = nextConfig;
