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

  // Resolve metadata before streaming so missing public entities return a real
  // HTTP 404 instead of a soft-404 response that crawlers could misinterpret.
  htmlLimitedBots: /.*/,

  /*
   * Docker needs the standalone server bundle. Vercel generates its own
   * serverless output, so enabling standalone there produces incompatible
   * tracing artifacts during the platform build hook.
   */
  ...(process.env['VERCEL'] ? {} : { output: 'standalone' as const }),

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
        source: '/event/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=3600',
          },
        ],
      },
    ]);
  },
};

export default nextConfig;
