# Oracle Hook and Prompt Extraction

This milestone isolates Oracle prompt construction and streaming state from the single-file application without altering the Oracle's voice, context, or visible behavior.

## Extracted modules

- `src/features/oracle/oraclePrompts.js`
  - Single Oracle system prompt;
  - Triad Oracle system prompt;
  - Single user-message construction;
  - Triad Thesis–Antithesis–Synthesis message construction;
  - journal continuity, recurrence, planetary-hour, lunar-phase, and reading-count context.
- `src/features/oracle/useAIOracle.js`
  - request cancellation;
  - thinking state;
  - first-token transition;
  - streamed text accumulation;
  - completion state;
  - abort handling;
  - error state;
  - reset behavior.

## Preserved boundary

The planetary attribution table remains in `src/liber333.jsx` and is injected into the hook. Planetary-hour calculation is not moved in this pass.

## Protected behavior

- Single and Triad prompt wording;
- paragraph-count and final-sentence instructions;
- private-reasoning instruction sent to the external model;
- chapter, Gematria, correspondence, Qabalistic, journal, recurrence, planetary, and lunar context;
- stream callbacks and state transitions;
- request abort semantics;
- provider API contract;
- visible Oracle controls and result rendering.

## Regression command

`npm run test:oracle`
