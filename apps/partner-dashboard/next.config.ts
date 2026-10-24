import type { NextConfig } from 'next';

/**
 * C1RCLE Partner Dashboard — application-local build configuration.
 *
 * This application builds, runs and deploys independently of the other two.
 * Anything shared belongs in a package, not in a config copied between apps.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  /*
   * Self-contained server bundle, so the Docker image needs no node_modules.
   *
   * Vercel builds its own serverless output and does not consume `standalone`;
   * leaving it on there is redundant and has historically confused monorepo
   * builds, so it is scoped to non-Vercel (i.e. Docker) builds only. The
   * Dockerfile copies `.next/standalone`, so this must stay set off-Vercel.
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
  typescript: { ignoreBuildErrors: false },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'c1-rcle-frontend-partner-dashboard.vercel.app',
        pathname: '/partner-v3/**',
      },
    ],
  },

  /**
   * The pre-M3 studio paths remain bookmarked externally. Route every legacy
   * path through the authenticated, tenant-aware workspace so it cannot render
   * an older fixture-backed screen beside the connected implementation.
   */
  redirects() {
    return Promise.resolve([
      // Deep links that moved to a query-driven connected screen need an
      // explicit target before the broad legacy-studio path redirects below.
      {
        source: '/venue/finance/orders',
        destination: '/partner/venue/finance?view=orders',
        permanent: false,
      },
      {
        source: '/host/finance/orders',
        destination: '/partner/host/finance?view=orders',
        permanent: false,
      },
      {
        source: '/promoter/finance/orders',
        destination: '/partner/promoter/finance?view=orders',
        permanent: false,
      },
      {
        source: '/partner/venue/finance/orders',
        destination: '/partner/venue/finance?view=orders',
        permanent: false,
      },
      {
        source: '/partner/host/finance/orders',
        destination: '/partner/host/finance?view=orders',
        permanent: false,
      },
      {
        source: '/partner/promoter/finance/orders',
        destination: '/partner/promoter/finance?view=orders',
        permanent: false,
      },
      {
        source: '/venue/events/analytics',
        destination: '/partner/venue/analytics',
        permanent: false,
      },
      {
        source: '/host/events/analytics',
        destination: '/partner/host/analytics',
        permanent: false,
      },
      {
        source: '/partner/venue/events/analytics',
        destination: '/partner/venue/analytics',
        permanent: false,
      },
      {
        source: '/partner/host/events/analytics',
        destination: '/partner/host/analytics',
        permanent: false,
      },
      { source: '/venue', destination: '/partner/venue', permanent: false },
      { source: '/venue/:path*', destination: '/partner/venue/:path*', permanent: false },
      { source: '/host', destination: '/partner/host', permanent: false },
      { source: '/host/:path*', destination: '/partner/host/:path*', permanent: false },
      { source: '/promoter', destination: '/partner/promoter', permanent: false },
      { source: '/promoter/:path*', destination: '/partner/promoter/:path*', permanent: false },
    ]);
  },

  headers() {
    return Promise.resolve([
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          /*
           * The Content-Security-Policy header lives in src/proxy.ts — it
           * needs a fresh per-request nonce, which only the proxy can mint.
           * Do not add a CSP header here: two CSP headers on one response
           * merge as the *intersection* of both policies, silently breaking
           * whichever directive is narrower.
           */
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ]);
  },
};

export default nextConfig;
