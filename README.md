# Liber CCCXXXIII — Digital Grimoire

A living digital companion to Aleister Crowley's *Liber CCCXXXIII: The Book of Lies*.

Liber 333 combines a complete chapter corpus with an interactive study map, English ordinal gematria, guided ritual sequences, a local reading journal, atmospheric audio/visual systems, and an optional AI-assisted Oracle.

## Current product surfaces

### Oracle

Enter a question and choose either:

- **Single** — one chapter selected from the query's English ordinal value.
- **Triad Spread** — Thesis, Antithesis, and Synthesis selected through three deterministic transforms of the query.

The result includes the chapter text, editorial commentary, correspondences, optional streaming AI interpretation, recurrence awareness, and journal saving.

### Rites

Guided station-by-station presentations of three performable ritual chapters:

- Chapter 25 — The Star Ruby
- Chapter 36 — The Star Sapphire
- Chapter 44 — The Mass of the Phoenix

The app presents directions, words, transliteration/meaning where available, progress, and optional bell cues. Potentially harmful actions must remain symbolic and explicitly safe.

### Tree

An interactive Tree of Life used to browse chapters by their attributed Sephira or Path and open a chapter directly in study mode.

### Gematria

A calculator using **English Ordinal Gematria** (`A=1 ... Z=26`) with reduction steps, notable-number correspondences, factors, squares, proximity relationships, and a Hebrew-letter reference.

### Grimoire

A local-device journal that stores readings, recurrence counts, timing context, milestones, and an evolving sigil. Journal data remains in browser storage unless a future export/import feature is used.

## Experience systems

- Astral Void visual direction
- WebGL abyss/nebula shader
- particle constellations
- animated and evolving sigils
- zodiac and planetary glyph rings
- ambient marginalia and chapter whispers
- Web Audio bells, drones, and impacts
- haptic feedback where supported
- browser speech synthesis
- planetary-hour and lunar-phase atmosphere
- responsive navigation and safe-area support
- installable Progressive Web App foundation

## Stack

- React 18
- Vite 6
- Tailwind CSS 4
- Framer Motion
- Lucide React
- Vercel serverless functions
- Anthropic Messages API or Gemini API for optional Oracle interpretation

## Development

```bash
npm install
npm run dev
```

The Vite development server proxies `/api` to `http://localhost:3000`. Run a compatible local serverless environment for Oracle testing, or use a Vercel preview deployment.

Production build:

```bash
npm run build
npm run preview
```

## Environment variables

Configure provider keys only in the server/deployment environment. Never expose them through `VITE_` variables or client code.

```text
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-opus-4-1-20250805

# Optional fallback when Anthropic is not configured
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.6-flash

# Canonical public origin used by the Oracle CORS policy
PUBLIC_APP_ORIGIN=https://your-domain.example
```

Legacy Oracle key names are temporarily accepted for backward compatibility, but new deployments should use `ANTHROPIC_API_KEY`.

## Public-release warning

The current Oracle endpoint still accepts client-supplied prompt text. Before broad public promotion, add durable rate limiting, bot protection, usage budgets, monitoring, and preferably server-side typed Oracle operations. Otherwise a public endpoint may be abused and consume provider credits.

Also publish a privacy policy explaining that:

- questions and reading context may be sent to an external AI provider;
- the local Grimoire journal is stored on the user's device;
- AI interpretations are optional and distinct from the source text and editorial commentary.

## Progressive Web App

The publication-foundation work adds:

- web app manifest;
- standalone install metadata;
- service worker;
- offline fallback;
- install icon;
- accessible viewport and focus defaults.

Before final store release, add production raster icons at 192 × 192 and 512 × 512, verify cache/update behavior, and test all offline-capable modes.

## Documentation

- [`docs/PRODUCT_AUDIT.md`](docs/PRODUCT_AUDIT.md) — current strengths, blockers, accuracy concerns, architecture, and milestones.
- [`docs/UX_INTEGRATION_SPEC.md`](docs/UX_INTEGRATION_SPEC.md) — first-run orientation, mode integration, settings, accessibility, and visual refinement.
- [`docs/RELEASE_PLAN.md`](docs/RELEASE_PLAN.md) — production web, PWA, Capacitor/TWA, and Google Play publication path.

## Near-term roadmap

1. Public foundation and runtime reliability.
2. First-run “Ways of Working” orientation.
3. Contextual explanation for every tool.
4. Accuracy/provenance review.
5. Journal export, search, notes, and deletion controls.
6. Rate limiting, privacy pages, tests, and public beta.
7. Capacitor Android packaging and Google Play closed testing.

## Project rule

Preserve the ritual atmosphere, but never let symbolism obscure function. Each visual element should communicate state, relationship, progression, memory, or action.
