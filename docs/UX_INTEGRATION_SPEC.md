# UX Integration Specification

## Product promise

Liber 333 should feel like a living grimoire, but it must behave like a clear instrument.

The design objective is not to simplify the symbolism. It is to make the symbolism navigable: every ornament should indicate state, relationship, memory, progression, or action.

## First-run orientation

Show a dismissible orientation layer before the normal Oracle landing screen.

### Heading

**How will you approach the Book?**

### Five entrances

#### Ask

**Use the Oracle**

Bring a concrete question. The app calculates the English ordinal value of the query, uses that value to select one or three chapters, then optionally asks an AI model to interpret the result in relation to the question.

Primary action: `Begin a consultation`

#### Study

**Enter the Tree**

Browse chapters by their attributed Sephira or Path. Open a chapter directly without pretending that a study selection was a random divination.

Primary action: `Study the Tree`

#### Practice

**Perform a Rite**

Follow a guided, station-by-station rendering of one of the three performable ritual chapters. Include preparation, estimated duration, symbolic alternatives, and safety notes before beginning.

Primary action: `View the rites`

#### Calculate

**Use Gematria**

Examine a word or phrase through the currently selected number system. Show the calculation method and its limitations directly beside the result.

Primary action: `Open the calculator`

#### Review

**Open the Grimoire**

Review saved readings, repeated chapters, notes, timing context, and long-term patterns. Explain that the journal is stored locally on the current device unless exported.

Primary action: `Open the journal`

## Persistent help pattern

Add a small `?` or `ABOUT THIS TOOL` affordance to each mode. It should open a compact sheet containing:

- purpose;
- input required;
- what the tool computes;
- what is interpretive or AI-generated;
- one concrete example;
- practical next action;
- privacy/data behavior.

Do not use one large universal manual as the primary teaching mechanism.

## Mode identities

### Oracle — The Chamber of Question

Visual language:

- central evolving sigil;
- query line as the threshold;
- single/triad choice represented as one star versus three aligned stars;
- ritual reveal as controlled contraction and expansion.

Integration:

- link a revelation to the relevant Tree location;
- link ritual chapters to guided Rites;
- save directly to the journal;
- allow “study this chapter without the Oracle” after revelation.

### Rites — The Processional Circle

Visual language:

- station ring rather than generic progress bar;
- cardinal orientation where relevant;
- active station illuminated; completed stations remain as dim embers;
- words, transliteration, meaning, and action clearly separated.

Integration:

- show the source chapter;
- add a preparation screen with materials and symbolic substitutes;
- allow an optional post-rite note saved to the journal;
- never encourage cutting, ingestion of unsafe materials, or medically risky action.

### Tree — The Map of Emanation

Visual language:

- diagram remains the only intentionally framed technical surface;
- hovered paths illuminate connected spheres;
- selected chapter creates a subtle trace from location to reader panel.

Integration:

- direct chapter search;
- filters by number, title, element, Tarot attribution, or Sephira;
- open chapter in Study view;
- optional Oracle consultation using the selected chapter, clearly labeled as a deliberate selection rather than a random draw.

### Gematria — The Constellation of Number

Visual language:

- letters assemble into a numeric constellation;
- calculation steps remain visible;
- correspondences orbit the result by category rather than appearing as an undifferentiated list.

Integration:

- selectable systems, starting with English Ordinal;
- copy result;
- send value/phrase to Oracle;
- show chapters sharing the result or reduction;
- explain direct match, factor, square, and proximity correspondence types.

### Grimoire — The Memory Vault

Visual language:

- readings form threads and recurrences rather than a plain list;
- repeated chapters appear as brighter nodes;
- milestones are commemorative but not gamified as spiritual attainment.

Integration:

- search, filters, favorites, notes;
- export/import;
- open original reading;
- inspect recurring chapters;
- data-storage explanation and deletion controls.

## Settings sheet

Create one settings surface for:

- sound;
- narration;
- full ceremony / reduced ceremony;
- full effects / balanced / low-power;
- motion reduction;
- text size;
- AI interpretation on/off;
- privacy and data information;
- install app instructions.

The current top-bar glyphs can remain as quick toggles, but the settings sheet should explain them.

## Action hierarchy

Use three consistent action levels:

1. **Primary ritual action** — crimson luminous text, one per screen.
2. **Secondary movement** — silver text with arrow or directional glyph.
3. **Utility action** — smaller dim text: save, copy, retry, settings, delete.

Avoid multiple equally bright actions competing on one screen.

## Accessibility requirements

- preserve pinch zoom;
- visible keyboard focus;
- minimum 44 × 44 CSS-pixel touch targets where practical;
- semantic headings and button labels;
- live-region announcements for Oracle loading/errors;
- skip or shorten cinematic sequences;
- respect `prefers-reduced-motion` in JavaScript-driven canvases and WebGL, not only CSS;
- sufficient contrast without relying only on glow;
- do not use color alone to communicate selected state.

## Acceptance test for V1.2

A first-time user should be able to answer all of these without external explanation:

1. What does each section do?
2. Which section should I use for my current intention?
3. How was this chapter selected?
4. Which parts came from Crowley, the editor, mathematics, or AI?
5. What will be stored, where, and for how long?
6. What can I do next with the result?
