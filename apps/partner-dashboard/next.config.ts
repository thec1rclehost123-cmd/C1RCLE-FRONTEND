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

  /*
   * H2 — the legacy `/venue`, `/host`, `/promoter` and `/partner-network`
   * trees were superseded by the V3 `/partner/[studio]` namespace. Nothing in
   * the app links to them any more and they render a second, fixture-backed
   * dashboard, so every legacy URL is redirected to its V3 equivalent.
   *
   * `redirects` run *before* the proxy (execution order: headers → redirects →
   * proxy), so an anonymous hit on a legacy path is rewritten to `/partner/…`
   * first and only then does the proxy gate it to `/login?next=/partner/…`.
   *
   * Temporary (307) rather than permanent (308) keeps the mapping reversible
   * and stops clients caching a redirect we may still revisit. Order matters:
   * the first matching rule wins, so the shape exceptions come before the
   * role-wide wildcards.
   */
  redirects() {
    const legacyRoles = ['venue', 'host', 'promoter'] as const;

    return Promise.resolve([
      /* Legacy shapes with no 1:1 V3 route — fold onto the nearest surface. */
      {
        source: '/venue/events/analytics',
        destination: '/partner/venue/analytics',
        permanent: false,
      },
      {
        source: '/venue/events/:eventId/finance',
        destination: '/partner/venue/events/:eventId',
        permanent: false,
      },
      {
        source: '/venue/events/:eventId/marketing',
        destination: '/partner/venue/events/:eventId',
        permanent: false,
      },
      {
        source: '/venue/finance/orders',
        destination: '/partner/venue/finance?view=orders',
        permanent: false,
      },
      {
        source: '/venue/notifications',
        destination: '/partner/venue/overview',
        permanent: false,
      },
      {
        source: '/host/events/analytics',
        destination: '/partner/host/analytics',
        permanent: false,
      },
      {
        source: '/host/events/invitations',
        destination: '/partner/host/events',
        permanent: false,
      },
      {
        source: '/host/events/invitations/:invitationId',
        destination: '/partner/host/events',
        permanent: false,
      },
      {
        source: '/host/events/requests/:requestId',
        destination: '/partner/host/events',
        permanent: false,
      },
      {
        source: '/host/events/:eventId/earnings',
        destination: '/partner/host/events/:eventId',
        permanent: false,
      },
      {
        source: '/host/events/:eventId/marketing',
        destination: '/partner/host/events/:eventId',
        permanent: false,
      },
      {
        source: '/host/finance/orders',
        destination: '/partner/host/finance?view=orders',
        permanent: false,
      },
      {
        source: '/host/notifications',
        destination: '/partner/host/overview',
        permanent: false,
      },
      {
        source: '/host/partners/promoters/:promoterId',
        destination: '/partner/host/partners',
        permanent: false,
      },
      {
        source: '/host/partners/venues/:venueId',
        destination: '/partner/host/partners',
        permanent: false,
      },
      {
        source: '/promoter/finance/orders',
        destination: '/partner/promoter/finance?view=orders',
        permanent: false,
      },
      {
        source: '/promoter/links',
        destination: '/partner/promoter/overview',
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
        source: '/partner/venue/events/analytics',
        destination: '/partner/venue/analytics',
        permanent: false,
      },
      {
        source: '/partner/host/events/analytics',
        destination: '/partner/host/analytics',
        permanent: false,
      },

      /* Partner-network is legacy admin chrome; fold it into the partner entry. */
      { source: '/partner-network', destination: '/partner', permanent: false },
      { source: '/partner-network/:path*', destination: '/partner', permanent: false },

      /* Representative roots, then everything else keeps its path shape. */
      ...legacyRoles.map((role) => ({
        source: `/${role}`,
        destination: `/partner/${role}`,
        permanent: false,
      })),
      ...legacyRoles.map((role) => ({
        source: `/${role}/:path*`,
        destination: `/partner/${role}/:path*`,
        permanent: false,
      })),
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
        ],
      },
    ]);
  },
};

export default nextConfig;
