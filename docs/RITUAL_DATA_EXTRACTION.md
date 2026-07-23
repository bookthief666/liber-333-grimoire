# Guided Rite Data Extraction

This milestone moves the static guided-rite corpus out of the single-file application while preserving the existing Ritual Mode component and choreography.

## Extracted unchanged

- Chapter 25 — The Star Ruby;
- Chapter 36 — The Star Sapphire;
- Chapter 44 — The Mass of the Phoenix;
- rite titles, subtitles, elements, durations, introductions;
- station order, directions, words, transliterations, meanings, bell flags, and final flags.

## Protected behavior

- Ritual Mode state remains in the existing component;
- no station timing or navigation changes;
- no audio or bell behavior changes;
- no visual changes;
- the symbolic non-injury instruction in the Mass of the Phoenix remains explicit.

## Regression command

`npm run test:rites`
