# Scanner app: web deployment (staging) and native later

The scanner is an Expo app. For testing it ships first as a **web build** on Vercel (a static single-page app, the same hosting as the other three apps). Native iOS and Android builds (EAS) come later, once the web build has been proven end to end.

## How it reaches the backend

Browser, directly to the API host (no BFF: the scanner uses a bearer token, not the dashboards' cookie session):

`scanner web origin  ->  Cloudflare  ->  nginx sidecar (Render)  ->  Fastify gateway`

- Cloudflare stamps `X-Origin-Verify` and the real client IP; the browser never holds the secret. nginx forwards `Authorization`, `X-Organization-Id`, `Idempotency-Key` and `X-Scanner-Session-Token`.
- The gateway's CORS allow-list must contain the scanner's origin, or the browser blocks every call. Verified headers allowed today: `Authorization, Content-Type, X-Organization-Id, X-Request-Id, X-Client-Request-Id, Idempotency-Key, If-Match, X-Scanner-Session-Token`.
- Edge rate limits apply per client IP (`/api/v2/` 10 r/s, burst 20; `/api/v2/auth/` 5 r/s, burst 10). A venue's devices share one public IP: see the backend handover for the door-zone recommendation.
- Caching: the gateway answers door and auth routes `no-store`; nginx does not cache. The web build itself is cached by Vercel's CDN: hashed files under `/_expo/static/` and `/assets/` are `immutable` for a year, `index.html` is `no-cache` so a new deploy is picked up on the next load.

## One-time setup

1. **Vercel project** `c1rcle-v2-scanner-app` in team `thec1rcles-projects`, repo `C1RCLE-FRONTEND`, production branch `staging`, root directory `apps/scanner-app`, Node 24. Build settings come from `apps/scanner-app/vercel.json`.
2. **Environment variables** (Production and Preview):
   - `EXPO_PUBLIC_API_BASE_URL=https://circle-v2-backend.onrender.com`
   - `EXPO_PUBLIC_ENV=staging`
   - leave `EXPO_PUBLIC_ORGANIZATION_ID` unset (the app discovers the venue after sign-in).
     These are baked into the bundle at build time: changing them needs a redeploy.
3. **Custom domain** `scan.thec1rcle.com` (Vercel project domain, then a DNS-only CNAME in Cloudflare to the target Vercel shows). A custom domain is needed because `*.vercel.app` deployments sit behind Vercel's login for this team (`ssoProtection: all_except_custom_domains`), which door staff cannot pass.
4. **Backend origin allow-list** on Render (`circle-v2-backend`): append `https://scan.thec1rcle.com` to BOTH `ALLOWED_ORIGINS` and `BETTER_AUTH_TRUSTED_ORIGINS` (comma-separated, exact origin, no trailing slash), then redeploy.

## Verify (copy-paste)

```sh
# 1. The edge allows the scanner origin (expect access-control-allow-origin: https://scan.thec1rcle.com)
curl -s -o /dev/null -D - -X OPTIONS https://circle-v2-backend.onrender.com/api/v2/door/events \
  -H 'Origin: https://scan.thec1rcle.com' -H 'Access-Control-Request-Method: GET' \
  -H 'Access-Control-Request-Headers: authorization,x-organization-id,x-scanner-session-token' | grep -i access-control

# 2. Static asset caching (expect immutable) and shell caching (expect no-cache)
curl -sI https://scan.thec1rcle.com/ | grep -i cache-control
```

Then sign in with a real staff account: login -> (first time: set password) -> venue -> pairing -> door code -> scan.

## Native app (later)

Needs an `eas.json`, bundle identifiers, and Apple and Google developer accounts. Not started. Offline scanning on a venue's Wi-Fi is the main reason to prefer native for real doors.
