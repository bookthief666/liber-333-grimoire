# Liber 333 Product Audit

## Executive assessment

Liber 333 is a distinctive occult study and practice application with five connected surfaces:

1. **Oracle** — deterministic Single and Triad consultations derived from the question’s English Ordinal value.
2. **Rites** — guided station-by-station performances for three ritual chapters.
3. **Tree** — an interactive Tree of Life used to browse chapters by attributed location.
4. **Gematria** — an English Ordinal calculator with number correspondences and a Hebrew-letter reference.
5. **Grimoire** — a local journal, recurrence tracker, reading milestones, evolving sigil, and versioned backup/restore workflow.

The app also includes planetary and lunar context, audio, haptics, speech synthesis, an optional streaming Oracle interpretation layer, atmospheric WebGL/canvas effects, responsive foldable layouts, and an installable PWA foundation.

The primary product problem is no longer missing core features. The remaining work is **orientation, accessibility, low-power behavior, external production configuration, operational verification, and selected scholarly/correctness refinements**.

## What is already strong

### Distinctive identity

The Astral Void direction is coherent: luminous silver prose, crimson accents, blackletter display typography, illuminated manuscript details, animated sigils, zodiac rings, marginalia, constellation fields, and a deep-space ritual background.

### Connected symbolic loop

`question → gematria → deterministic chapter selection → revelation → optional Oracle interpretation → save to Grimoire → recurrence awareness`

Every subsystem feeds the same book and symbolic vocabulary rather than behaving like a collection of unrelated utilities.

### Useful study and practice tools

- Tree-based chapter browsing supports study rather than only divination.
- Guided rites turn textual material into a practical sequence.
- Recurrence tracking makes repeated chapters meaningful.
- Triad synthesis is stronger than three disconnected readings.
- Speech, sound, haptics, and ritual pacing create embodied interaction.
- Local JSON export/import gives users practical control over journal data.

## Completed public-readiness controls

### Typed Oracle boundary

The browser no longer supplies arbitrary provider prompts or system instructions. It sends a versioned typed Liber 333 request containing bounded reading data. The server:

- accepts only Single or Triad operations;
- resolves canonical chapter objects from the 94-record corpus;
- reconstructs the approved prompt from repository-controlled data;
- recomputes Gematria and correspondences;
- bounds question, journal, timing, and counter context;
- rejects legacy `prompt` and `systemPrompt` payloads;
- preserves streaming, cancellation, retry, thinking, and provider fallback behavior.

### Public Oracle controls

Repository code now includes:

- `ORACLE_PUBLIC_ENABLED` emergency switch;
- short-window and daily allowances;
- salted hashing before client identifiers become counter keys;
- optional Upstash Redis REST counters;
- labeled in-memory fallback for previews and development;
- optional fail-closed durable mode;
- request IDs and quota/reset headers;
- controlled 429 and unavailable states;
- privacy-preserving operational logs that omit questions and reconstructed prompts.

### Provenance and corpus clarity

- Visible corpus counts derive from `LIBER_333.length`.
- The 94-record convention is explained.
- Source text and modern editorial commentary are distinguished.
- The visible headings remain `ORACLE OF THE ABYSS` and `ORACLE OF THE ABYSS · TRIAD SYNTHESIS`.
- The provenance layer uses `ORACLE INTERPRETATION`; the rejected “AI-generated interpretation” reader wording is not used.

### Grimoire data portability

Versioned JSON export/import is implemented with:

- local browser processing;
- canonical chapter validation and title restoration;
- non-destructive merge behavior;
- local-entry precedence on ID collisions;
- duplicate handling;
- newest-first ordering and the 50-entry cap;
- highest-lifetime-total preservation;
- all-or-nothing rejection of invalid backups.

### Quality gate

The repository now has a complete `npm run check` gate covering accumulated unit domains, production build, release-file validation, and built-output HTTP smoke testing. The exact PR #35 preview also passed manual browser, provider, filesystem, Fold 6, and installed-PWA checks.

## Remaining release blockers and external dependencies

These items are not proven complete by merged source code:

### 1. Canonical production deployment

