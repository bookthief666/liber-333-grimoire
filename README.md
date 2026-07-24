# Liber CCCXXXIII — Digital Grimoire

A living digital companion to Aleister Crowley's *Liber CCCXXXIII: The Book of Lies*.

Liber 333 combines a complete chapter corpus with an interactive study map, English ordinal gematria, guided ritual sequences, a local reading journal, atmospheric audio/visual systems, and an optional streaming Oracle.

## Current product surfaces

### Oracle

Enter a question and choose either:

- **Single** — one chapter selected from the query's English ordinal value.
- **Triad Spread** — Thesis, Antithesis, and Synthesis selected through three deterministic transforms of the query.

The result includes the chapter text, editorial commentary, correspondences, optional streaming Oracle interpretation, recurrence awareness, and journal saving.

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
- optional Upstash Redis REST counters for durable public allowances

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

Complete release gate:

```bash
npm run check
```

## Environment variables

Configure credentials and control values only in the server/deployment environment. Never expose them through `VITE_` variables or client code.

```text
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-opus-4-1-20250805

# Optional fallback when Anthropic is not configured
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.6-flash

# Canonical public origin used by the Oracle CORS policy
PUBLIC_APP_ORIGIN=https://your-domain.example

# Emergency public-Oracle switch
ORACLE_PUBLIC_ENABLED=true

# Short and daily public allowances
ORACLE_RATE_LIMIT_SHORT_MAX=8
ORACLE_RATE_LIMIT_SHORT_SECONDS=600
ORACLE_RATE_LIMIT_DAILY_MAX=40
ORACLE_RATE_LIMIT_DAILY_SECONDS=86400

# Secret used before the client identifier becomes a counter key
ORACLE_RATE_LIMIT_SALT=...

# Durable production counters
UPSTASH_REDIS_REST_URL=https://<database>.upstash.io
UPSTASH_REDIS_REST_TOKEN=...
ORACLE_REQUIRE_DURABLE_RATE_LIMIT=true
```

Legacy Oracle key names are temporarily accepted for backward compatibility, but new deployments should use `ANTHROPIC_API_KEY`.

## Public-release controls

The Oracle endpoint accepts only versioned, typed Liber 333 reading requests. Chapter text, Gematria, correspondences, and provider prompts are reconstructed on the server; browser-supplied provider prompts and system instructions are rejected.

Valid consultations pass through an emergency switch plus short-window and daily allowances. Upstash Redis REST provides shared durable counters when configured. A clearly labeled in-memory fallback supports development and previews, while `ORACLE_REQUIRE_DURABLE_RATE_LIMIT=true` makes production fail closed when the durable store is missing or unavailable.

Before broad promotion, also enable Vercel Bot Protection, configure provider-side usage ceilings, and monitor operational status without retaining private question text.

The privacy policy explains that:

- questions and reading context may be sent to an external model provider;
- the local Grimoire journal is stored on the user's device;
- Oracle interpretations are optional and distinct from source text and editorial commentary;
- salted, expiring identifiers may be used for abuse-prevention counters.

## Progressive Web App

The current PWA foundation includes:

- web app manifest;
- standalone install metadata;
- service worker and offline fallback;
- SVG, 192 × 192, and 512 × 512 application icons;
- maskable Android icon support;
- Oracle, Rites, and Gematria shortcuts;
- accessible viewport and focus defaults.

Verify cache/update behavior and all offline-capable modes before store packaging.

## Documentation

- [`docs/PRODUCT_AUDIT.md`](docs/PRODUCT_AUDIT.md) — current strengths, blockers, accuracy concerns, architecture, and milestones.
- [`docs/UX_INTEGRATION_SPEC.md`](docs/UX_INTEGRATION_SPEC.md) — first-run orientation, mode integration, settings, accessibility, and visual refinement.
- [`docs/RELEASE_PLAN.md`](docs/RELEASE_PLAN.md) — production web, PWA, Capacitor/TWA, and Google Play publication path.
- [`docs/TYPED_ORACLE_API.md`](docs/TYPED_ORACLE_API.md) — versioned request schema, server reconstruction, and trust boundary.
- [`docs/ORACLE_PUBLIC_CONTROLS.md`](docs/ORACLE_PUBLIC_CONTROLS.md) — kill switch, durable counters, headers, logging, bot protection, and rollout verification.

## Near-term roadmap

1. Configure and verify production Upstash, Bot Protection, and provider budgets.
2. Complete accuracy and provenance review.
3. Add journal export/import, search, notes, and favorites.
4. Run a controlled public beta on the production PWA.
5. Prepare Capacitor or Trusted Web Activity packaging and Google Play closed testing.

## Project rule

Preserve the ritual atmosphere, but never let symbolism obscure function. Each visual element should communicate state, relationship, progression, memory, or action.
