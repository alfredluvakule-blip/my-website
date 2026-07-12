/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Bundle a minimal server for the Docker runtime image.
  output: 'standalone',
  // The monorepo root, so standalone tracing includes workspace packages.
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
  // Compile the shared workspace packages from source.
  transpilePackages: ['@perfusio/clinical', '@perfusio/contracts'],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
