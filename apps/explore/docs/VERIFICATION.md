# Verification evidence

Date: 2026-11-13. Runtime: Node v24.22.1.

- Baseline MVP: 7/7 existing physics tests pass.
- Final `npm run check`: JS syntax checks pass; 35/35 Node tests pass; static build succeeds with 7 runtime assets and integrity manifest.
- Includes: 2 app-wiring tests using a DOM double, 3 build integrity/safety tests, 7 contract tests, 7 existing physics tests, 9 storage tests, 7 tab/markup tests.
- Build tests generate two actual artifacts and compare their bytes/hashes; reject unsafe output/symlinks/hidden runtime assets.
- Offline dependency install verified; no npm dependencies added.
- Peer review found startup overwriting unsupported preferences, incorrect language scoping, redundant live status updates and misleading speed label; corrected before final checks.
- Chromium smoke attempt failed before page load: OS denied process-singleton socket. No browser interactions, visual checks or screen-reader tests were verified. The optional test script remains available for an unrestricted runner.
- Remote CI results belong to the PR checks, not this local evidence record.
- No production or preview deployment performed. No research-platform build was attempted: all changes are additive inside apps/explore and the scoped workflow.

The tests establish only the covered behavior. They do not establish complete scientific accuracy, accessibility compliance, cross-browser compatibility, privacy compliance or production readiness. See FOUNDATION.md and issue #9.
