# Divination Selection Extraction

This milestone isolates chapter selection from the ritual animation and React state while preserving the Oracle’s current deterministic behavior.

## Extracted module

`src/features/oracle/divinationSelection.js`

It exports:

- `getReadingChapterIndexes`;
- `selectReadingChapters`.

## Preserved Single behavior

Single selection uses:

`English Ordinal full sum % chapter corpus length`

## Preserved Triad behavior

- Thesis uses the full English Ordinal sum;
- Antithesis uses the theosophically reduced value;
- Synthesis uses the existing deterministic string hash;
- each value is reduced modulo the corpus length;
- duplicate indexes advance forward one position at a time and wrap at the end of the corpus;
- returned chapters are the original corpus object references.

## Protected boundary

This extraction does not move or change:

- Gematria calculation;
- correspondence lookup;
- question validation;
- ritual animation and timing;
- haptics or audio;
- Oracle prompt construction or streaming;
- journal context or saving;
- visible Single/Triad controls.

## Regression command

`npm run test:selection`
