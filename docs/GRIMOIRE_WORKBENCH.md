# Grimoire Workbench

## Purpose

The Grimoire Workbench turns locally saved consultations into a private study and integration surface. Search terms, filters, favorites, notes, recurrence analysis, JSON backups, and Markdown exports remain on the user's device.

The versioned JSON backup is the canonical machine-restorable format. Markdown is a separate human-readable export.

## Data model

A **consultation** is one completed Oracle reading:

- a Single consultation stores one journal entry;
- a Triad consultation stores three entries—Thesis, Antithesis, and Synthesis—with one shared `consultationId`; native v2 rows share a timestamp, while recovered historical rows keep their original timestamps.

An **entry** is one persisted chapter position. An **appearance** is one chapter occurrence. These terms are deliberately distinct:

- lifetime reading totals count consultations;
- recurrence reports chapter appearances and distinct consultations;
- storage and backup limits count entries;
- exports report consultation and entry counts separately when they differ.

Historical lifetime totals are never reduced. New atomic batches advance the total only for consultation identities not already present in the local journal.

## Foundation modules

### `consultationIdentity.js`

Shared identity helpers provide:

- one canonical spread-type normalizer;
- explicit `consultationId` keys for schema-v2 data;
- deterministic per-row fallbacks for legacy data;
- ordered, sequence-aware grouping of adjacent legacy Triad rows within a bounded time tolerance;
- three-row chunking so repeated legacy Triads with identical questions and context do not collapse into one consultation;
- correct grouping when historical per-row timestamps cross a minute boundary.

### `consultationSemantics.js`

Shared consultation invariants provide:

- unique consultation counting;
- counting only newly added consultation identities;
- grouping stored rows by consultation;
- complete-group retention at the 50-entry boundary so a Triad is never truncated into a partial consultation.

### `grimoireWorkbench.js`

Pure functions provide:

- normalized full-text matching across questions, canonical chapter titles and text, commentary, notes, stored interpretations, and contextual labels;
- combined Single/Triad, favorite, chapter, inclusive local-calendar date, and sort filters;
- immutable favorite and integration-note updates;
- chapter extraction and corpus hydration;
- recurrence summaries that distinguish appearances from consultations and use the shared sequence-aware identity model.

### `journalSchema.js` and `journalStorage.js`

The journal schema migrates legacy rows to schema version 2 with safe favorite and note defaults. Complete historical three-row Triads receive explicit consultation identity and positions inferred in chronological order while retaining their original row timestamps and newest-first presentation order. One-row or two-row remnants are preserved as visibly labeled historical fragments, remain backup-safe, and never receive invented chapters or positions. A later cumulative legacy import can recover matching fragment structure without replacing any local reading fields; if the complete group cannot fit, the fragment survives unchanged. Storage remains newest-first, local, best-effort, and capped at 50 entries while retaining only complete consultation groups.

The visible Delete control is consultation-safe: deleting any stored Triad position removes the complete explicit or legacy consultation group, preventing the app from creating a partial Triad that cannot be backed up safely.

### `journalBackup.js`

JSON backup version 2:

- accepts and migrates version 1 backups;
- validates every row before local mutation;
- strictly validates explicit consultation groups;
- requires a new or complete v2 Triad to contain exactly three entries and exactly one Thesis, Antithesis, and Synthesis;
- permits only explicitly marked, id-less historical fragments when legacy data contains fewer than three recoverable rows;
- rejects mixed spread labels, missing consultation IDs, duplicate/missing positions, extra/missing rows, and inconsistent shared question/date/Gematria values;
- restores canonical chapter titles;
- preserves local entries on ID collisions;
- retains complete consultations under the 50-entry cap;
- preserves the highest historical lifetime total while using consultation count—not row count—as the minimum valid total.

### `journalMarkdown.js`

The Markdown serializer provides:

- generated-at metadata;
- consultation and entry counts;
- consultation-based lifetime totals;
- optional filtered-selection description;
- explicit question, source-selection, source-text, fixed-commentary, Oracle-interpretation, and private-note labels;
- planetary and lunar context when stored;
- stable full and filtered filenames;
- an explicit reminder that JSON, not Markdown, is the canonical restorable backup.

### `GrimoireWorkbench.jsx`

The extracted modal UI provides local search, filters, recurrence navigation, favorites, private notes, consultation-safe deletion, JSON import/export, Markdown export, destructive-clear confirmation, keyboard focus containment, layered Escape behavior, and responsive desktop/Fold layouts.

## Validation

The permanent release gate covers schema migration, one-row and two-row historical-fragment round trips, existing local Triad-survivor export, new and legacy consultation counting, minute-boundary legacy grouping, three-row legacy chunking, strict v2 Triad validation, consultation-safe deletion, complete-group retention, search/filter behavior, recurrence, JSON round trips, Markdown serialization, local-calendar date boundaries, grouped-Triad metadata, production build validation, and built-output smoke testing.

Playwright covers Chromium, Firefox, WebKit, Fold closed, Fold unfolded, local persistence, offline restart, downloads, favorites, notes, focus restoration, modal isolation, and horizontal-overflow protection.

## Known follow-up work

The current visible list remains entry-oriented. A later consultation-level presentation should group Triad positions into one expandable card and define consultation-level favorite, note, reopen, recent-context, and Markdown-section behavior. Delete semantics are already consultation-safe. That future presentation must not weaken the storage, backup, or consultation-count invariants established here.

## Protected behavior

The Workbench must not change deterministic Single/Triad selection, corpus data or digest, Oracle wording/schema/provider/rate limits, source text, fixed commentary, historical journal lifetime totals, local-first data ownership, or the Astral Void identity.
