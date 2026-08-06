# Grimoire Backup and Import

## Purpose

Liber 333 stores the Grimoire journal in browser local storage. A browser reset, device migration, PWA reinstall, or manual site-data removal can erase that local journal. Versioned JSON backups provide a portable copy without creating an account or sending journal content to the application server.

The JSON backup remains the canonical machine-restorable format. The separate Markdown export is human-readable and is not accepted by the restore flow.

## Current export format

Version 2 extends the original envelope with Workbench and consultation metadata while retaining the same top-level structure:

```json
{
  "format": "liber-333-grimoire-backup",
  "version": 2,
  "exportedAt": "2026-07-24T02:00:00.000Z",
  "totalReadings": 33,
  "entries": [
    {
      "schemaVersion": 2,
      "consultationId": "consultation-example",
      "spreadPosition": "single",
      "favorite": false,
      "note": ""
    }
  ]
}
```

The downloaded filename remains:

```text
liber-333-grimoire-YYYY-MM-DD.json
```

Export includes only local journal fields used by the application:

- entry ID and date;
- shared consultation ID and spread position when available;
- question;
- chapter number and canonical title;
- Gematria result;
- saved Oracle interpretation when present;
- spread label;
- planetary and lunar labels;
- lifetime reading counter;
- entry schema version;
- favorite state;
- private integration note.

No provider key, browser identifier, rate-limit record, hidden prompt, application setting, or server log is included.

## Consultation and entry semantics

A Single consultation stores one entry. A Triad consultation stores exactly three entries with the same `consultationId`, question, and Gematria value, and exactly one each of `thesis`, `antithesis`, and `synthesis`. Native v2 Triads share one timestamp. Recovered v1 Triads retain each historical row timestamp under a validated migration marker.

`totalReadings` counts consultations, not stored rows. New exports and imports therefore use the number of distinct consultation identities as the minimum valid lifetime total. Historical totals are preserved and are never reduced.

The local journal remains capped at 50 entries. Retention is consultation-safe: if the remaining capacity cannot contain every row of a consultation, the entire older consultation is omitted instead of leaving a partial Triad. Deleting any Triad position in the Workbench also removes the complete consultation group.

## Backward compatibility

The importer accepts backup versions 1 and 2.

A valid version 1 entry is migrated during parsing to entry schema version 2 with:

```json
{
  "favorite": false,
  "note": ""
}
```

Version 1 Triad rows do not contain explicit consultation IDs. They are grouped as ordered adjacent sequences, using normalized question, Gematria, planetary/lunar context, a bounded timestamp tolerance, and three-row chunking. This keeps one historical Triad together when its rows cross a minute boundary while preventing repeated identical Triads from collapsing into one consultation.

When all three historical rows exist, migration orders them by timestamp for role inference, assigns one stable consultation ID and the Thesis, Antithesis, and Synthesis positions, then leaves the journal in its original newest-first presentation order. Each row keeps its original timestamp under `legacyTriadRecovered: true`; migration does not rewrite historical timestamps. Older closure-based saves can contain only one surviving row, and interrupted or separately produced backups can contain two. Those incomplete groups are retained as `legacyTriadFragment: true`: their recoverable reading content remains portable, they remain JSON/Markdown exportable, and no missing chapter or spread position is invented. The Workbench identifies them as “Historical Triad fragment.” If a later cumulative import overlaps an existing fragment and supplies the other recoverable rows, matching local rows receive only the recovered consultation structure while all local fields, including favorite, note, and future-compatible reading data, win. If the completed consultation cannot fit under the cap, the original fragment is retained; an unusually crowded multi-consultation import fails safely rather than displacing it or exceeding the cap.

Version 2 is always produced by new exports. Future unsupported versions are rejected rather than guessed.

## Strict v2 consultation validation

Before export or import, explicit schema-v2 groups are validated as a whole. The only id-less v2 Triad form accepted by import is a marked historical fragment produced by migration; an unmarked id-less Triad remains invalid.

