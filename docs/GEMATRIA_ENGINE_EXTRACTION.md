# Gematria Engine Extraction

This milestone moves the current numerical engine out of the single-file application without changing its behavior.

## Extracted

- English Ordinal A=1 through Z=26 values;
- notable-number editorial correspondences;
- full-sum and digit-reduction calculation;
- correspondence ranking and result limit;
- deterministic string hash used by the Triad draw.

## Preserved

- non-Latin characters, punctuation, spaces, and digits remain ignored;
- empty input returns the existing zero-valued shape;
- correspondence wording and ordering are unchanged;
- chapter selection still uses the same full sum, reduced value, and hash;
- no visible Gematria, Oracle, Tree, journal, or ritual design changes are included.

## Regression command

`npm run test:gematria`
