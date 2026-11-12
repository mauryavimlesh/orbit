# ORBIT accessibility, guest privacy & discovery upgrade

## Implemented
- Guest notes, bookmarks, watchlists and study progress remain in local browser storage instead of being posted to unauthenticated global server tables.
- Legacy `/api/library/hydrate` does not return other visitors' notes or bookmarks, while `/api/notes/approve` and `DELETE /api/notes/:id` refuse anonymous shared writes. The app saves and deletes guest notes locally.
- Discovery cards offer keyboard-operable native button overlays; explicit paper, note, and resume buttons remain independent.
- Reader dialog receives initial keyboard focus, traps Tab/Shift+Tab inside, and restores focus to the launching control when it closes.
- Three starter discovery chips link to existing sample reading experiences, retaining the glassmorphism design.

## Data safety follow-up before shipping
- `orbit_data.sqlite` was committed previously and remains tracked **unchanged**. Its contents and Git history must be reviewed privately before deletion, rewriting or rotation. Ignoring SQLite files does not remove tracked copies/history.
- The browser-local guest model protects visitors from shared server responses but is **not account sync**. Data is device/browser-specific and is lost if the browser storage is cleared; shared-device users can access that browser profile.
- For authenticated accounts, implement secure server sessions and per-user scoped records with authorization checks before enabling cloud sync. Plan backup, migration and retention of legacy rows.
- Review rate limiting and abuse controls for public AI endpoints. A shared daily request ledger is not a per-user usage quota.
- Run end-to-end tests including first-use, keyboard-only reader flow, saving/deleting notes, anonymous multi-browser separation, and 320px/375px mobile layouts.

## Verification
CI typecheck and frontend build must pass. Browser, accessibility assistive technology, and production privacy testing remain necessary; source-based improvements do not constitute a complete WCAG/security certification.
