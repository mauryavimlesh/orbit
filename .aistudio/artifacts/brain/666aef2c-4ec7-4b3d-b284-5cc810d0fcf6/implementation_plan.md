# ORBIT — Global Discovery-to-Mastery Learning & Research System

ORBIT is a free-first, provenance-grounded discovery and learning workspace that transforms live academic preprints, peer-reviewed literature, open-source repositories, and global emerging developments into layered interactive lessons, empirical visual simulations, approval-gated structured notes, and longitudinal topic watches.

---

## User Review & Critical Decisions (Revised & Verified)

> [!IMPORTANT]
> This revised plan incorporates all six of your final verification requirements so there are no false claims of cloud sync, unverified APIs, or paid model fallbacks. Click **Proceed** in the plan approval curtain to begin full implementation.

- **1. Uploaded UI Reference as Primary Visual Target**: The interface strictly reproduces the uploaded reference's spatial composition and warm glassmorphic atmosphere:
  - **Top Horizontal Bar**: Prominent left search input (`Search research, repos, topics...`), centered glass pill navigation tabs (`Discover`, `Research`, `Tech & Projects`, `Trends`, `My Learning`, `Watchtower`), and compact right notification bell + profile/settings pill.
  - **Compact Left Sidebar**: Two stacked glassmorphic containers—**New Discoveries** (with `Sort by Today` toggle and compact image-led cards with circular action buttons) on top, and **Continue Progress** (thumbnail, title, `In Progress X%`, and circular resume button) below.
  - **Cinematic Featured Hero Panel**: Wide rounded-3xl image-led feature card on the right with top status badge (`Trending Research` / `Peer-Reviewed`), category tags, large editorial headline, concise 2-line explanation, bottom-left pill CTAs (`▶ Start Learning`, `Guidebook / Reader`, `Bookmark` icon button), and bottom-right circular `<` `>` carousel controls.
  - **Horizontal Discovery Row (`You might like`)**: 4-column row of vertical image-led cards below the hero with top-left source icon, top-right `•••` menu button, category kicker, title, 2-line description, and bottom-right circular white play/open action button.
- **2. All 6 Major Sections Connected as Real Experiences**: `Discover`, `Science & Research`, `Tech & Projects`, `World Trends`, `My Learning`, and `Research Watchtower` are all wired to live backend routes (`/api/*`), real state transitions, and persistent storage—zero static mockups or dead buttons.
- **3. Honest Persistence Architecture (Node `node:sqlite` + Browser Hydration + JSON Export/Import)**:
  - **How It Works**: Uses Node.js 22 native `node:sqlite` (`DatabaseSync`) on the server paired with automatic client-side `localStorage` mirroring and bidirectional hydration on startup.
  - **Honest Boundary**: Because Cloud Run / container filesystems can reset when a container scales to zero or restarts, the client automatically re-hydrates the server SQLite database from browser storage on connection, and provides one-click **Export Library (.json / .md)** and **Import Library (.json)** controls. **We do not claim automatic cloud multi-device sync**; moving data across devices uses the explicit JSON export/import workflow.
- **4. Verified Runtime Gemini Model & Zero Paid Fallbacks**:
  - **Runtime Model**: Uses `@google/genai` on `server.ts` with `process.env.GEMINI_RUNTIME_MODEL || "gemini-3.8-flash"` (the verified free-tier-eligible default model in the AI Studio environment) and includes a `/api/ai/status` health and quota inspection endpoint.
  - **Strict No-Billing Safeguard**: Paid models (`gemini-4-argon`, paid image/video models) are **never** called at runtime or used as fallbacks. If the free quota or rate limit is reached, the server returns a structured `QUOTA_EXHAUSTED` status and falls back to deterministic source metadata extraction without ever billing or failing silently.
