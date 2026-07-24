# Liber CCCXXXIII — Digital Grimoire

A living digital companion to Aleister Crowley’s *Liber CCCXXXIII: The Book of Lies*.

Liber 333 combines a 94-record chapter corpus, deterministic Single and Triad readings, an interactive Tree of Life, English Ordinal Gematria, guided ritual sequences, a local Grimoire journal, atmospheric audio/visual systems, and an optional streaming Oracle interpretation.

## Current product surfaces

### Oracle

Enter a question and choose either:

- **Single** — one chapter selected from the question’s English Ordinal value.
- **Triad Spread** — Thesis, Antithesis, and Synthesis selected through three deterministic transforms.

The browser sends a versioned, typed Liber 333 reading request. The server resolves canonical chapter data, reconstructs the approved Single or Triad prompt, and rejects browser-supplied provider prompts or system instructions.

Visible interpretive headings remain:

- `ORACLE OF THE ABYSS`
- `ORACLE OF THE ABYSS · TRIAD SYNTHESIS`

The compact provenance note distinguishes source text, modern editorial commentary, and `ORACLE INTERPRETATION`.

### Rites

Guided station-by-station presentations of:

- Chapter 25 — The Star Ruby
- Chapter 36 — The Star Sapphire
- Chapter 44 — The Mass of the Phoenix

Potentially harmful actions remain symbolic and explicitly safe.

### Tree

An interactive Tree of Life used to browse chapters by their attributed Sephira or Path and open a chapter directly in study mode.

### Gematria

A calculator using **English Ordinal Gematria** (`A=1 ... Z=26`) with reduction steps, notable-number correspondences, factors, squares, proximity relationships, and a Hebrew-letter reference.

### Grimoire

A local-device journal that stores readings, recurrence counts, timing context, milestones, and an evolving sigil.

Versioned JSON **EXPORT** and non-destructive **IMPORT** are implemented. Imports validate the backup envelope and canonical chapter numbers, preserve local entries on ID collisions, retain the newest 50 entries, restore bundled canonical titles, and preserve the highest lifetime reading total. Backup processing remains local to the browser.

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

The Vite development server proxies `/api` to `http://localhost:3000`. Use a compatible local serverless environment for Oracle testing or a Vercel preview deployment.

Production build:

```bash
npm run build
npm run preview
```

Complete repository release gate:

```bash
npm run check
```

The gate includes unit domains, production build, release-file validation, and built-output HTTP smoke testing.

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

Implemented in the repository:

- versioned typed Oracle requests;
- server-owned canonical prompt reconstruction;
- rejection of legacy `prompt` and `systemPrompt` payloads;
- emergency public-Oracle kill switch;
- short-window and daily allowances;
- privacy-preserving salted client-key hashing;
- optional Upstash Redis REST counters;
- labeled development/preview memory fallback;
- optional fail-closed durable mode;
- request IDs, remaining-limit/reset headers, and controlled quota errors;
- privacy-preserving operational logs that omit question and prompt content;
- versioned local Grimoire export/import.

Still external and **not verified by repository code alone**:

- production Upstash database and credentials;
- a strong production `ORACLE_RATE_LIMIT_SALT`;
- Vercel Bot Protection;
- provider-side budget alerts or hard spending ceilings;
- canonical custom-domain and `PUBLIC_APP_ORIGIN` configuration;
- production provider keys/models and all production environment variables;
- final monitoring, rollback, and deployment ownership.

Do not describe any of those external controls as complete until they are verified in their provider dashboards and exercised on the canonical production deployment.

## Progressive Web App

The PWA foundation includes:

- web app manifest;
- standalone install metadata;
- service worker and offline fallback;
- SVG, 192 × 192, and 512 × 512 application icons;
- maskable Android icon support;
- Oracle, Rites, and Gematria shortcuts;
- accessible viewport and focus defaults.

The exact PR #35 preview was manually validated for Single/Triad readings, Oracle streaming/retry/cancellation, Grimoire export/import, duplicate and invalid imports, Fold 6 closed/unfolded layouts, and installed-PWA behavior.

## Documentation

- [`docs/PRODUCT_AUDIT.md`](docs/PRODUCT_AUDIT.md) — implemented capabilities, remaining risks, architecture, accessibility, and milestones.
- [`docs/UX_INTEGRATION_SPEC.md`](docs/UX_INTEGRATION_SPEC.md) — orientation, settings, accessibility, and visual refinement.
- [`docs/RELEASE_PLAN.md`](docs/RELEASE_PLAN.md) — production web, PWA, Android packaging, and external release controls.
- [`docs/TYPED_ORACLE_API.md`](docs/TYPED_ORACLE_API.md) — typed request schema and server trust boundary.
- [`docs/ORACLE_PUBLIC_CONTROLS.md`](docs/ORACLE_PUBLIC_CONTROLS.md) — kill switch, counters, headers, logging, and rollout verification.
- [`docs/GRIMOIRE_BACKUPS.md`](docs/GRIMOIRE_BACKUPS.md) — versioned export/import format and merge behavior.

## Near-term roadmap

1. Add persistent settings, accessibility controls, focus management, reduced ceremony/motion, and a low-effects mode while preserving the full ritual defaults.
2. Configure and verify production Upstash, a strong salt, Vercel Bot Protection, provider budgets, production environment variables, canonical domain/origin, monitoring, and rollback.
3. Complete remaining accuracy work: selectable Gematria systems, explicit/accurate planetary-hour handling, and editorial review of attributions and commentary.
4. Add Grimoire search, notes, favorites, and optional human-readable export.
5. Run a controlled public beta on the canonical production PWA.
6. Prepare Capacitor or Trusted Web Activity packaging and Google Play closed testing.

## Project rule

Preserve the ritual atmosphere, but never let symbolism obscure function. Each visual element should communicate state, relationship, progression, memory, or action.