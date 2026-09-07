# Guest Portal frontend handoff

This document defines the presentation boundary for the Guest Portal. The current UI is fixture-backed. Backend integration should replace route data sources and authentication state without changing the feature components or reintroducing client-side loading work that can run on the server.

## Integration rules

1. Keep initial reads in Server Components. Fetch, authenticate, validate, and normalize data in `page.tsx`, then pass typed data into the existing feature views.
2. Keep Client Components limited to interaction: filtering, carousels, menus, forms, modal state, and motion.
3. Never fall back to fixtures after an API error in a production build. Render a typed empty, unavailable, or retry state instead.
4. Preserve money as integer paise and timestamps as ISO 8601 strings across the boundary. Format them only in the presentation layer.
5. Treat frontend auth checks as display logic only. The API must authorize every protected read and mutation.
6. Do not place access tokens in local storage. The existing auth package keeps the access token in memory and expects a backend-owned HTTP-only refresh credential.
7. Keep route-level `notFound()` behavior for missing public resources. Protected resources should distinguish unauthenticated, forbidden, and missing responses before rendering.
8. Preserve the current media rules: responsive poster dimensions, pre-generated WebP/AVIF for local assets, poster-first video loading, mobile video variants, and offscreen pause behavior.

## Route replacement map

| Route | Current source | Presentation contract | Backend integration point |
| --- | --- | --- | --- |
| `/` | `home.fixture.ts` and `explore.fixture.ts` | `HomeFixture`, `ExploreEvent[]` | Fetch editorial home content and featured events in `src/app/page.tsx`. Cache public editorial data and pass normalized records into the existing sections. |
| `/explore` | `explore.fixture.ts` | `ExploreEvent[]`, `ExploreCity[]` | Fetch the first event result set on the server. Keep local filtering only if the complete result set is intentionally bounded; otherwise map filter/search state to URL parameters and fetch paginated results. |
| `/event/[eventId]` | `event-detail.fixture.ts` | `EventDetailFixture` | Resolve the public event by slug/id in the page and metadata functions. Deduplicate the read with React `cache()` or a shared cached server loader. Return `notFound()` for a missing event. |
| `/checkout/[id]` | `booking.fixture.ts` | `BookingEventFixture` | Load authoritative event and available tiers on the server. Availability and price must be revalidated by the backend when the user proceeds; the UI model is never checkout authority. |
| `/confirmation/[id]` | `booking.fixture.ts` | `BookingConfirmationFixture`, `BookingEventFixture` | Load the authenticated user's order/confirmation. Do not put private order data in static params, public caches, or metadata. Replace preview references and decorative pass content only after a verified order response. |
| `/tickets` | `tickets.fixture.ts` | `TicketWalletData`, `TicketShowcaseItem[]` | Resolve session before choosing guest or wallet view. Fetch the wallet only for an authenticated user. QR/pass data must come from an authorized, short-lived backend response rather than the decorative fixture payload. |
| `/profile` | `profile.fixture.ts` | `ProfileFixture` | Require the current session on the server and fetch the current user's profile/events. Mutations from settings forms should use authenticated API endpoints and refresh affected server data. |
| `/profile/[userId]` | `public-profile.fixture.ts` | `PublicProfileFixture` | Fetch only public profile fields. Apply privacy rules on the backend before returning the DTO. |
| `/hosts` | `directory.fixture.ts` | `HostDirectoryProfile[]`, `VenueDirectoryProfile[]` | Fetch public directory results on the server. Add pagination/search parameters when the directory is no longer bounded. |
| `/host/[hostId]` | `directory.fixture.ts` | `HostDirectoryProfile` | Resolve public host profile and event summaries. Return `notFound()` for missing or unavailable hosts. |
| `/venue/[venueId]` | `directory.fixture.ts` | `VenueDirectoryProfile` | Resolve public venue profile and event summaries. Return `notFound()` for missing or unavailable venues. |

The source contracts live in:

