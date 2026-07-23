# Tree of Life Model Extraction

This milestone isolates the static Tree geometry and chapter-to-location derivation from the single-file application without changing the interactive SVG or chapter placements.

## Extracted module

`src/features/tree/treeModel.js`

It contains:

- the established eleven displayed node coordinates, including Daath;
- displayed node order;
- negative-veil key order;
- chapter grouping by the existing `sephira` field;
- drawable compound-path derivation;
- negative-veil chapter aggregation.

## Preserved behavior

- all 94 chapter records are grouped exactly once;
- missing or empty Sephira values use the existing em-dash bucket;
- a compound location becomes a path only when both endpoint names have coordinates;
- path order follows group insertion order;
- veil aggregation remains Ain, Ain Soph, Ain Soph Aur;
- the Tree component retains its current SVG, selection, hover, labels, colors, hit areas, and detail panel;
- existing visible copy is not edited in this extraction.

## Regression command

`npm run test:tree`
