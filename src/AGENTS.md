# AGENTS.md — Liber 333 Digital Grimoire

## Project overview
A live digital oracle for Aleister Crowley's Liber 333 (The Book of Lies). Live at liber-333.vercel.app. Vite + React 18 + Tailwind CSS, deployed on Vercel. Zero runtime UI dependencies beyond React, framer-motion, and lucide-react.

## Architecture
- The React app lives in `src/liber333.jsx` (single file). Keeping it single-file is the default — only split if a change genuinely needs it.
- `src/api.js` — `fetchOracleInterpretation` (buffered) + `streamOracleInterpretation` (SSE streaming) helpers
- `src/main.jsx` — entry point
- `src/index.css` — Tailwind directives only
- `api/oracle.js` — Vercel serverless function. Proxies to Claude (Opus 4.8) with extended thinking + SSE streaming; Gemini is a buffered fallback. Keys never reach the browser.
- `index.html` — root HTML with Google Fonts and CSS keyframes

## Modes / major features
- **Oracle** — gematric divination → 7-act ritual → revelation. The Oracle of the Abyss streams its interpretation live (Opus 4.8, extended thinking) into the revelation panel.
- **Tree of Life** — interactive SVG mapping all 96 chapters onto the 10 Sephiroth + 22 Paths. Click a sphere/path to read its chapters; click a chapter to study it.
- **Gematria** — standalone calculator.
- **Grimoire** — journal with milestones, recurrence detection, evolving sigil.
- Background: `AbyssShader` (raw WebGL fractal-nebula, reacts to ritual phase + planetary color) layered under the 2D particle/CRT atmospherics. Degrades gracefully with no WebGL.

## Commands
- Build: `npm run build` (always run after changes)
- Dev: `npm run dev`

## Design system (fonts & motifs)
- Display / illuminated headings: `UnifrakturCook` (blackletter) and `Pirata One`; often with the `.gilded` class (animated gold↔crimson gradient text).
- Long-form prose (chapter text, commentary, Oracle): `IM Fell English` (old-book serif), with a crimson illuminated drop-cap on the key text.
- Technical readouts (gematria, correspondences, planetary/lunar): `JetBrains Mono`.
- Ornaments: `.gild-rule` (gilded divider), `❧` flourishes, custom crimson scrollbars.
- `BabalonStar`: animated neon heptagram (Seal of Babalon) that teleports/glitches across the app — atmosphere only, `pointer-events:none`, hidden on `<sm` screens.
- Layout is safe-area aware (`--safe-top`/`--safe-bottom`, `viewport-fit=cover`); the nav is a two-row, horizontally-scrollable rail so it never clips on narrow/folding screens.

## Do
- Use Tailwind classes for all styling
- Use the illuminated font system above; keep mono only for numeric/technical readouts
- Use the accentColor variable for dynamic (planetary) theming
- Keep neon-crimson-on-black as the core palette
- Keep the dark occult aesthetic: black bg, glass-morphism, generous negative space
- Keep the Oracle (Anthropic) on the latest Claude Opus model
- Run `npm run build` after changes

## Don't
- Do NOT use light backgrounds, pastel colors, or generic fonts
- Do NOT remove existing features
- Do NOT introduce array holes in `LIBER_333` (trailing/double commas) — they create undefined chapters and break divination indexing
- Prefer zero new dependencies; add one only when it clearly earns its weight

## Constraints note
Earlier versions forbade new deps, file splitting, and edits to chapter data / the Oracle prompt. These are now relaxed "for quality": evolve data, prompt, structure, and deps where it clearly improves the result — but justify each, and never regress the aesthetic or the divination integrity.