- `src/features/home/types/home.types.ts`
- `src/features/explore/types/explore.types.ts`
- `src/features/event-detail/types/event-detail.types.ts`
- `src/features/booking/types/booking.types.ts`
- `src/features/tickets/types/tickets.types.ts`
- `src/features/profile/types/profile.types.ts`
- `src/features/directory/types/directory.types.ts`

These are presentation DTOs, not database schemas. Backend responses may contain more fields, but route loaders should deliberately map only the fields the UI needs.

## Auth handoff

`@c1rcle/auth` already exposes `useSession()` for interactive client slices and keeps its access token in memory. Production integration still needs a server-visible session bootstrap so the first HTML response renders the correct account and ticket state without a logged-out flash.

Recommended boundary:

- Resolve the session in the server shell from the backend-owned cookie.
- Pass only display-safe identity state to `NavbarActions`.
- Pass the authenticated wallet DTO to the tickets presentation, or the public showcase DTO when anonymous.
- Keep authorization in the API. A visible profile link or hidden button is not an authorization decision.
- Represent session loading explicitly only when a client transition genuinely cannot be resolved on the server.

## Cache and freshness policy

- Editorial homepage content and public directories: cached with bounded revalidation and tag-based invalidation.
- Public event pages: cached by event id/slug and invalidated when the event, venue, host, availability label, or poster changes.
- Search results: cache only stable public query combinations; paginate rather than shipping an unbounded catalogue to the browser.
- Profile, wallet, checkout, and confirmation: private/no-store unless the backend supplies a user-scoped caching design.
- Ticket availability and checkout totals: always revalidated at the authoritative mutation boundary.

## Loading and error behavior

- Add route `loading.tsx` files only where a real backend read can suspend long enough to need one. Skeleton dimensions must match final content to protect CLS.
- Public missing records use `notFound()`.
- Network/provider failures use an honest retry state and do not silently render fixtures.
- Empty search, no tickets, no events, and no public profile content remain valid product states, not errors.
- Confirmation must never be inferred from a client redirect. Render it only from an authenticated verified order response.

## Performance budgets

These are handoff gates, not suggestions:

- Mobile hero video: target at most 800 KB; desktop hero video: target at most 2 MB.
- Below-fold desktop video: target at most 2 MB and never requested before its section approaches the viewport.
- Event card image: target at most 200 KB at its delivered dimensions.
- LCP image/video poster: present in initial HTML, correctly sized, and not blocked by client JavaScript.
- Route-specific interactive JavaScript: add only for features used on that route. Avoid mounting a global query, theme, or animation provider when the route does not need it.
- No continuous animation loop when the element is offscreen, the tab is hidden, Save-Data is enabled, or reduced motion is requested.
- No layout reads in a per-frame scroll callback. Cache geometry and batch visual writes through `requestAnimationFrame`.
- No permanent `will-change`; apply it only while an interaction or scroll sequence is active.
- No unexpected layout movement from images, posters, videos, fonts, or skeletons.

## Backend-ready acceptance checklist

- Production typecheck, lint, unit tests, and build pass.
- Public dynamic routes return real 404 responses for unknown ids.
- Anonymous and authenticated ticket states are determined before meaningful paint.
- Every API response is mapped into the relevant presentation DTO at the route boundary.
- No production path imports a fixture or substitutes fixture data after an API failure.
- Checkout and confirmation have explicit pending, failure, expired, and success states.
- QR/pass UI does not expose reusable entry material without backend authorization and expiry.
- Images have explicit dimensions/sizes; local media uses generated formats; videos have posters and mobile sources.
- Motion is compositor-friendly, visibility-gated, and reduced-motion safe.
- Browser smoke tests cover home, explore, event, checkout, confirmation, tickets, profile, host, and venue at desktop and mobile widths.
- Real backend integration adds contract tests for DTO mapping plus E2E evidence for anonymous browsing, authenticated wallet, checkout, and confirmation.

## Known media cleanup before deployment

The optimized runtime paths no longer request the original photo-string JPG files, but those source files remain under `public/` and therefore still enlarge the deployment artifact. Remove or archive them only after confirming no other surface references them. The desktop party video also remains above the target budget and needs a compressed desktop encode before final production handoff.
