# ORBIT 2.0 — Intelligent Learning, Community and Personal Knowledge

Status: **foundation branch; not production-ready or deployed**.
Application: `mauryavimlesh/orbit` (React/Vite + Express + legacy local SQLite).
Target: production-ready, authenticated multi-user learning platform.

## Product principle
ORBIT is not another endless feed. Its core loop is **Discover → Understand → Save → Practice → Share → Revisit**. Every recommendation should connect to evidence and help the person take the next useful action.

## 1. Intelligent learning assistant

### Entry points
- Global "Ask ORBIT" button and context actions on every research paper, code repository, collection and learning record.
- Initial choices: **Explain simply**, **Go deeper**, **Find prerequisites**, **Quiz me**, **Compare sources**, **What should I learn next?**.
- Context chip showing the exact paper, section, selected passage or collection currently used.
- Difficulty and language controls, including Hinglish, stored in the user's preferences.
- Assistant explains its basis, links to primary source passages, distinguishes facts from synthesis and admits uncertainty.
- Every assistant response can be saved to a private note or converted to a flashcard with explicit approval.

### Safe server workflow
1. Authenticate using a bearer access token; verify it server-side.
2. Authorize the requested thread, collection, note and selected source by the authenticated user ID.
3. Rate-limit per account and IP; bound total tokens, messages, sources, tool calls and response duration.
4. Retrieve only public documents or explicitly authorized user-owned sources; never blindly trust content embedded in retrieved papers.
5. Generate with citations (source IDs, URLs and available quoted passages); show "unverified" for unsupported claims.
6. Persist user input and assistant output through trusted server methods, tied to the same thread owner. Stream responses with cancellation and retries.
7. Return structured error states (quota, timeout, provider unavailable, context missing). Do not fake success or quietly substitute fabricated research.
8. Instrument latency, quality feedback, citation coverage, token cost and safety signals, without logging private note bodies.

### Learning-next recommendation
Inputs: followed interests, mastered concepts, learning goals, saved sources, recent engagement and feedback. Rank suggestions by prerequisite fit, user goal relevance, evidence quality, topic diversity and freshness. Provide **Why this next?** with a one-sentence explanation. Start deterministic and interpretable; consider ML ranking only after usage data exists. Never treat time spent or endless scrolling as the main learning objective.

### Assistant acceptance tests
- A user cannot retrieve or update someone else's thread through any request path.
- Invalid citations do not render as verified.
- One blocked/failed provider yields a truthful error, not a hallucinated answer.
- Users can delete their entire conversation and export it.
- Prompt injection inside a paper cannot authorize account writes or tool calls.
- AI request cost caps work even if local server state resets.

## 2. Community

### User journeys
- Discover an interesting paper → open "Discuss" → cite a source → ask a specific question.
- Post a discovery or a question; filter by research field, relevance, newest, unanswered and followed topics.
- Threaded comments, replies, reactions, report, block/mute, and meaningful moderation status.
- Share a **public** or **unlisted** collection, with an explicit confirmation showing what will become visible.
- Join a time-bounded learning challenge, track completion, and celebrate useful learning outcomes.
- Collaborative collections (phase 2): invitations, roles (owner/editor/viewer), audit trail, revocable access and conflict handling.
- Notifications for direct replies, accepted contributions and opted-in topic activity; no unsolicited spam.

### Trust and safety must-haves
- Human-readable community guidelines, report controls and moderator queue.
- Spam controls and post/reply cooldowns; reject repeated identical content.
- Basic markdown sanitization and safe link rendering (no arbitrary HTML or scripts).
- Moderators—not ordinary users—can hide, lock, restore and escalate posts. Keep audit records.
- No public exposure of personal assistant history, study progress or private notes.
- Challenge progress must be owned by the participant and protected against abuse; do not build monetary rewards until fraud prevention exists.
- Public profiles have display names and handles only, never raw auth data or email.

### Community acceptance tests
- Signed-out users cannot create posts.
- Author A cannot edit or delete Author B's post or comment.
- Users cannot forge a moderator action or unhide moderated content.
- A public collection shares only curated source references; the owner's annotations remain private.
- A reported abusive post can be hidden and reviewed without revealing reporter identity publicly.

## 3. Personal knowledge library

### Experiences
- One-tap Save from Discover, Research Reader, GitHub Explorer and AI Professor.
- Private default; tag, search, sort, filter and add a personal note.
- User-created collections with drag/reorder and purposeful descriptions.
- Continue Learning: current paper position, last session, unfinished notes and next review.
- Mastery by concept: **New → Familiar → Understanding → Applied → Confident**. Each change requires an activity or explicit user self-assessment; never claim mastery from scrolling.
- Active recall: flashcards and short concept checks. Due dates use a documented spaced-repetition algorithm, not artificial streak pressure.
- Import/export own records; delete account and derived personal data.
- Offline-safe temporary browser state may queue changes, but authenticated server state is the canonical source of truth; conflicts are surfaced.