- **5. Verified Public Source Endpoints, Timestamps & Coverage Limits**:
  - Every card and reader view displays both `publishedAt` (source publication date) and `retrievedAt` (exact UTC timestamp when ORBIT fetched the record), plus an explicit **Source Coverage & Blind Spots** disclosure banner explaining which public APIs were queried and which platforms (such as X, Instagram, or YouTube full firehoses) are excluded due to paid/restricted API walls.
- **6. Code Preservation & End-to-End Verification**:
  - Preserves existing project configuration and verifies compilation (`compile_applet`), TypeScript checking (`npm run lint`), and end-to-end API/UI flows before completion.

---

## 1. Overview & Core Concept

- **What It Does**: ORBIT unifies global discovery, primary-source verification, adaptive learning, interactive visual experimentation, professional note-taking, spaced-repetition mastery, and automated change monitoring into one cohesive application.
- **Target Audience / Persona**: Curious learners, students, engineers, and interdisciplinary researchers who want deep conceptual and exam-ready mastery across science, technology, open-source software, startups, and public-service innovations without manually checking dozens of websites.
- **Key Value & Differentiation**:
  1. **Discovery Without Hype**: Separates *Freshness*, *Evidence Quality*, *Momentum*, *Novelty*, and *Learning Value* as distinct explainable signals.
  2. **14-Point Layered Research Reader & Adaptive Professor**: Moves seamlessly from plain-language orientation and prerequisites to core mechanisms, empirical methods, limitations, falsifiability criteria, and bilingual (`English` / `Hinglish`) guided lessons.
  3. **Contextual Visual Laboratory**: Renders interactive parameter-driven simulations and empirical charts with explicit `[Empirical Source Data]` vs. `[Illustrative Simulation]` labels.
  4. **Approval-Gated Professional Notes**: Generates structured study and exam-revision notes (with variable-defined equations, flashcards, and citations) as editable drafts that are saved to the permanent library **only after explicit user review and approval**.
  5. **Research Watchtower**: Monitors followed topics, papers, and GitHub repositories, computing structured state diffs (*What changed*, *Why it matters*, *Does it strengthen or weaken prior understanding?*) upon manual or scheduled checks.

### Requirements Matrix

