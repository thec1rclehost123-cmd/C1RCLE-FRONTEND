import type { NextConfig } from 'next';

/**
 * C1RCLE Guest Portal — application-local build configuration.
 *
 * This application builds, runs and deploys independently of the other two.
 * Anything shared belongs in a package, not in a config copied between apps.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  /* Self-contained server bundle, so the Docker image needs no node_modules. */
  output: 'standalone',

  /*
   * Packages ship compiled JS with their own .d.ts, so Next does not need to
   * transpile workspace sources. See docs/architecture/adr/0003.
   */
  experimental: {
    optimizePackageImports: ['@c1rcle/ui', '@c1rcle/icons'],
  },

  /* A type error must never reach a deploy. */
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: 'tsconfig.build.json',
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86_400,
  },

  headers() {
    return Promise.resolve([
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/home/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/events/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ]);
  },
};

export default nextConfig;