### Library acceptance tests
- User A never receives User B's items, collections, annotations, mastery or chat history.
- Cross-device sign-in restores the same items.
- Public collection entries are safe copies of references, not private library records.
- Deleting a saved item does not delete the source from other users' libraries.
- Save requests are idempotent via (owner, source_type, source_id).

## Recommended architecture

Current repository: React 19 / Vite frontend, Express server, Node SQLite; user ownership is not currently enforced for persisted notes and bookmarks. The migration in `supabase/migrations/20261112_learning_community_library.sql` introduces separate Postgres tables and RLS policies for new data.

**Proposed production topology:**
- Supabase Auth (email or social sign-in), Postgres with row-level security, managed backups.
- Browser uses public Supabase URL + anon key for permitted account data. Never ship the service-role key to the browser.
- Express/Node (or deployed functions) verifies access tokens before AI, moderation, recommendation and privileged operations.
- Separate services: `auth`, `assistant`, `community`, `library`, `recommendations`, `moderation`, `notifications`.
- Persist quotas/rate limits centrally (Postgres/Redis); provider API tokens server-only.
- Background worker for email/push, indexing, recommendation refresh, moderation tasks and scheduled reviews.
- Privacy-safe telemetry with request IDs and structured errors.
- Automated schema migration pipeline, rollback procedure, staging and backups.

### Important deployment block
The current `server.ts` uses `app.listen`, local SQLite and a hard-coded port. A static Vercel frontend alone does not make these API routes available. Confirm how `https://orbitaix.vercel.app/` is actually deployed before replacing storage or wiring new endpoints.

## API contracts (planned, NOT implemented)
All private routes require an authenticated session. The server derives user identity from the verified token, not a request body.

| Method | Route | Purpose |
|---|---|---|
| POST | /api/v2/assistant/threads | Create owned conversation |
| POST | /api/v2/assistant/threads/:id/messages | Stream an answer with citations |
| GET | /api/v2/assistant/next | Ranked learning suggestions + reasons |
| GET/POST | /api/v2/library/items | List/save personal items |
| PATCH/DELETE | /api/v2/library/items/:id | Edit/remove owned item |
| GET/POST | /api/v2/collections | List/create collections |
| POST | /api/v2/collections/:id/entries | Add an entry |
| GET/POST | /api/v2/community/discussions | Browse/create discussions |
| GET/POST | /api/v2/community/discussions/:id/comments | View/post comments |
| POST | /api/v2/community/reports | Submit moderation report |
| GET/POST | /api/v2/challenges | Browse/create challenges |
| POST | /api/v2/challenges/:id/join | Join a challenge |

Use cursor pagination; deterministic ordering; validation schemas; request size limits; consistent JSON error envelopes.

## Delivery gates

### Gate 0 — Security and deploy verification (blocking)
- Confirm deployed repository, routing and API hosting.
- Verify secrets have never been committed and are server-side.
- Move away from shared SQLite for user-owned information; introduce auth and per-user ownership.
- Migrate legacy notes only with an explicit ownership strategy. Do **not** silently make global records private to an arbitrary user.

### Gate 1 — Library (first usable release)
- Sign-up, login, password recovery, logout, delete and export.
- Private Save, collections, annotations, mastery, sync across devices.
- RLS + API integration + E2E multi-user isolation tests.

### Gate 2 — Assistant
- Contextual conversations, evidence-grounded answers, saved threads, next-learning suggestions.
- Cost caps, trust boundaries, fallback states, safety instrumentation.

### Gate 3 — Community
- Profiles, discussion posts, threaded replies, reactions, reports, moderation queue.
- Public collections, privacy previews, anti-spam controls.
- Challenges and accessible mobile interaction.

### Gate 4 — Collaboration and scale
- Shared collection permissions, role/invite management, change history.
- Notifications, full-text search, observability, load tests, accessible QA and staged rollout.

## Launch criteria
No public launch until:
1. Cross-user isolation and RLS integration tests pass.
2. Authentication/session renewal and account deletion work.
3. Moderation and abuse controls are operational.
4. AI cost/rate protection is verified under concurrent traffic.
5. Storage backups/restore and migrations are tested.
6. Critical flows pass responsive, accessibility and end-to-end checks.
7. Real deployment URLs and API health checks are verified.

This document and SQL migration are a foundation only. The routes and user interfaces above require implementation, testing, provisioning and deployment.
