# Liber 333 Product Audit

## Executive assessment

Liber 333 is no longer a simple text reader. It is already a distinctive occult study and practice application with five connected surfaces:

1. **Oracle** — single-chapter and triad consultations derived from query gematria.
2. **Rites** — guided station-by-station performances for three ritual chapters.
3. **Tree** — an interactive Tree of Life used to browse chapters by attributed location.
4. **Gematria** — an English ordinal calculator with number correspondences and Hebrew-letter reference.
5. **Grimoire** — a local journal, recurrence tracker, reading milestones, and evolving sigil.

It also includes planetary and lunar context, audio, haptics, speech synthesis, a streaming AI interpretation layer, atmospheric WebGL/canvas effects, and responsive mobile navigation.

The app has genuine product potential. Its primary problem is no longer lack of features. Its primary problems are **orientation, accuracy, reliability, architecture, and public-release safety**.

## What is already strong

### Distinctive identity

The Astral Void design direction is recognizable and coherent: luminous silver prose, crimson accents, blackletter display typography, illuminated manuscript details, animated sigils, zodiac rings, marginalia, constellation fields, and a deep-space ritual background.

### Connected symbolic loop

The best existing workflow is:

`question → gematria → chapter selection → revelation → AI interpretation → save to journal → recurrence awareness`

This is more compelling than a generic tarot or quote app because every subsystem feeds the same book and symbolic vocabulary.

### Useful study/practice tools

- Tree-based chapter browsing supports study rather than only divination.
- Guided rites turn textual material into a practical step sequence.
- Journal recurrence makes repeated chapters meaningful.
- Triad synthesis is stronger than three disconnected readings.
- Speech, sound, haptics, and ritual pacing create embodied interaction.

## Critical release blockers

### 1. Oracle endpoint abuse risk

The public API currently accepts arbitrary client-supplied prompts and system prompts. Without authentication, durable rate limits, or server-side operation schemas, it can be used as a general-purpose AI proxy and can exhaust the owner's API budget.

**Required before broad public launch:**

- rate limiting backed by a durable store or platform firewall;
- bot protection for anonymous consultations;
- server-side request schemas;
- ideally construct Oracle prompts on the server from typed reading data instead of accepting arbitrary system prompts;
- usage telemetry and a monthly budget ceiling;
- clear failure states when the public allowance is exhausted.

### 2. Provider model drift

AI model identifiers must be environment-configurable and periodically verified. Hard-coded retired or invented model IDs can make the Oracle fail while the static app still deploys successfully.

### 3. Privacy disclosure

Questions, recent reading context, chapter content, and timing context may be sent to an external AI provider. Journal entries are stored locally in the browser. Users need a concise privacy notice explaining both behaviors.

### 4. No test or quality gate

The project has a build command but no lint script, automated tests, accessibility checks, or end-to-end ritual-flow tests. Vercel compilation success is not equivalent to product readiness.

## Important correctness issues

### Chapter-count inconsistency

The interface uses conflicting numbers such as 93, 94, and 96 in different areas. Derive the displayed corpus count from `LIBER_333.length` and separately explain the traditional chapter-count convention.

### Gematria naming

The current calculator uses ordinal English values `A=1 ... Z=26`. Calling this simply “English Qabalah” may imply a more specific historical cipher than the app actually implements. Label it clearly as **English Ordinal Gematria** and later add selectable systems rather than presenting one method as universal.

### Planetary hours

The current planetary-hour function assumes sunrise at 6:00 a.m. and uses equal civil hours. Traditional planetary hours divide the actual daylight and nighttime intervals into twelve unequal hours. Present the current display as an approximation until real sunrise/sunset calculation is implemented.

### Lunar phase

The current lunar phase is an approximation calculated at mount time. It is suitable as atmosphere, not precision electional timing. Label it accordingly or replace it with a tested astronomical calculation.

### Commentary provenance

The chapter commentary is extensive and often interpretive. The public product should distinguish:

- Crowley's source text;
- Crowley's own published commentary where included;
- modern editorial interpretation;
- generated Oracle interpretation.

