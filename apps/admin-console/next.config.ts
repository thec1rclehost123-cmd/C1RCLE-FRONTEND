import type { NextConfig } from 'next';

/**
 * C1RCLE Admin Console — application-local build configuration.
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

  images: { formats: ['image/avif', 'image/webp'] },

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
    ]);
  },
};

export default nextConfig;
