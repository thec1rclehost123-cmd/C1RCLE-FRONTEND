# Majid - Presence Tab

## Overview

The **Presence Tab** is a section added to the Host & Venue Dashboards in the partner-dashboard app. It manages how a venue/host profile appears publicly to guests and partners, including profile identity, content, media, broadcasts, engagement analytics, and public page configuration.

**Added by:** Majid
**Date:** 2026-09-15

---

## Files Created / Modified

### Modified

| File                                                                  | Change                                                                                                                                                |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/partner-dashboard/src/components/partner-shell/config.ts`       | Added `Presence` navigation entry after Marketing tab for venue (V2 shell, `/venue/*`) AND host (V2 shell, `/host/*`)                                 |
| `apps/partner-dashboard/src/studios/studio-config.ts`                 | Added `presence` to `StudioIconName` union and a Presence nav item between Marketing and Finance for venue AND host (V3 shell, `/partner/[studio]/*`) |
| `apps/partner-dashboard/src/components/partner-v3/PartnerSidebar.tsx` | Mapped `presence` icon to `GuestPortalIcon` (Globe) in the V3 sidebar ICONS map                                                                       |
| `packages/icons/src/index.ts`                                         | Added `Upload as UploadIcon` to the shared icon facade                                                                                                |

### Created

| File                                                                           | Purpose                                                                                                              |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `apps/partner-dashboard/src/app/venue/presence/page.tsx`                       | Next.js route page for `/venue/presence` (V2 shell)                                                                  |
| `apps/partner-dashboard/src/app/host/presence/page.tsx`                        | Next.js route page for `/host/presence` (V2 shell)                                                                   |
| `apps/partner-dashboard/src/app/partner/[studio]/presence/page.tsx`            | Next.js route page for `/partner/{venue                                                                              | host}/presence` (V3 shell, role-aware) |
| `apps/partner-dashboard/src/components/venue/screens/PresenceScreen.tsx`       | Main Presence screen component (role-aware via `studio` prop) with all tabs                                          |
| `apps/partner-dashboard/src/components/venue/screens/VenuePresence.module.css` | CSS Module styles for the Presence page                                                                              |
| `apps/partner-dashboard/src/components/venue/venue-presence-model.ts`          | Static mock data model (genres, style tags, presence config, meta, and menu — `venueMenuSource` + `VenueMenu` types) |
| `apps/partner-dashboard/src/components/venue/host-presence-model.ts`           | Host-flavoured mock data (profile/posts/highlights/stats + card meta)                                                |
| `docs/Interns/Majid-Presence-Tab.md`                                           | This documentation file                                                                                              |

---

## Navigation

### Venue sidebar

The Presence tab appears in the **venue** sidebar **below Marketing** and **above Finance**:

```
Overview
Events
Slot Requests
Partners
Marketing
Presence    <-- NEW
Finance
Settings
```

### Host sidebar

The Presence tab appears in the **host** sidebar **below Marketing** and **above Finance** (same position as venue):

```
Overview
Events
Slot Requests
Partners
Marketing
Presence    <-- NEW
Finance
Settings
```

There are two sidebar shells in the app; Presence is wired into both, for both roles:

| Shell                      | Role  | Config                                   | Sidebar component               | Route                     |
| -------------------------- | ----- | ---------------------------------------- | ------------------------------- | ------------------------- |
| V3 (user's active sidebar) | venue | `src/studios/studio-config.ts`           | `partner-v3/PartnerSidebar.tsx` | `/partner/venue/presence` |
| V3 (user's active sidebar) | host  | `src/studios/studio-config.ts`           | `partner-v3/PartnerSidebar.tsx` | `/partner/host/presence`  |
| V2 (legacy shell)          | venue | `src/components/partner-shell/config.ts` | `partner-shell` config          | `/venue/presence`         |
| V2 (legacy shell)          | host  | `src/components/partner-shell/config.ts` | `partner-shell` config          | `/host/presence`          |

The V3 route (`partner/[studio]/presence/page.tsx`) accepts `venue` and `host` and renders `PresenceScreen` with `requirePermission={false}` so the sidebar (which does not filter nav items by permission) does not show the screen as "unavailable". Host only exposes the `page` tab (no Menu / Public Page); venue exposes all three.

### Permission handling

`PresenceScreen` accepts a `requirePermission` prop (default `true`). When `true` it gates rendering behind `auth.hasPermission('VIEW_MARKETING')` (plus wildcard/empty-grant handling) and shows the "unavailable" state; the V3 route passes `requirePermission={false}` so the screen always renders there. The V2 routes keep the permission gate.

---

## Page Structure

### Outer Tabs (URL-based via `?tab=`)

**Venue** (`/venue/presence` or `/partner/venue/presence`):

| Tab              | Label       | URL           | Description                                  |
| ---------------- | ----------- | ------------- | -------------------------------------------- |
| `page` (default) | Venue Page  | `?tab=page`   | Full profile management with inner tabs      |
| `menu`           | Menu        | `?tab=menu`   | Full digital menu manager (sections → items) |
| `public`         | Public Page | `?tab=public` | Presence config editor for guest-facing data |

**Host** (`/host/presence` or `/partner/host/presence`) exposes a single outer tab (matching the reference `HostPresencePageClient`):

| Tab              | Label     | Description                                                                                   |
| ---------------- | --------- | --------------------------------------------------------------------------------------------- |
| `page` (default) | Your Page | Full profile management with inner tabs (Identity / Content / Media / Broadcast / Engagement) |

The outer tab links are built from a `baseHref` prop (`/venue/presence`, `/host/presence`, `/partner/{role}/presence`), so the tab bar always links within the active shell/route.

The hero card and inner tabs are identical between venue and host; only the badge (`Venue` vs `Host`), the View Live URL (`/venue/{slug}` vs `/host/{slug}`), the public-profile copy line, and the mock data source change (selected by the `studio` prop: `venuePresenceSource` vs `hostPresenceSource`).

---

### Page Tab (Inner Tabs) — venue & host

The **Page** tab (Venue Page / Your Page) contains 5 inner tabs managed via React state, shared by both roles:

#### 1. Identity Tab

Manages the core profile identity:

**Core Identity Section:**

- Display Name (text input, save on change)
- Tagline (text input)
- Neighborhood (text input)
- Category Tag (select: Host, Venue, Brand, Promoter, Collective)
- Bio / Story (textarea, 5 rows)
- Role / Type (pill toggle: DJ, Promoter, Collective, Artist, Producer, Label)

**Action Layer Section:**

- WhatsApp Number (text input)
- Primary CTA Type (select: Follow Only, Contact via WhatsApp, Phone Call, Visit Website, Buy Tickets)

**Visual Identity Section:**

- Cover Image (click-to-upload, recommended 1920x480px)
- Uses `UploadIcon` (lucide Upload arrow) in the placeholder box, with a camera + "Change cover" overlay on hover (matching the reference's `ImageUploadField` pattern)

**Sound & Style Section:**

- Genres (multi-select pill buttons, 20 options: Techno, House, Deep House, etc.)
- Style Tags (multi-select pill buttons, 12 options: Underground, Mainstream, Exclusive, etc.)

**Social & Contact Section:**

- Instagram, Twitter/X, SoundCloud, Spotify, Website, Email, Location (text inputs in 3-column grid)

#### 2. Content Tab

Manages posts, highlights, and press:

**Timeline Updates:**

- Create new posts (content + optional image)
- Delete existing posts
- Display: post card grid with image, content, date, likes, views

**Story Highlights:**

- Create highlights (via prompt dialog)
- Delete highlights
- Display: horizontal scrollable circles

**Press & Features:**

- Display press snippets (quote + source)
- Placeholder to add new press quotes

#### 3. Media Tab

Manages photos and videos:

**Photo Gallery:**

- Upload photos (JPG/PNG/WebP, max 10MB)
- Delete photos
- Display: 4-column grid with hover delete button

**Videos & Aftermovies:**

- Add videos (title, URL, type: aftermovie/recap/promo/live)
- Remove videos
- Display: 3-column grid with type badge

#### 4. Broadcast Tab

Sends push notifications to followers:

- Notification Title (text input)
- Message Body (textarea)
- Target: follower count display
- Send Broadcast button
- Success/error feedback
- Info cards: Auto-Broadcasts, Delivery Time

#### 5. Engagement Tab

Displays audience analytics:

**Audience Overview:**

- Total Followers, This Month, Engagement Rate, Page Views (stat cards)

**Follower Growth:**

- Placeholder (insufficient historical data)

**Audience Demographics:**

- Age Bands (horizontal bar chart)
- Gender Split (circle indicators)
- Top Cities (ranked list with percentages)

**Engagement Patterns:**

- Best Posting Times (day/time/engagement level)
- Content Performance (content type/engagement rate)

---

### Menu Tab (Digital Menu Manager) — venue only

Replaces the original placeholder with a full interactive menu editor (matching the reference `app/venue/menu/PageClient.tsx`):

**Header:**

- "Digital Menu Manager" title + description
- Live status badge (Published / Draft) and an Unpublish/Publish toggle
- "Unsaved changes" hint while edits are pending

**Sections sidebar:**

- Add section (+) button; each section is selectable to edit its items
- Rename inline (editable input per section)
- Reorder up/down and Delete section actions (shown on hover)
- Item count per section
- Each section row is a `div` with `role="button"` (keyboard-activatable via Enter/Space) instead of a plain `<button>`, so the nested move/delete `<button>`s stay valid HTML (avoids the "`<button>` cannot be a descendant of `<button>`" hydration error)

**Item editor (active section):**

- Add Item button
- Per-item inline editing: name, description, price (INR, stored as paise), dietary tags (remove via `×`), Available toggle
- Reorder up/down and Remove actions (shown on hover)
- Empty states for "no sections yet" and "no items yet"

**Data:** static mock in `venue-presence-model.ts` — `venueMenuSource` (sections: Starters & Small Plates, Mains, Desserts & Drinks), types `VenueMenuItem` / `VenueMenuSection` / `VenueMenu`, plus `EMPTY_VENUE_MENU`.

The reference also has a menu-images upload manager (`components/venue-management/MenuManager.tsx`) and restaurant-mode settings (`components/venue-layout/MenuManagementSection.tsx`) which live outside the presence page; those are out of scope here (screens must not call `fetch()` / no live APIs).

---

### Public Page Tab (PresenceConfigEditor) — venue only

Manages guest-facing venue data:

**Basic Info:**

- Venue Name (text, max 120 chars)
- Description (textarea, max 2000 chars)
- Price Range (text, max 80 chars)

**Image Gallery:**

- 7-slot image grid
- Upload via FormData to `/api/partners/venues/upload`
- Remove images

**Table Booking:**

- Toggle switch (enable/disable)
- Max Capacity (number, 0-100,000)
- Available Timings (add/remove text tags, max 50 items)
- Contact Info (text, max 120 chars)

**Save Button** - POSTs to `/api/partners/venues/presence`

---

## API Endpoints Used

Note: screens in this repo use static mock data (`venue-presence-model.ts` / `host-presence-model.ts`), so the endpoints below document the reference implementation's behaviour rather than runtime calls here.

| Method | Endpoint                                                | Purpose                            |
| ------ | ------------------------------------------------------- | ---------------------------------- |
| GET    | `/api/partners/venues/page?venueId={id}&dashboard=true` | Fetch venue profile data           |
| POST   | `/api/partners/venues/page`                             | Update venue profile               |
| GET    | `/api/partners/hosts/page?hostId={id}&dashboard=true`   | Fetch host profile data            |
| PATCH  | `/api/host/profile`                                     | Update host profile                |
| POST   | `/api/profile`                                          | Create/delete posts and highlights |
| POST   | `/api/partners/venues/upload`                           | Upload images via FormData         |
| POST   | `/api/partners/hosts/broadcast`                         | Send push broadcast (host)         |
| POST   | `/api/partners/venues/broadcast`                        | Send push broadcast                |
| GET    | `/api/partners/venues/presence?venueId={id}`            | Fetch presence config              |
| POST   | `/api/partners/venues/presence`                         | Save presence config               |

---

## UI Patterns

- **CSS Modules** for styling (consistent with existing screens)
- **Save-on-change** pattern for text fields (updates fire immediately)
- **Icons from `@c1rcle/icons` facade** where semantic names exist (e.g. `UploadIcon`); local inline SVGs are kept for the handful of UI-only glyphs not in the facade
- **Responsive design** with breakpoints at 1100px and 640px
- **CSS variables** for theming (`--partner-accent`, `--partner-border`, `--dashboard-surface`, etc.)
- **Modal dialogs** for photo upload, video add, post composer

---

## Reference

This implementation is based on the Presence pages from `C:\Users\majid\thec1rcle` project, adapted to match the UI patterns and architecture of `D:\C1RCLE-FRONTEND`:

- Venue reference: `apps/partner-dashboard/app/venue/presence/VenuePresencePageClient.tsx` (2120 lines)
- Host reference: `apps/partner-dashboard/app/host/presence/HostPresencePageClient.tsx` (2053 lines) — identical 5 inner tabs; differs only in outer tab set (single "Your Page"), `Host` badge, `/host/{slug}` View Live URL, and public-profile copy
- Venue public tab reference: `apps/partner-dashboard/components/venue-management/PresenceConfigEditor.tsx` (566 lines)
- Adapted to use CSS Modules instead of Tailwind CSS
- Adapted to follow existing screen component patterns (MarketingScreen, SettingsScreen)
- Icons follow the reference's lucide iconography via the shared `@c1rcle/icons` facade (e.g. `UploadIcon` for the cover placeholder)
- One shared `PresenceScreen` covers both roles via the `studio` prop; host and venue each keep their own mock model file
