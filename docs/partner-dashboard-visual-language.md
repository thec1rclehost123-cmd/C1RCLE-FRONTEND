# Partner Dashboard visual language

The Guest Portal `/search` page is the visual reference for Venue, Host, and Promoter workspaces. Apply its visual language consistently while preserving each route's information architecture, role permissions, and workflows.

## Shared rules

- Use Inter for display and body text. The Partner Dashboard root layout self-hosts the same font used by the Guest Portal.
- Use a near-black canvas (`#070807`), high contrast white text, restrained translucent surfaces and borders, and a single C1RCLE orange accent (`#FF6842`).
- Use soft ambient orange and neutral light behind the workspace. Keep glows subtle so dense operational data remains easy to scan.
- Use rounded controls and panels, with clear focus states and readable muted text. Keep status colors semantic; orange is the brand action color, not a replacement for success, warning, or error.
- Keep layouts responsive and preserve all existing data, behavior, and role-specific navigation.

## Source of truth

- Font loading and shared typography/color aliases: `apps/partner-dashboard/src/app/layout.tsx` and `apps/partner-dashboard/src/app/globals.css`.
- Shared Venue, Host, and Promoter workspace shell and palette: `apps/partner-dashboard/src/styles/partner-v3.css` and `apps/partner-dashboard/src/components/partner-v3/partner-v3.module.css`.
- Legacy `/venue`, `/host`, `/promoter`, and `/partner-network` paths redirect to their canonical workspace routes in `apps/partner-dashboard/next.config.ts`.
- Guest Portal reference: `apps/guest-portal/src/features/explore/components/SearchExperienceClient.tsx`.
