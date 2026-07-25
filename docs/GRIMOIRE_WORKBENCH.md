# Grimoire Workbench

## Purpose

The Grimoire Workbench turns locally saved consultations into a private study and integration surface. The Workbench remains local-first and does not transmit journal search terms, filters, favorites, notes, recurrence analysis, or exports to a server.

The versioned JSON backup remains the canonical machine-restorable format. Markdown is a separate human-readable export.

## Foundation modules

### `grimoireWorkbench.js`

Pure functions provide:

- normalized full-text matching across questions, titles, notes, stored interpretations, contextual labels, and optional nested chapter layers;
- combined Single/Triad, favorite, chapter, inclusive date-range, and sort filters;
- immutable favorite and integration-note updates;
- bounded note normalization;
- chapter extraction from current single-entry data and future nested triad records;
- recurrence summaries that distinguish total chapter appearances from the number of consultations in which the chapter appeared.

The functions do not read storage, mutate entries, or perform network requests.

### `journalMarkdown.js`

The Markdown serializer provides:

- generated-at metadata and exported/lifetime counts;
- optional filtered-selection description;
- explicit question, source-selection, source-text, fixed-commentary, Oracle-interpretation, and private-note labels;
- planetary and lunar context when stored;
- stable full and filtered filenames;
- an explicit reminder that JSON, not Markdown, is the canonical restorable backup.

The serializer operates entirely in memory. Download wiring belongs to the journal feature layer.

## Next implementation stages

1. Revise the journal-entry schema compatibly to add `favorite` and `note` defaults.
2. Revise backup validation and migration without weakening all-or-nothing rejection or local-entry precedence.
3. Add journal hook methods for favorite/note updates and Markdown export.
4. Extract the Grimoire UI from the large reader component into a focused feature boundary.
5. Build search/filter controls, note editing, recurrence navigation, and responsive Fold layouts.
6. Add Playwright and installed-PWA coverage before merge.

## Protected behavior

The Workbench must not change deterministic Single/Triad selection, corpus data or digest, Oracle wording/schema/provider/rate limits, source text, fixed commentary, existing journal lifetime totals, local-first data ownership, or the Astral Void identity.
