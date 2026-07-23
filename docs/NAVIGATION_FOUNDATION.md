# Shared Navigation Foundation

This milestone replaces the temporary DOM compatibility bridges with a canonical React navigation boundary.

## Canonical modes

- Oracle
- Rites
- Tree
- Gematria
- Grimoire

The provider exposes the active context mode, the underlying surface mode, journal visibility, a future-safe navigation request payload, and explicit actions for opening Oracle input, a rite, or the journal.

## Removed compatibility mechanisms

- button-text matching in ProductShell;
- document-level click tracking for active mode;
- delayed deep-link button clicks;
- MutationObserver landing-title discovery;
- portal injection of the Ichor Orb.

The landing orb is now rendered by an explicit LandingCenterpiece component inside the original landing phase.

## Protected behavior

This transformation does not modify the corpus, chapter indexes, Gematria arithmetic, Oracle prompt wording, Tree placements, ritual choreography, or journal storage schema.
