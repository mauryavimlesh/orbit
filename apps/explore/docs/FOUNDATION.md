# Foundation engineering record — 2026-11-13

## Architecture decision ADR-001

The existing ORBIT repository contains the React/Express research platform. The supplied `orbit-explore-mvp.zip` is a separate dependency-free Canvas educational app. Import and harden it under `apps/explore`; do not replace research routes, dependencies, database or deployment settings. Standalone publication is intentional until integration gets its own review.

Runtime boundaries: `contracts.js` validates v1 scene snapshots/preferences; `storage.js` owns tolerant persistence and legacy migration; `tabs.js` owns keyboard tab behavior; `physics.js` remains the existing numerical solver; `app.js` coordinates presentation. No remote tutor or AI calls are added. Scene contracts exclude trajectories and learner question text. Full renderer/state-store separation remains future Foundation work.

## Issues and acceptance gates

- F01 #6: strict v1 contracts, runtime integration, migration and blocked/corrupt storage tests.
- F02 #7: deterministic runtime-only build, integrity manifest, scoped read-only CI.
- F03 #8: tab semantics/keys, object selection, reduced-motion startup, meaningful playback state, nonvisual radius/energy and warnings. Browser validation remains required before closing.

## Security and privacy review

No dependencies, credentials, analytics, new network API or authentication added. Saved data: local language, difficulty, low-graphics setting and one mastery boolean. Questions are not saved. Access/reads/writes to storage may fail without stopping learning. Strict runtime validation rejects unsupported versions, unknown fields, accessor fields, invalid enum values and nonfinite/range-invalid numbers. Unsupported stored envelopes are not overwritten on startup; explicit user settings changes may replace them.

Tutor answers use textContent; localized headline HTML is a fixed authored string, never user input. Existing source links use noopener/noreferrer. Build includes only allowlisted runtime assets, rejects symlinks/hidden assets, and does not include tests, docs or secrets. This is not an authentication, content-publication, embed isolation or full security audit.

## Accessibility evaluation

Added skip link, visible focus, keyboard tabs with roving focus and selected/panel associations, keyboard object inspection, playback/graphics state, reduced-motion startup and disabled CSS animation. Canvas-independent radius and energy values supplement existing metrics. Unchanged status messages are not repeatedly rewritten. Only translated regions carry the Hindi language attribute because static interface localization is incomplete.

Still required: real browser and screen-reader review, contrast audit, full Hindi localization and mobile/device testing. Unit DOM doubles do not establish WCAG conformance. Optional Playwright smoke suite is provided but local Chromium launch was blocked by OS socket permissions; it did not pass or execute app interactions here.

## Scientific review and limitations

The original seven physics tests pass for the cases they cover. They do not validate all presets. Peer review observed large specific-energy drift on the fall-inward preset (speed=0.1, gravity=1): approximately 87.75 against initial energy -39.28 AU²/yr². A visible disclaimer accompanies approximate values. Close-approach solver validity is an explicit Milestone 2 blocker; do not use these trajectories as validated predictions. A fixed timestep, illustrative collision boundary and viewport truncation remain. The star is the relative-coordinate origin, not a barycentric trajectory. Speed multiplier now explicitly refers to the fixed reference speed.

## Cost register

| Item | New recurring expense | Constraint |
|---|---|---|
| Explore runtime/build/tests | ₹0 | Local, no dependencies or remote calls |
| AI tutoring | ₹0 | Existing deterministic rules only; no metered model |
| CI | No paid service enabled | Public repository workflow; account/provider limits still apply |
| Hosting | Not provisioned | Deploy only after a free quota and review are established |
| Research platform | Unchanged | Existing Gemini integration outside this patch; no credentials supplied or API executed |

## Preview, release and rollback

1. Node 22+ and Python 3: `cd apps/explore && npm ci --offline --ignore-scripts && npm run check`.
2. Local preview: `cd dist && python3 -m http.server 4173 --bind 127.0.0.1`; open http://localhost:4173.
3. Optional browser tooling, installed separately: set NODE_PATH to an environment containing Playwright and CHROMIUM_PATH to a Chromium executable, then `node tests/browser-smoke.mjs` from the app directory. This is not part of the dependency-free default check.
4. Before release: require green remote CI, real browser smoke, accessibility review, scientific limits signoff, and a reviewable hosted preview. No preview host or production deployment was provisioned by this patch.
5. Publish only the generated `dist` contents to an explicitly selected static host. Preserve `integrity.json` with the release commit for verification. Confirm HTTPS, correct JS MIME types, security headers and no unexpected requests at the host.
6. Rollback: restore the previous immutable static artifact or revert the PR commit. New preferences use a separate v1 key; old keys remain intact for rollback. Never delete learner data as part of rollback.

## Known unfinished scope

Foundation is not complete: broad end-to-end/browser coverage, renderer abstraction, shared design primitives, complete app-state synchronization and automated accessibility gates remain. Milestones 2–6 (real 3D, validated close-approach physics, generative tutoring, approved content, accounts, educator tools, safe embeds and production operations) are not delivered by this change.
