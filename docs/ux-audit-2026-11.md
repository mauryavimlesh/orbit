# ORBIT UX & engineering audit — 12 November 2026

## Scope and evidence
Source review of `mauryavimlesh/orbit` on branch `ux/accessibility-glass-preserved-2026-11`.
Reviewed the React app, styling, research workspace, catalog, server initialization, package scripts and repository tree.
No browser session, field analytics, live performance benchmark, WCAG conformance audit, or authenticated multi-user test was available. Findings below distinguish verified code-level issues from hypotheses.

## Design constraint
**Preserve ORBIT's warm glassmorphism.** Keep its `orbit-glass-panel`, `orbit-glass-subtle`, `orbit-glass-pill`, and `orbit-glass-pill-active` design tokens, warm atmospheric gradients, layout language, and user-facing features.

## Implemented on this branch
1. Skip-to-content navigation, visible keyboard focus, and motion-preference support.
2. Search input accessible labels, active navigation status, expanded/collapsed dropdown semantics.
3. Constrained dropdown widths, flexible narrow-screen search and navigation.
4. Explicit click handlers on secondary read/resume buttons; accessible study-notes labels.
5. Ignore new runtime SQLite artifacts; do **not** delete the tracked production/development database on assumption.
6. GitHub Actions continuous integration for dependency installation, TypeScript check and frontend build.

## Remaining priority work

### P0 — Data lifecycle, privacy, production deployment
- The repository currently tracks `orbit_data.sqlite`, while `server.ts` opens it as runtime state. Confirm whether it contains any personal, private or production information before changing or publishing anything further.
- `.gitignore` does **not** remove previously committed content, its history, or any exposed data. A controlled migration may require backup, deployment storage changes, removing the tracked database, history remediation and credential rotation.
- Confirm persistence design and tenant isolation for server-side notes and state before inviting real users. Do not infer multi-user readiness from SQLite availability.

### P0 — Accessible research card interactions
- `src/App.tsx` contains whole-card clickable `div` elements alongside independent nested action buttons. The primary read/resume buttons can be used by keyboard after this branch's changes, but full-card keyboard parity and coherent semantics require refactoring and browser testing.
- Validate dialog focus handling, closing via Escape, focus restoration, and meaningful accessible labels in `ResearchWorkspaceModal`.

### P0 — Automated and manual verification
- GitHub Actions now runs type-check and build. Add unit tests and focused browser smoke tests for search, repository exploration, paper reader, saving notes, error states and browser Back/Forward.
- Test keyboard-only navigation and screen readers with the real rendered application.
- Test responsive behavior at 320px, 375px, 768px and desktop, including long technical paper titles.

### P1 — Onboarding and information hierarchy
- Current navigation exposes Discover, Repositories, My Library and My Notes. Verify with first-time users whether the distinction is understandable.
- Evaluate the density of technical controls and source/provider metadata before the user has completed a first discovery. Experiment with progressive disclosure rather than removing research depth.
- Define meaningful activation (e.g., opening and successfully engaging with a paper), then measure weekly completion and learning value rather than raw session time.

### P1 — Maintainability
- Large source modules include `src/App.tsx`, `ResearchWorkspaceModal.tsx` and `server.ts`. Split by responsibility gradually behind tests; do not attempt an untested rewrite.
- Audit client localStorage and server persistence behavior, especially across sessions and accounts.

### P2 — Growth experiments, only with evidence
- Test learn-and-resume prompts, saved discoveries, personalization and optional reviews against baseline retention.
- Avoid manipulative streak or notification mechanisms. Personalization and data collection should be transparent and user-controlled.

## Release checklist
- [x] Development branch created independently from `main`
- [x] Source changes committed
- [x] CI type-check passes
- [x] CI frontend build passes
- [ ] Mobile browser smoke test
- [ ] Screen-reader and keyboard journey test
- [ ] Verify database privacy and production storage
- [ ] Review and approve draft pull request
- [ ] Merge only after outstanding P0 issues are understood

This report is a source-based audit, not a completed end-to-end live usability or security penetration test.
