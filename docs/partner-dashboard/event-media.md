# Event editor media

The Venue and Host creation editors include an optional Media step immediately before Review.
It saves a YouTube HTTPS link, up to ten gallery images, and up to twelve artist/sponsor spotlights.
Spotlights support a title, optional image/link, up to 350 characters of copy, and optional IST start/end times.
Images use the existing organization-authorized signed image upload endpoint and its 5 MB budget.
The event media contract is backend-owned, persists on the event aggregate and Firestore adapter, and is projected onto the Guest event page.

Gallery and spotlight images currently require a public or unlisted event. Restricted events fail closed until private media asset delivery is supported. Public projections omit media on historical restricted records.

## Guestlist privacy

The owner approved names/photos only with explicit guest opt-in. There is currently no persisted guest attendance consent or opt-in flow. Advanced setup therefore marks public guestlist sharing as unavailable. It does not show demo attendees, expose existing guests, or offer an ineffective visibility toggle. Consent collection, withdrawal and the consent-filtered public projection remain required before public guestlists can be enabled.

Event title styling uses the optional `media.titleFont` enum: classic, eclectic, fancy, digital, literary, impact, modern, and condensed. The editor samples and guest event heading use matching self-hosted Next font families. Older events default to Classic. Creation passes the choice through the existing media contract and Firestore aggregate mapping.