| Requirement Module | Priority | User Value | Implementation Approach | Verified External Dependency | Cost / Risk & Mitigation | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Warm Glassmorphic UI (Reference Match)** | P0 | Cinematic, calm discovery layout matching uploaded image | Desktop 2-column split (Left rail: *New Discoveries* & *Continue Progress*; Right stage: *Featured Hero Carousel* & *You Might Like* 4-card row) + responsive mobile layout | Local high-res generated assets + live API hydration | Zero cost; CSS `backdrop-filter` with solid fallback for low-spec devices | Matches uploaded visual reference hierarchy; all carousel, sidebar, and card buttons work |
| **2. Multi-Source Live Discovery Feed** | P0 | Real-time access to papers, repos, and tech momentum | Express `/api/discover` proxy querying arXiv, OpenAlex, PubMed, Crossref, GitHub, Hacker News, and Reddit with DOI/ID deduplication | 7 verified public APIs (no paid keys required) | Free public rate limits; handled via `fetchWithRetry` + SQLite TTL cache | Filters by domain, source type, evidence status, and difficulty return real items with timestamps |
| **3. 14-Layer Research Reader** | P0 | Deep comprehension with strict epistemic provenance | Structured 14-section reader view separating source metadata/abstracts from AI synthesis and claim-adjacent citations | Server-side `gemini-3.8-flash` + source metadata fallback | Free-tier quota; cached in SQLite by `(discoveryId, difficulty, language)` | Renders all 14 sections, source status badges, conflict disclosures, and working outbound links |
| **4. Adaptive Professor & Bilingual Mode** | P0 | Explanations tailored to user level and language | Interactive layer switcher (*Overview*, *Beginner*, *Prerequisites*, *Guided Lesson*, *Technical*, *Critique*, *Quiz*) with `English` / `Hinglish` toggle | `@google/genai` structured JSON schema | Server-side quota ledger prevents runaway requests | Switching difficulty or `English`/`Hinglish` updates explanations while keeping citations intact |
| **5. Contextual Visual Laboratory** | P0 | Interactive simulations instead of static text walls | 4 interactive scientific/technical sandboxes with parameter sliders, real-time equations, and `[Illustrative Simulation]` vs `[Empirical Data]` labels | HTML5 Canvas & SVG interactive math models | 100% client-side 60fps math; zero heavy WebGL bloat on initial load | Dragging parameter sliders updates curves/diagrams immediately with units and assumptions shown |
| **6. Approval-Gated Notes & Revision** | P0 | Exam-ready notes saved only with explicit approval | Draft generator $\to$ editable preview modal/panel $\to$ explicit **Approve & Save to Library** button; includes flashcards & MD/JSON export | Native `node:sqlite` + `localStorage` sync | Zero cost; prevents unapproved AI content from polluting library | Drafts are clearly marked temporary until approved; saved notes support edit, tag, search, export, delete |
| **7. GitHub & Tech Project Explorer** | P0 | Understand repo architecture, safe setup, and similar work | Live GitHub REST inspector (README, releases, license, activity) + safety sandbox guide + "Has Someone Built This?" comparator | GitHub REST API (`/repos`, `/search/repositories`) | Unauthenticated 60 req/hr (cached in SQLite for 30 mins) | Inspects any `owner/repo` (including `bilawalsidhu/gods-eye-view` & `morluto/rea`) + compares user ideas |
| **8. My Learning, Mastery & Graph** | P1 | Long-term retention and concept connections | Evidence-based mastery tracker (quiz performance + time decay), spaced-repetition queue, and interactive citation-linked Knowledge Graph | Native `node:sqlite` + browser sync | Zero cost | Quiz submission explains wrong answers, updates mastery %, and adds nodes to Knowledge Graph |
| **9. Research Watchtower & Alerts** | P1 | Track meaningful updates without manual checking | Watchlist engine storing baseline snapshots and computing structured diffs on refresh; optional server-side Telegram Bot dispatch | Public APIs + optional `TELEGRAM_BOT_TOKEN` | Honest manual/on-demand check disclosure; rate-limited | Clicking "Check for Updates" compares live upstream data against stored baseline snapshot |

---

## 2. User Experience & Visual Design

### Visual Identity & Reference Adaptation
- **Aesthetic Direction**: **Warm Editorial Glassmorphism (Strict Reference Adaptation)**. Preserves the uploaded screenshot's atmospheric warmth, rounded translucent glass containers, compact left rail, wide rounded hero card with warm sunset/editorial backdrop and dark readability scrim, pill-shaped primary white CTA button (`▶ Start`), outlined secondary pill button (`Guidebook`), and 4-column vertical card row below with circular white action buttons.
- **Color Palette & Atmospheric Tokens**:
  - **60% Dominant Canvas**: Deep warm charcoal-obsidian (`#0B0A0E`) layered over a soft, diffused warm ambient canvas (subtle radial washes of muted terracotta-rose `#3A2225`, warm dusk plum `#231E2E`, and deep slate `#14161F` blurred behind the translucent containers).
  - **30% Translucent Glass Surfaces**: Frosted charcoal glass panels (`rgba(32, 30, 38, 0.62)` with `backdrop-filter: blur(28px)`) framed by subtle specular hairline borders (`1px solid rgba(255, 255, 255, 0.10)`), outer container radius `28px` (`rounded-[28px]`), and inner card radius `20px` (`rounded-[20px]`).
  - **10% High-Contrast & Semantic Accents**:
    - **Primary Action Button**: Pure Warm White (`#FFFFFF`) background with deep charcoal text (`#0B0A0E`) for primary actions (`▶ Start`, `Approve & Save`, circular card play/open buttons), directly matching the reference screenshot.
    - **Epistemic Provenance Accents**: Restrained Emerald (`#10B981`) for `● Peer-Reviewed` / verified empirical data; Warm Amber (`#F59E0B`) for `▲ Preprint / Emerging`; Sky Blue (`#38BDF8`) for `◆ Open-Source Repo`.
