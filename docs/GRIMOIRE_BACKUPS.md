# Grimoire Backup and Import

## Purpose

Liber 333 stores the Grimoire journal in browser local storage. A browser reset, device migration, PWA reinstall, or manual site-data removal can erase that local journal. Versioned JSON backups provide a portable copy without creating an account or sending journal content to the application server.

The JSON backup remains the canonical machine-restorable format. The separate Markdown export is human-readable and is not accepted by the restore flow.

## Current export format

Version 2 extends the original envelope with Workbench metadata while retaining the same top-level structure:

```json
{
  "format": "liber-333-grimoire-backup",
  "version": 2,
  "exportedAt": "2026-07-24T02:00:00.000Z",
  "totalReadings": 33,
  "entries": [
    {
      "schemaVersion": 2,
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

## Backward compatibility

The importer accepts backup versions 1 and 2.

A valid version 1 entry is migrated during parsing to entry schema version 2 with:

```json
{
  "favorite": false,
  "note": ""
}
```

Version 2 is always produced by new exports. Future unsupported versions are rejected rather than guessed.

## Import behavior

Imports remain deliberately non-destructive:

1. validate the backup format and supported version;
2. validate every entry before any local mutation;
3. restore the canonical chapter title from the bundled corpus;
4. normalize entry schema, favorite state, and integration note;
5. keep the existing local entry—including its local favorite/note—when an imported ID already exists;
6. add only unique imported entries;
7. sort the merged journal newest-first;
8. keep the newest 50 entries;
9. preserve the highest value among the current lifetime total, backup lifetime total, and merged entry count.

Import does not erase or replace the current journal. A separate destructive restore mode remains intentionally omitted.

## Limits

- maximum backup file size: 2 MB;
- maximum entries: 50;
- entry ID: 128 characters;
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
- favorite and note validation;
- canonical title restoration;
- invalid format and future-version rejection;
- unknown chapter rejection;
- duplicate-ID rejection;
- non-destructive merge semantics and local metadata precedence;
- newest-first ordering;
- 50-entry cap;
- lifetime-total preservation;
- nullable optional fields.