- a Single consultation with an explicit ID must contain exactly one entry;
- a Triad must contain exactly three entries;
- Thesis, Antithesis, and Synthesis must each appear exactly once;
- every Triad row must carry a Triad spread label;
- Triad positions cannot appear without an explicit consultation ID;
- shared question and Gematria fields must be internally consistent;
- native v2 Triads must share one timestamp, while marked recovered v1 Triads must retain chronological Thesis → Antithesis → Synthesis timestamps within the legacy grouping tolerance.

Malformed two-row or four-row Triads, duplicate/missing positions, mixed Single/Triad labels, and inconsistent shared fields are rejected before local storage changes.

## Import behavior

Imports remain deliberately non-destructive:

1. validate the backup format and supported version;
2. validate every entry and explicit consultation group before any local mutation;
3. restore the canonical chapter title from the bundled corpus;
4. normalize entry schema, consultation metadata, favorite state, and integration note;
5. keep the existing local row—including its local favorite/note—when an imported entry ID already exists, except that a matching marked legacy fragment may receive the recovered consultation structure while retaining its local favorite/note;
6. for explicit v2 consultations, also keep the local row for an existing `consultationId + spreadPosition` even when the backup uses a different row ID;
7. allow a valid backup to complete a partial local Triad only by supplying its genuinely missing positions, including cumulative legacy backups that repeat matching fragment rows;
8. revalidate every explicit consultation touched by the merge and reject incompatible consultation-ID reuse before any local mutation;
9. add only the remaining unique imported entries;
10. sort the merged journal newest-first;
11. retain complete consultations within the 50-entry limit;
12. report newly imported consultation identities separately from imported entry rows;
13. preserve the highest value among the current lifetime total, backup lifetime total, and merged consultation count.

Import does not erase or replace the current journal. A separate destructive restore mode remains intentionally omitted.

## Limits

- maximum backup file size: 2 MB;
- maximum entries: 50;
- entry ID: 128 characters;
- consultation ID: 128 characters;
- question: 4,000 characters;
- saved interpretation: 50,000 characters;
- private integration note: 12,000 characters;
- labels: 100 characters;
- lifetime reading total: 10,000,000.

Malformed JSON, unknown formats, unsupported versions, duplicate IDs inside the backup, invalid dates, invalid Workbench metadata, malformed explicit consultation groups, incompatible consultation-ID collisions, oversized notes, and unknown chapter numbers are rejected before local storage changes.

## Privacy

Export and import happen in the browser. The selected backup file is read locally and is not uploaded to the Liber 333 server. The user controls where the downloaded JSON or Markdown file is stored and whether it is copied to another device or cloud-storage service.

A backup may contain private questions, saved interpretations, and private integration notes. Users should protect it as they would a private journal and avoid attaching it to a public issue or support request.

## Release checks

The regression suite protects:

- version 2 round-trip serialization;
- version 1 migration, including one-row and two-row historical Triad fragments;
- existing local-storage Triad-survivor export and v2 re-import;
- entry-schema defaults;
- consultation-based lifetime totals;
- sequence-aware legacy Triad grouping across minute boundaries;
- three-row chunking of repeated legacy Triads;
- strict rejection of missing/extra rows, duplicate/missing positions, missing IDs, mixed labels, and inconsistent shared fields;
- local precedence by entry ID and by explicit consultation position;
- safe completion of partial local Triads when row IDs differ or a cumulative legacy backup overlaps matching fragments, including equal timestamps, unknown local fields, capacity fallback, and no regrouping after cap compaction;
- rejection of incompatible Single/Triad consultation-ID reuse;
- rejection of row-ID collisions that would leave a partial imported Triad;
- post-merge exportability of retained explicit consultations;
- consultation-safe deletion;
- complete-Triad retention at the 50-entry boundary;
- favorite and note validation;
- canonical title restoration;
- invalid format and future-version rejection;
- unknown chapter rejection;
- duplicate-ID rejection;
- non-destructive merge semantics and local metadata precedence;
- newest-first ordering;
- historical lifetime-total preservation;
- nullable optional fields.
