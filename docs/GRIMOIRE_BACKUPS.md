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

A Single consultation stores one entry. A Triad consultation stores three entries with the same `consultationId` and timestamp.

`totalReadings` counts consultations, not stored rows. New exports and imports therefore use the number of distinct consultation identities as the minimum valid lifetime total. Historical totals are preserved and are never reduced.

The local journal remains capped at 50 entries. Retention is consultation-safe: if the remaining capacity cannot contain every row of a consultation, the entire older consultation is omitted instead of leaving a partial Triad.

## Backward compatibility

The importer accepts backup versions 1 and 2.

A valid version 1 entry is migrated during parsing to entry schema version 2 with:

```json
{
  "favorite": false,
  "note": ""
}
```

Version 1 Triad rows do not contain explicit consultation IDs. The migration layer uses the established legacy grouping fallback based on Triad spread identity, normalized question, minute-level timestamp, and Gematria value.

Version 2 is always produced by new exports. Future unsupported versions are rejected rather than guessed.

## Import behavior

Imports remain deliberately non-destructive:

1. validate the backup format and supported version;
2. validate every entry before any local mutation;
3. restore the canonical chapter title from the bundled corpus;
4. normalize entry schema, consultation metadata, favorite state, and integration note;
5. keep the existing local entry—including its local favorite/note—when an imported ID already exists;
6. add only unique imported entries;
7. sort the merged journal newest-first;
8. retain complete consultations within the 50-entry limit;
9. preserve the highest value among the current lifetime total, backup lifetime total, and merged consultation count.

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

Malformed JSON, unknown formats, unsupported versions, duplicate IDs inside the backup, invalid dates, invalid Workbench metadata, oversized notes, and unknown chapter numbers are rejected before local storage changes.

## Privacy

Export and import happen in the browser. The selected backup file is read locally and is not uploaded to the Liber 333 server. The user controls where the downloaded JSON or Markdown file is stored and whether it is copied to another device or cloud-storage service.

A backup may contain private questions, saved interpretations, and private integration notes. Users should protect it as they would a private journal and avoid attaching it to a public issue or support request.

## Release checks

The regression suite protects:

- version 2 round-trip serialization;
- version 1 migration;
- entry-schema defaults;
- consultation-based lifetime totals;
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
