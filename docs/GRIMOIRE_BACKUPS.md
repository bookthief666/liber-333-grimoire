# Grimoire Backup and Import

## Purpose

Liber 333 stores the Grimoire journal in browser local storage. A browser reset, device migration, PWA reinstall, or manual site-data removal can erase that local journal. Versioned JSON backups provide a portable copy without creating an account or sending journal content to the application server.

## Export format

The first backup version uses this envelope:

```json
{
  "format": "liber-333-grimoire-backup",
  "version": 1,
  "exportedAt": "2026-07-24T02:00:00.000Z",
  "totalReadings": 33,
  "entries": []
}
```

The downloaded filename follows:

```text
liber-333-grimoire-YYYY-MM-DD.json
```

Export includes only the local journal fields already used by the application:

- entry ID and date;
- question;
- chapter number and canonical title;
- Gematria result;
- saved Oracle interpretation when present;
- spread label;
- planetary and lunar labels;
- lifetime reading counter.

No provider key, browser identifier, rate-limit record, application setting, or server log is included.

## Import behavior

Version 1 imports are deliberately non-destructive:

1. validate the backup format and version;
2. validate each entry and canonical chapter number;
3. restore the canonical chapter title from the bundled corpus;
4. keep the existing local entry when an imported ID already exists;
5. add only unique imported entries;
6. sort the merged journal newest-first;
7. keep the newest 50 entries;
8. preserve the highest value among the current lifetime total, backup lifetime total, and merged entry count.

Import does not erase or replace the current journal. A separate destructive restore mode is intentionally omitted from the public-beta version.

## Limits

- maximum backup file size: 2 MB;
- maximum entries: 50;
- entry ID: 128 characters;
- question: 4,000 characters;
- saved interpretation: 50,000 characters;
- labels: 100 characters;
- lifetime reading total: 10,000,000.

Malformed JSON, unknown formats, unsupported versions, duplicate IDs inside the backup, invalid dates, and unknown chapter numbers are rejected before local storage changes.

## Privacy

Export and import happen in the browser. The selected backup file is read locally and is not uploaded to the Liber 333 server. The user controls where the downloaded JSON file is stored and whether it is copied to another device or cloud-storage service.

A backup may contain private questions and saved interpretations. Users should protect it as they would a private journal and avoid attaching it to a public issue or support request.

## Release checks

The regression suite protects:

- versioned round-trip serialization;
- canonical title restoration;
- invalid format and version rejection;
- unknown chapter rejection;
- duplicate-ID rejection;
- non-destructive merge semantics;
- newest-first ordering;
- 50-entry cap;
- lifetime-total preservation;
- nullable optional fields.