- **Typography & Hierarchy (2+1 Font Rule)**:
  - **Display / Headlines**: `Plus Jakarta Sans` (SemiBold 600 / Bold 700, `clamp(1.75rem, 2.8vw, 2.5rem)`, `text-wrap: balance`) for hero titles and section headers.
  - **Body Prose & Lessons**: `DM Sans` (Regular 400 / Medium 500, `15px–16px`, line-height `1.65`) for clear long-form explanations in English and Hinglish.
  - **Citations, DOIs, Metrics & Formulas**: `JetBrains Mono` (`tabular-nums`) for source timestamps, arXiv/DOI identifiers, parameter readouts, and quota counters.

### Screen Map & Key User Flows

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ [ 🔍 Search research, repos, topics... ]  (Discover)  Research  Tech  Trends  Learning  🔔 │
├───────────────────────────┬────────────────────────────────────────────────────────────────┤
│ LEFT SIDEBAR (310px)      │ RIGHT MAIN STAGE (Flex-1)                                      │
│                           │                                                                │
│ ┌───────────────────────┐ │ ┌────────────────────────────────────────────────────────────┐ │
│ │ New Discoveries Today │ │ │ [🔥 Featured Discovery]                                    │ │
│ │ ┌───────────────────┐ │ │ │                                                            │ │
│ │ │ Image Card 01     │ │ │ │ Physics & Quantum  ·  Peer-Reviewed                        │ │
│ │ │ Title & Source  ▶ │ │ │ │ Fault-Tolerant Quantum Error Suppression                   │ │
│ │ └───────────────────┘ │ │ │ Concise 2-line explanation of why this breakthrough        │ │
│ │ ┌───────────────────┐ │ │ │ changes hardware scaling and what evidence supports it.    │ │
│ │ │ Image Card 02     │ │ │ │                                                            │ │
│ │ │ Title & Source  ▶ │ │ │ │ [ ▶ Start ]   [ 📖 Guidebook ]   ( 🔖 )          ( < ) ( > )│ │
│ │ └───────────────────┘ │ │ └────────────────────────────────────────────────────────────┘ │
│ └───────────────────────┘ │                                                                │
│                           │ You might like                                        [See all]│
│ ┌───────────────────────┐ │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────┐ │
│ │ Continue Progress     │ │ │ [Icon]  (•••)│ │ [Icon]  (•••)│ │ [Icon]  (•••)│ │ [Icon]  │ │
│ │ • Quantum Error (68%) │ │ │              │ │              │ │              │ │         │ │
│ │ • God's Eye View (45%)│ │ │ Category     │ │ Category     │ │ Category     │ │ Category│ │
│ │ • Bohr Affinity (82%) │ │ │ Card Title   │ │ Card Title   │ │ Card Title   │ │ Title   │ │
│ │ • CRISPR Prime (30%)  │ │ │ Summary   (▶)│ │ Summary   (▶)│ │ Summary   (▶)│ │ Sum  (▶)│ │
│ └───────────────────────┘ │ └──────────────┘ └──────────────┘ └──────────────┘ └─────────┘ │
└───────────────────────────┴────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Native Node `node:sqlite` + Client `localStorage` Hydration + JSON Export/Import**
  - *Chosen Approach*: Store all notes, watchlists, mastery records, and API caches in a local SQLite database (`orbit_data.sqlite` via Node's built-in `node:sqlite`) AND mirror user library state in browser `localStorage`. On page load, if the server container was freshly spun up, the client syncs its local state back to the server automatically. Users can export/import their entire library as `.json` or `.md` at any time.
  - *Why*: Works out-of-the-box with zero cloud billing risk, survives browser refreshes and server restarts, and avoids making false claims about cross-device cloud synchronization.
- **Decision 2: Verified Multi-Source Public APIs with Honest Coverage Labels**
  - *Chosen Approach*: Connect directly to 7 verified open APIs (arXiv, OpenAlex, PubMed, Crossref, GitHub REST, Hacker News Firebase API, and Reddit public JSON) through `server.ts`. Explicitly label coverage boundaries (e.g., stating that X/Twitter, Instagram, and YouTube global trend APIs require paid/restricted commercial tiers and are not scraped).
  - *Why*: Respects platform terms of service, eliminates API billing risk, and upholds epistemic honesty.
- **Decision 3: Multi-Signal Explainable Vector Instead of Single Ranking Score**
  - *Chosen Approach*: Display separate transparent indicators for *Freshness*, *Evidence Status* (`Peer-Reviewed`, `Preprint`, `Official Repo`, `Community Momentum`), *Momentum*, and *Learning Value*.
  - *Why*: Ensures viral social posts are never presented as equivalent to peer-reviewed scientific evidence.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER (React 19 + TS)                             │
│                                                                                         │
│  ┌──────────────────────┐  ┌──────────────────────────┐  ┌───────────────────────────┐  │
│  │ Warm Glass Home &    │  │ 14-Layer Reader &        │  │ Visual Lab, Notes &       │  │
│  │ Section Views        │  │ Adaptive Professor       │  │ Watchtower Views          │  │
│  │ • Top Bar & Search   │  │ • 14 Evidence Sections   │  │ • 4 Interactive Sandboxes │  │
│  │ • Left Rail Progress │  │ • EN / Hinglish Toggle   │  │ • Preview -> Approve Note │  │
│  │ • Hero & Card Row    │  │ • Misconception Quiz     │  │ • Repo & Idea Comparator  │  │
│  └──────────┬───────────┘  └────────────┬─────────────┘  └─────────────┬─────────────┘  │
│             │                           │                              │                │
│             └───────────────────────────┼──────────────────────────────┘                │
│                                         ▼                                               │
│                    ┌─────────────────────────────────────────┐                          │
│                    │ LocalStorage Mirror & Hydration Client  │                          │
│                    │ • Auto-hydrates server on boot          │                          │
│                    │ • One-click JSON / Markdown Export      │                          │
│                    └────────────────────┬────────────────────┘                          │
└─────────────────────────────────────────┼───────────────────────────────────────────────┘
                                          │ HTTP / JSON (/api/*)
┌─────────────────────────────────────────▼───────────────────────────────────────────────┐
│                         EXPRESS SERVER RUNTIME (server.ts : 3000)                       │
│                                                                                         │
│  ┌───────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐  │
│  │ Verified API Connectors   │  │ Gemini Runtime Engine  │  │ SQLite Persistence     │  │
│  │ • /api/discover/live      │  │ • /api/ai/professor    │  │ (node:sqlite)          │  │
│  │ • /api/github/inspect     │  │ • /api/ai/note-draft   │  │ • /api/library/sync    │  │
│  │ • /api/github/compare-idea│  │ • /api/ai/quiz         │  │ • /api/notes/approve   │  │
│  │ • /api/trends/pulse       │  │ • /api/ai/watch-diff   │  │ • /api/watchtower/*    │  │
│  │ • fetchWithRetry + Cache  │  │ • Hard Quota Ledger    │  │ • /api/quota/status    │  │
│  └─────────────┬─────────────┘  └───────────┬────────────┘  └───────────┬────────────┘  │
└────────────────┼────────────────────────────┼───────────────────────────┼───────────────┘
                 │                            │                           │
                 ▼                            ▼                           ▼
   ┌───────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
   │ arXiv, OpenAlex, PubMed,  │  │ @google/genai SDK      │  │ orbit.sqlite Database  │
   │ Crossref, GitHub REST,    │  │ • gemini-3.8-flash     │  │ & Optional Telegram    │
   │ Hacker News, Reddit JSON  │  │ • Zero Paid Fallback   │  │ Bot Alert Dispatcher   │
   └───────────────────────────┘  └────────────────────────┘  └────────────────────────┘
```

### Verified Source & API Research Table

| Source | Data Retrieved | Verified Official Endpoint | Auth & Rate Limit Rules | Freshness & Cost | Fallback & Coverage Disclosure |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **arXiv Atom API** | Preprints in CS, AI, Physics, Math, q-Bio (title, authors, abstract, published/updated dates, categories, PDF link) | `GET https://export.arxiv.org/api/query?search_query=...` (proxied via `server.ts` to bypass browser CORS) | Public, no key; polite limit $\le 1$ req / 3s | Free; live daily submissions | Cached in SQLite (`api_cache`); labelled `▲ Preprint — Not Yet Peer-Reviewed` |
| **OpenAlex REST** | 250M+ scholarly works, citation counts, open-access URLs, institutions, concepts | `GET https://api.openalex.org/works?search=...&mailto=vimlesx4@gmail.com` | Polite pool via `mailto` query param; 10 req/s | Free; continuous indexing | Reconstructs `abstract_inverted_index`; shows exact citation counts & OA status |
| **PubMed (NCBI Entrez)** | Biomedical peer-reviewed citations, abstracts, journal metadata, PMIDs/DOIs | `esearch.fcgi` + `esummary.fcgi` + `efetch.fcgi` (`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/`) | Public $\le 3$ req/s without key ($\le 10$ req/s if `NCBI_API_KEY` set) | Free; daily MEDLINE updates | Uses `fetchWithRetry` backoff; includes biomedical educational disclaimer |
| **Crossref REST** | Authoritative journal DOIs, publisher metadata, publication dates, reference counts | `GET https://api.crossref.org/works?query=...&mailto=vimlesx4@gmail.com` | Public polite pool; 50 req/s | Free; live DOI registry | Deduplicates against OpenAlex by normalized DOI |
| **GitHub REST API** | Repository metadata, license, release tags/changelogs, issues count, language, README | `GET https://api.github.com/repos/{owner}/{repo}` & `/search/repositories` | Public 60 req/hr unauthenticated (5,000 req/hr if `GITHUB_TOKEN` provided) | Free; live repository state | 30-min SQLite cache + pre-cached snapshots for `bilawalsidhu/gods-eye-view` and `morluto/rea` |
| **Hacker News & Reddit Public JSON** | Fast-rising technical discussions, launch threads, developer velocity | `https://hacker-news.firebaseio.com/v0/topstories.json` & `https://www.reddit.com/r/machinelearning/hot.json` | Public read access with descriptive `User-Agent` | Free; near real-time | Explicitly labelled `Community Discussion Signal — Verify Against Primary Sources` |
| **X / Instagram / YouTube** | Closed/Paid Platform Notice | Not queried without paid enterprise keys | Paid/Restricted API walls | N/A | Transparently listed under **Coverage Boundaries** so users know why they are excluded |

### Database Schema (`node:sqlite` + Client Sync)

- **`discoveries`**: `id` (TEXT PK), `canonical_id` (TEXT UNIQUE), `title`, `domain`, `source_type`, `evidence_status`, `published_at`, `retrieved_at`, `authors_json`, `summary`, `signals_json`, `source_url`, `deep_data_json` (stores all 14 reader layers, prerequisites, equations, and visual lab preset ID).
- **`notes`**: `id` (TEXT PK), `discovery_id`, `title`, `status` (`'draft_preview'` | `'approved_saved'`), `sections_json`, `user_annotations`, `tags_json`, `flashcards_json`, `citations_json`, `approved_at`, `updated_at`.
- **`mastery_records`**: `id` (TEXT PK), `discovery_id`, `topic_name`, `mastery_score` (INTEGER 0–100), `quiz_attempts_count`, `last_quiz_score`, `last_reviewed_at`, `next_review_due_at`, `weak_areas_json`.
- **`watchlists`**: `id` (TEXT PK), `target_type` (`'topic'` | `'paper'` | `'repo'` | `'author'`), `target_query`, `display_title`, `threshold`, `cadence`, `last_checked_at`, `baseline_snapshot_json`, `updates_json`, `active` (INTEGER).
- **`quota_ledger`**: `date_key` (TEXT PK), `ai_requests_count` (INTEGER), `daily_limit` (INTEGER DEFAULT 60), `last_model_used` (TEXT), `last_error` (TEXT).
- **`api_cache`**: `cache_key` (TEXT PK), `response_json` (TEXT), `fetched_at` (TEXT), `expires_at` (INTEGER).

### Interactive Component & Flow Verification Plan

1. **Home View (Reference Layout)**:
   - Top bar search queries `/api/discover/search` across live sources and filters cards in real time.
   - Left sidebar displays **New Discoveries** (with `Today` / `High Evidence` sort toggle) and **Continue Progress** (reflecting real reading/quiz progress percentages from SQLite/localStorage).
   - Featured Hero Carousel switches between flagship discoveries with `<` `>` controls, `▶ Start` (opens Adaptive Professor & Visual Lab), `Guidebook` (opens 14-Layer Research Reader), and `Bookmark` toggle.
   - `You might like` horizontal row cards open the respective research paper, invention, or GitHub repository.
2. **Research Reader & Adaptive Professor (14 Layers + Bilingual)**:
   - Displays all 14 analytical layers (*Quick Orientation*, *Source & Status*, *Beginner Explanation*, *Prerequisites*, *Historical Foundations*, *Core Mechanism*, *Methods & Evidence*, *Findings*, *Limitations & Uncertainty*, *Applications*, *Critical Analysis & Falsifiability*, *Related Work*, *What to Watch Next*, *References*).
   - Includes live **Difficulty Switcher** (`Beginner`, `Mixed`, `Advanced`), **Language Switcher** (`English`, `Hinglish / Roman Hindi`), and **Ask Professor / Generate Fresh Layer** via `/api/ai/professor` (using `gemini-3.8-flash` with quota guard).
3. **Visual Laboratory (4 Interactive Sandboxes)**:
   - *Sandbox 1*: **Quantum Error Correction Threshold Simulator** (adjust physical gate error rate $p$, code distance $d$, and rounds to observe logical error suppression $P_L \propto (p/p_{\text{th}})^{(d+1)/2}$).
   - *Sandbox 2*: **Hemoglobin Bohr Effect & Oxygen Dissociation Simulator** (adjust blood $\text{pH}$, $P_{\text{CO}_2}$, and temperature to inspect live sigmoidal Hill curve shift and $P_{50}$ affinity).
   - *Sandbox 3*: **Sparse & Flash Attention Compute Scaling Lab** (adjust context length $N$, window size $W$, and KV-cache quantization to compare $O(N^2)$ vs block-sparse memory & FLOPs).
   - *Sandbox 4*: **Geospatial 3D Reconstruction & Repo Pipeline Inspector** (interactive pipeline node graph for `bilawalsidhu/gods-eye-view` and `morluto/rea` showing sensor ingestion, Gaussian splatting / reverse-engineering stages, and sandbox boundaries).
4. **Professional Notes (Draft Preview $\to$ Edit $\to$ Approve & Save)**:
   - Generates structured note drafts with Executive Summary, Prerequisites, Core Mechanism, Variable-Defined Equations, Limitations, Exam Revision Sheet, and Interactive Flashcards.
   - Enforces an explicit **Draft Preview Banner**: notes can be edited inline and are only persisted as `'approved_saved'` when the user clicks **Approve & Save to Library**.
5. **GitHub Explorer & "Has Someone Built This?" Comparator**:
   - Fetches live GitHub repository details (`/api/github/inspect?repo=owner/name`) + compares any user-described project idea against live GitHub repos and OpenAlex/arXiv literature (`/api/github/compare-idea`).
6. **Research Watchtower**:
   - Tracks followed topics, papers, and repositories; clicking **Check for Updates Now** queries live upstream APIs, computes a structured diff against the stored baseline snapshot, and supports optional server-side Telegram Bot alerts.