A source/provenance panel will improve scholarly credibility.

## UX problems

### The app exposes modes, but not purposes

The navigation labels — Oracle, Rites, Tree, Gematria, Grimoire — identify sections but do not explain when or why to use each one.

Add a first-run **Orientation / Ways of Working** layer with five practical intentions:

- “I have a question” → Oracle
- “I want to study the book” → Tree / chapter reader
- “I want to perform a practice” → Rites
- “I want to examine a word or number” → Gematria
- “I want to review patterns in my work” → Grimoire

### Important concepts lack explanation at the moment of use

Examples:

- single reading versus triad spread;
- how the query maps to a chapter;
- what Thesis / Antithesis / Synthesis means;
- why a repeated chapter matters;
- what is local-only versus AI-generated;
- what the planetary/lunar indicators do and do not claim;
- what saving a reading preserves.

Use short contextual help, not long modal lectures.

### Glyph-only controls reduce discoverability

The audio and voice controls use small symbols. Preserve the symbols, but add accessible labels, visible active states, and a compact settings sheet.

### The seven-second ritual is unskippable

The theatrical reveal is effective once, but repeat users need a “reduced ceremony” preference. Preserve the full ritual as the default experience and allow a shorter accessible mode.

### Journal management is incomplete

Add:

- export/import as JSON;
- optional plain-text or Markdown export;
- search and filters;
- notes added after a reading;
- favorites/bookmarks;
- data deletion confirmation;
- explicit local-storage explanation.

## Architecture assessment

### Current condition

Most data, hooks, feature components, visual systems, and the main application live in `src/liber333.jsx`. This enabled rapid experimentation but now makes changes high-risk.

### Incremental extraction plan

Do not rewrite the app. Extract in this order:

1. `src/data/liber333.js`
2. `src/data/correspondences.js`
3. `src/data/rituals.js`
4. `src/lib/gematria.js`
5. `src/hooks/useOracle.js`
6. `src/hooks/useJournal.js`
7. `src/features/oracle/`
8. `src/features/rituals/`
9. `src/features/tree/`
10. `src/features/gematria/`
11. `src/components/atmosphere/`

Each extraction should preserve behavior and ship independently.

## Visual refinement direction

Do not add more random decoration. Improve hierarchy and meaning.

### Keep

- Astral Void palette;
- illuminated prose;
- zodiac ring and evolving sigil;
- Babalon star and marginalia as restrained atmosphere;
- floating text rather than dashboard boxes;
- ritual pacing and cinematic transitions.

### Refine

- give each mode a distinct symbolic “chamber” while retaining the shared cosmos;
- use visual motifs functionally: Tree geometry in study mode, number constellations in Gematria, station circles in Rites, memory threads in Grimoire;
- add quiet explanatory microcopy below ornamental headings;
- reduce simultaneous background systems on narrow or low-power devices;
- add motion and effects settings;
- establish one consistent button/action hierarchy.

## Recommended milestones

### V1.1 — Public foundation

- valid configurable AI models;
- request validation and origin restrictions;
- installable PWA shell;
- accessibility viewport/focus improvements;
- current README and release documentation.

### V1.2 — Orientation and integration

- first-run Ways of Working screen;
- contextual help for every mode;
- settings sheet;
- clearer transitions between revelation, rite, Tree, and journal;
- explain data/privacy behavior.

### V1.3 — Accuracy and provenance

- derive chapter counts;
- rename the current gematria method;
- add selectable gematria systems;
- accurate planetary hours or an explicit approximation label;
- source/provenance UI;
- editorial review of chapter attributions and commentary.

### V1.4 — Reliability and public beta

- tests and CI;
- rate limiting and bot protection;
- error monitoring;
- journal export/import;
- privacy policy and terms;
- controlled public allowance for AI readings.

### V1.5 — Android release

- production PWA first;
- package with Capacitor or a Trusted Web Activity;
- Android App Bundle;
- Play Console internal and closed testing;
- store listing, content rating, privacy/data-safety declarations, screenshots, and release review.
