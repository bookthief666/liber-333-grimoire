# Liber 333 Chapter Corpus Extraction

This milestone moves the complete 94-entry chapter corpus out of the single-file application without editing its source text, editorial commentary, ordering, or attributions.

## Extracted unchanged

- the two preliminary veil entries, numbered -2 and -1;
- Chapter 0;
- Chapters 1 through 91;
- chapter titles;
- source-text excerpts;
- editorial commentary;
- Sephira, path, element, and Tarot fields.

## Integrity protection

The regression suite locks:

- the exact 94-entry sequence;
- unique chapter identifiers;
- the established eight-field record shape;
- sentinel veil, opening, ritual, and closing entries;
- a SHA-256 digest of the complete serialized corpus.

## Protected behavior

- Oracle Single and Triad indexing;
- random ambient chapter selection;
- Tree browsing and selected-chapter lookup;
- journal restoration;
- chapter display and commentary rendering;
- all chapter wording and attributions.

## Regression command

`npm run test:chapters`
