# ORBIT Explore — Foundation increment

Imported from the existing MVP without replacing the ORBIT research platform. See [engineering record](docs/FOUNDATION.md), [contracts](docs/contracts.md), and [changelog](CHANGELOG.md).

```sh
npm ci --offline --ignore-scripts
npm run check
```

Build output is `dist/`; CI is scoped to this app. Browser and accessibility release gates remain open.

A runnable browser-based educational orbital mechanics experience. No paid API, database, account, tracking, or npm install is required to use the site.

## Features
- Deterministic Newtonian two-body relative-motion simulation with velocity Verlet integration (AU and years).
- Real interactive speed and gravity controls; orbital presets; time scrubbing; zoom levels and selection.
- English/Hindi switch; beginner/standard/advanced explanations; voice narration if browser voices exist.
- Browser-rendered Canvas with reduced graphics mode; a keyboard-operated control panel and visual information.
- Scene-aware *rule-based* Q&A (not a generative AI service); local mastery check saved in localStorage.
- Sources and limitations visible to learners. No third-party analytics or outbound API calls.

## Run locally

From this folder run:

```bash
python3 -m http.server 4173
```

Open http://localhost:4173/ in a browser. Browser ES modules require HTTP; directly opening `index.html` from disk may not work.

For scientific regression tests (Node.js 22+):

```bash
npm test
```

No packages need downloading to run the local app or tests.

## Free static deployment

Run `npm run check`, then upload the generated `dist` directory contents to a static hosting service (for example Cloudflare Pages Direct Upload). Deploy the *folder contents*, including `src/`. Build command: `npm run build`. Free limits and provider terms apply. Do **not** assume any provider's free tier permits unlimited for-profit scaling.

## Scope and honesty

This is an implemented demonstration vertical slice, **not** a production-certified full educational platform and **not** the entire 12-feature roadmap. It has no logged-in accounts, server AI model, classroom features, embedded SDK, scientific content approval, automated cross-browser accessibility testing or hardened operations.

The drawn 2D orbital view is a single renderer in standard and low-graphics quality modes, not a production-grade 3D engine. Zoom is three discrete levels. X-Ray is not applicable to this first orbital scene. Narration uses the operating system/browser speech engine and may not have a Hindi voice. Hindi is partial (core learning text, not every static UI label). Time Machine is timeline replay only; the system does not reconstruct arbitrary external history. The AI-like tutor is deterministic, no hallucinations from a generative model but limited coverage.

Physics assumptions: point masses, Newtonian gravity, relative two-body motion, normalized gravitational parameter mu=4*pi*pi AU^3/year^2. Collision boundary illustrative. Solver trajectories can leave the viewport or terminate at a specified boundary; those endpoints are not numerical proof of a collision with a real star. Source links are references, not independent peer review.

## Next production gates

1. Schema-driven modular content and 3D layer engine.
2. Full WCAG accessibility review; keyboard-operable scene object list and nonvisual data table.
3. Full i18n (static labels and authored lesson reviews).
4. Trusted backend tutor with scene snapshot validation, citations, privacy, safeguards and rate controls.
5. User accounts and consent-aware learning records; institutional privacy review.
6. Cross-browser performance, security and learning effectiveness evaluation.
7. Reproducible build/dependency pinning and deployment quality gates.

## License

Prototype code released for the user to adapt in their ORBIT project. Educational source materials linked externally have their own licenses.
