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

## Design system — "Astral Void" (fonts, color & motifs)
- **Palette:** deep indigo-black cosmos ground (`--void`/radial body gradient), luminous **silver** text (`--lux`), **crimson `#ff2e4d`** reserved as the accent. Planetary `accentColor` is used ONLY for subtle tinting (sigil, particles, nebula stars) — never for primary text.
- **No boxes around text.** Sections/buttons/nav are *floating text*; separate with `.star-rule` (gradient hairline), not borders. The only frame kept is the Tree-of-Life diagram.
- **Floating-text utilities (index.html):** `.lux` (silver + dark halo + faint glow — keeps text readable over any background), `.lux-dim` (secondary), `.lux-crimson` (accent/glow). Use these instead of `text-neutral-*` for legibility.
- **Typography (full grimoire-gothic):** titles/headings → `UnifrakturCook` blackletter (bright, via `.gilded`); medium headings → `Pirata One`; long-form prose → `IM Fell English`; numeric readouts → `JetBrains Mono`. Key chapter text has a crimson illuminated drop-cap.
- **Background:** `AbyssShader` = a dark indigo nebula + twinkling starfield (kept dim so it never washes out text); `ParticleCanvas` draws silver stars + **constellation lines**.
- **Living symbolism:** `BabalonStar` (roaming glitching heptagram), `ZodiacRing` (counter-rotating zodiac/planet glyph wheels behind the sigil), `Marginalia` (drifting occult glyphs at the edges). All `pointer-events:none`, hidden `<sm` where noted.
- Layout is safe-area aware (`--safe-top/--safe-bottom`, `viewport-fit=cover`); nav is a two-row, horizontally-scrollable rail.

## Do
- Use Tailwind + the `.lux`/`.lux-dim`/`.lux-crimson` + `.gilded` utilities; avoid dark `text-neutral-6/7/800` for real content
- Float text on the cosmos; use `.star-rule` instead of borders
- Keep mono only for numeric/technical readouts
- Keep the indigo-silver-crimson astral palette
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
