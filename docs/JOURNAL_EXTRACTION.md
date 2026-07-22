# Journal Persistence Extraction

This milestone moves the existing journal hook and local-storage mechanics out of the single-file application without redesigning the Grimoire.

## Storage contract preserved

- entries key: `liber333_journal`;
- lifetime total key: `liber333_total`;
- journal payload: the existing unversioned array of entry objects;
- newest saved entry appears first;
- at most 50 entries are retained;
- milestones occur at 33, 66, 93, and 333 lifetime saved readings;
- Clear All removes the entries key but deliberately leaves the lifetime total intact.

## Extracted modules

- `journalStorage.js`: pure persistence and list helpers;
- `useJournal.js`: the React hook consumed by the application.

No entry fields, UI, recurrence language, milestone copy, or save choreography are changed in this PR.

## Regression command

`npm run test:journal`
