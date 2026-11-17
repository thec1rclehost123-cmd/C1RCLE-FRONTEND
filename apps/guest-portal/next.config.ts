import type { NextConfig } from 'next';

function reportOnlyCsp(): string {
  const apiBaseUrl = process.env['NEXT_PUBLIC_API_BASE_URL'];
  const firebaseAuthDomain = process.env['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'];
  let apiOrigin = "'self'";
  let firebaseAuthOrigin: string | null = null;
  if (apiBaseUrl) {
    try {
      apiOrigin = new URL(apiBaseUrl).origin;
    } catch {
      // Keep the same-origin fallback for an absent/invalid optional build env.
    }
  }
  if (firebaseAuthDomain) {
    try {
      firebaseAuthOrigin = new URL(`https://${firebaseAuthDomain}`).origin;
    } catch {
      // Ignore malformed optional build configuration in the report-only policy.
    }
  }

  // Source inventory from current Guest code: Razorpay's checkout script/frame,
  // Firebase Phone Auth's reCAPTCHA (Google script/frame/connect), configured
  // Gateway API, Firebase public poster storage, Google account avatars, and
  // object URLs used for ticket downloads. OAuth is a top-level redirect.
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://api.razorpay.com",
    "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://www.google.com https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://storage.googleapis.com https://firebasestorage.googleapis.com https://lh3.googleusercontent.com",
    "font-src 'self' data:",
    `connect-src 'self' ${apiOrigin} https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.google.com https://www.gstatic.com https://api.razorpay.com`,
    `frame-src https://checkout.razorpay.com https://www.google.com https://recaptcha.google.com${firebaseAuthOrigin ? ` ${firebaseAuthOrigin}` : ''}`,
    "media-src 'self' https://storage.googleapis.com https://firebasestorage.googleapis.com",
  ].join('; ');
}

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
          {
            key: 'Content-Security-Policy-Report-Only',
            value: reportOnlyCsp(),
          },
        ],
      },
      {
        source: '/api/auth/:path*',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
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
            value: 'public, max-age=604800, stale-while-revalidate=2592000',
          },
        ],
      },
      {
        source: '/app/screens/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=2592000',
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
