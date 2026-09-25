# ANIL-CALENDAR-BLOCK-UNBLOCK-WIRING

**Intern:** Anil Kumar · **Branch:** `codex/partner-v3-rebuild` · **Date:** 2026-09-21
**Repos:** `C1RCLE-FRONTEND` (8 files) · `C1RCLE-BACKEND` (7 files)

---

## 1. Problem

The "Block date" dialog and "Unblock date" button existed in the UI but **neither
called any API**. Blocks were never persisted, the calendar never fetched live
data, month navigation broke outside three fixture months, and there was no
backend `DELETE` route or overlap guard.

---

## 2. Solution

### Backend (7 files)

| File | Change |
|---|---|
| `domain/models/venue.ts` | New: `cancelVenueBlock` (blocked→cancelled soft-cancel), `doSlotRangesOverlap` (half-open interval check), `assertSlotRangeFree` (overlap guard) |
| `domain/ports/repositories.ts` | Added `getSlotById` + `listOverlappingSlots` to `VenueSlotRepository` interface |
| `application/venues/venue-service.ts` | New `unblock()` method (IDOR guard → cancel → save); `block()` now calls `assertSlotRangeFree` first |
| `firestore-venue-slot-repository.ts` | Implemented `getSlotById` + `listOverlappingSlots` for Firestore |
| `memory-repositories.ts` | Implemented `getSlotById` + `listOverlappingSlots` for in-memory tests |
| `routes/v2/partner/venues.ts` | New `DELETE /venues/:venueId/calendar/blocks/:blockId` route (`venue.manage`, idempotency, error mapping) |
| `routes/v2/partner/venues.test.ts` | 135 new lines — unblock happy path, 404, 400 (already cancelled), 403, overlap guard |

### Frontend (8 files)

| File | Change |
|---|---|
| `VenueCalendarScreen.tsx` | Replaced static fixture data with live fetches (venues + slots + events); added `handleBlock` / `handleUnblock`; fixed month navigation via `shiftMonthKey` + `buildMonthGrid`; loading/error status messages |
| `BlockDateDialog.tsx` | Wired `onBlock` prop to API call; overnight toggle with `addDays` helper; `submitting` / `submitError` states |
| `CalendarDayDetails.tsx` | `block` (single) → `blocks[]` (array); replaced always-disabled `BlockedDetail` with live `BlockEventCard` (unblock button + overnight span display) |
| `CalendarScreens.test.tsx` | 372-line suite — block flow, unblock flow, loading and error states |
| `calendar/page.tsx` | Removed `data` prop — screen now fetches internally |
| `calendar.module.css` | Added `.blockError` red-tinted alert style |
| `partner-data-source.ts` | Added `CalendarBlock.endDate` for overnight blocks + JSDoc on all fields |

---

## 3. API Flow

```
Block date  →  POST /venues/:id/calendar/blocks
               VenueService.block() → assertSlotRangeFree() → 400 on overlap
               → createVenueBlock() → save → append to local state

Unblock date  →  DELETE /venues/:id/calendar/blocks/:blockId
                 VenueService.unblock() → getSlotById() (IDOR check)
                 → cancelVenueBlock() → 400 if not 'blocked' → save
                 → filter from local state (404 silently ignored)
```

---

## 4. Verification

- Backend gateway suite: **135 new tests** (unblock, overlap, 404, 400, 403)
- Frontend: **372-line test suite** (block/unblock/error/loading flows)
- `tsc --noEmit` clean; `eslint` clean on all touched files

---

## 5. Key Design Decisions

- **Soft-cancel:** unblocked slots stay as `status: 'cancelled'` — audit trails
  preserved; availability derivations already exclude cancelled slots.
- **IDOR guard returns 404, not 403:** prevents leaking block existence across
  venue boundaries.
- **No new Firestore index:** overlap check uses a single `venueId == X` query
  and filters in application code.
- **Overnight blocks:** `endDate` on `CalendarBlock` is optional — legacy blocks
  without it are treated as same-day.