The final integration commit’s automatic Vercel deployments were blocked by the account’s daily deployment quota. A canonical production deployment must be created and verified after quota availability returns.

### 2. Durable production configuration

Verify in provider dashboards and the live runtime:

- Upstash database, REST URL, and token;
- strong `ORACLE_RATE_LIMIT_SALT`;
- `ORACLE_REQUIRE_DURABLE_RATE_LIMIT=true` where intended;
- expiry/reset behavior and fail-closed behavior;
- absence of raw client addresses in durable keys and logs.

### 3. Bot and budget controls

Verify rather than assume:

- Vercel Bot Protection;
- provider-side usage alerts and hard ceilings;
- provider billing and model access;
- operational monitoring and rollback ownership.

### 4. Canonical origin and environment

Verify:

- custom domain;
- production and preview project ownership;
- `PUBLIC_APP_ORIGIN`;
- production API keys and model identifiers;
- kill-switch operation in production;
- one canonical Vercel project rather than duplicate competing deployments.

## Remaining correctness work

### Gematria naming and systems

The current method is correctly labeled **English Ordinal Gematria**. Selectable systems remain future work.

### Planetary hours

The current presentation must remain explicitly approximate until actual sunrise/sunset-based unequal hours are implemented and tested.

### Lunar phase

The current calculation is suitable for atmosphere rather than precision electional timing unless replaced by a tested astronomical implementation.

### Editorial review

Continue reviewing chapter attributions and modern commentary. Provenance labels improve clarity but do not substitute for scholarly verification.

## UX and accessibility priorities

### Settings and accessible defaults

The next focused milestone should add persistent local controls for:

- Ceremony: Full / Reduced;
- Motion: Full / Reduced;
- Visual Effects: High / Low;
- Sound, Voice, and Haptics;
- Text Size: Standard / Large;
- reset orientation guidance.

Full ceremony, motion, effects, sound, voice, and supported haptics should remain the ritual default. `prefers-reduced-motion` must be respected without silently rewriting the user’s stored choice.

### Glyph controls

Preserve glyphs while adding accessible names, visible active states, comfortable targets, and state announcements where appropriate.

### Overlay behavior

Overlays need predictable Escape handling, initial focus, focus containment where required, and focus restoration to the invoking control.

### Low-effects mode

Reduce WebGL load, particles, whispers, blur, glow, and simultaneous background systems without redesigning the Astral Void aesthetic.

### Orientation

Add concise first-run and resettable “Ways of Working” guidance:

- question → Oracle;
- study → Tree/chapter reader;
- practice → Rites;
- word or number → Gematria;
- pattern review → Grimoire.

## Architecture assessment

Continue incremental extraction rather than a rewrite. Existing feature modules for Oracle, rate limiting, planetary data, and journal backup demonstrate the preferred direction.

Recommended next extractions and boundaries:

1. persistent settings store and schema;
2. settings sheet and accessible control primitives;
3. atmosphere quality selectors;
4. overlay/focus utilities;
5. ceremony and motion selectors;
6. remaining large feature sections from `src/liber333.jsx`.

Each extraction should preserve deterministic readings, corpus data, Oracle wording, journal schema, and ritual defaults.

## Milestones

### Completed foundation

- configurable provider models;
- request validation and origin restrictions;
- typed Oracle requests and server prompt reconstruction;
- PWA shell and offline foundation;
- corpus/provenance labels;
- automated release gate;
- kill switch and rate-limit implementation;
- privacy and terms surfaces;
- Grimoire export/import.

### Next — Settings, accessibility, and performance

- persistent settings schema;
- reduced ceremony and reduced motion;
- low-effects mode;
- sound/voice/haptics controls;
- large text;
- accessible glyph states;
- Escape and focus management;
- Fold 6 and installed-PWA validation.

### Production verification

- canonical deployment;
- Upstash and fail-closed validation;
- Bot Protection;
- provider budgets;
- custom domain/origin and environment verification;
- monitoring and rollback.

### Later public beta and Android

- controlled public allowance;
- Grimoire search, notes, favorites, and human-readable export;
- Capacitor or TWA evaluation;
- Play internal and closed testing;
- store assets, declarations, and release review.