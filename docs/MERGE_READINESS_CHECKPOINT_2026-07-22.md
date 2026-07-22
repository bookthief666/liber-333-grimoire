# Liber 333 Merge-Readiness Checkpoint

Date: 2026-07-22

This document records the exact state of the current stacked pull requests before any merge is attempted. It is intentionally documentation-only and does not modify runtime behavior.

## 1. Canonical application stack

The main product line is:

1. PR #1 — `main` → `agent/liber333-publication-foundation`
2. PR #2 — `agent/liber333-publication-foundation` → `agent/liber333-orientation-integration`
3. PR #4 — `agent/liber333-orientation-integration` → `agent/liber333-ichor-orb`
4. PR #15 — `agent/liber333-ichor-orb` → `agent/liber333-navigation-foundation`
5. PR #16 — `agent/liber333-navigation-foundation` → `agent/liber333-gematria-engine`
6. PR #17 — `agent/liber333-gematria-engine` → `agent/liber333-journal-extraction`
7. PR #18 — `agent/liber333-journal-extraction` → `agent/liber333-ritual-data`
8. PR #19 — `agent/liber333-ritual-data` → `agent/liber333-correspondence-data`
9. PR #20 — `agent/liber333-correspondence-data` → `agent/liber333-oracle-extraction`
10. PR #21 — `agent/liber333-oracle-extraction` → `agent/liber333-chapter-data`
11. PR #22 — `agent/liber333-chapter-data` → `agent/liber333-cosmic-timing`
12. PR #23 — `agent/liber333-cosmic-timing` → `agent/liber333-tree-model`
13. PR #24 — `agent/liber333-tree-model` → `agent/liber333-divination-selection`

Every PR in this chain is currently open, draft, and reported mergeable by GitHub.

## 2. Parallel release branch

PR #14 — `agent/liber333-ichor-orb` → `agent/liber333-release-readiness` — is not part of the canonical extraction stack.

It adds public policy pages, a release validator, and release documentation. Because it branches from PR #4 rather than PR #24, it should not be treated as the next item in the sequential merge chain.

Preferred treatment:

1. Merge the canonical application stack first.
2. Create a fresh release-readiness branch from the resulting `main`.
3. Port or reapply PR #14's policy pages, validation script, CI workflow, icons, and release-gate documentation.
4. Run the current accumulated unit suite and production build on that fresh branch.
5. Close or supersede PR #14 after the replacement branch is verified.

This avoids allowing an old parallel branch to obscure conflicts in `package.json`, CI configuration, PWA assets, or documentation.

## 3. Deployment and validation status

### Existing successful Vercel deployments

The following heads have successful checks on both Vercel projects:

- PR #1
- PR #2
- PR #4
- PR #15
- PR #16
- PR #17

### Vercel build-rate-limit results

The following heads currently show Vercel failures whose target is the account build-rate-limit/upgrade page rather than an application build log:

- PR #14
- PR #18
- PR #19
- PR #20
- PR #21
- PR #22
- PR #23
- PR #24

These statuses must be described as infrastructure-quota blocks, not successful deployments and not proven application build failures.

### Independent GitHub Actions validation

The extraction work from PR #18 through PR #24 was committed only after its branch-specific GitHub Actions gate ran the accumulated unit suite and `npm run build` successfully. The temporary transformation workflows were removed after generation and validation.

The current accumulated unit suite protects:

1. English Ordinal Gematria and deterministic hashing.
2. Journal persistence, legacy storage, recurrence, milestones, and Clear All semantics.
3. Guided-rite structure and safety language.
4. Qabalistic correspondence records and lookup behavior.
5. Single and Triad Oracle prompt output.
6. The complete 94-record chapter corpus and its serialized SHA-256 digest.
7. Symbolic planetary-hour and Conway lunar-phase calculations.
8. Tree-of-Life coordinates, grouping, path derivation, and veil aggregation.
9. Single and Triad chapter-selection outcomes and duplicate avoidance.

## 4. Required manual validation before merge

Automated tests do not replace these checks.

### A. Landing and navigation

- One Ichor Orb appears on the original landing screen.
- The old large spinning geometry is absent.
- The verified unicursal hexagram is visible and correctly oriented.
- Touching the orb creates a local ripple but does not begin consultation.
- `BEGIN CONSULTATION` remains visible on phone, Fold closed, Fold open, tablet, and desktop.
- Oracle, Rites, Tree, Gematria, and Grimoire navigation work.
- The Grimoire closes back to the previously active surface.
- `?mode=oracle`, `?mode=ritual`, `?mode=tree`, `?mode=gematria`, and `?mode=grimoire` initialize correctly.
- Contextual help follows the active chamber and never opens automatically.

### B. Single Oracle

Use at least one fixed question such as `THELEMA` and confirm:

- the expected chapter is selected;
- the seven-second ritual completes;
- the revelation appears;
- streaming begins and completes;
- provider errors remain visible and recoverable;
- retry works;
- reset cancels an active request and clears Oracle state.

### C. Triad Oracle

Use a fixed phrase such as `Do what thou wilt` and confirm:

- the expected three unique chapters appear in Thesis, Antithesis, Synthesis order;
- one unified Oracle response streams;
- moving among revealed cards does not corrupt the generated reading;
- saving records all three chapter entries using the existing schema.

### D. Journal compatibility

In the same browser profile used before the refactor:

- existing entries load;
- questions and interpretations remain intact;
- a saved entry restores the correct chapter;
- recurrence counters remain correct;
- deleting one entry preserves the rest;
- Clear All removes saved entries but preserves the lifetime reading counter;
- milestone overlays retain their existing thresholds.

A backup/export should be taken before destructive Clear All testing if the browser contains valued readings.

### E. Rites

- Star Ruby contains 9 stations.
- Star Sapphire contains 8 stations.
- Mass of the Phoenix contains 8 stations.
- Forward and back controls work.
- Bell-marked stations still sound when audio is enabled.
- Deep-linked rite opening still works.
- Symbolic non-injury language remains visible in the Mass of the Phoenix.

### F. Tree and correspondences

- All spheres remain in their prior positions.
- Path lines and Hebrew glyphs display.
- Node, path, and veil selections return the same chapter lists.
- Selecting a chapter enters the correct revelation.
- Sephira colors, elemental labels, Tarot data, and Hebrew reference data remain unchanged.

### G. Gematria

- The calculator returns the same full sum, reduction sequence, factors, and correspondences for known phrases.
- Its method is identified as English Ordinal A=1–Z=26 wherever explanatory copy is shown.
- Cross-tool actions into Oracle and Tree remain functional.

### H. Cosmic timing, audio, and motion

- Planetary glyph, color, and lunar phase render without startup errors.
- Oracle context still includes timing data when available.
- Sound starts only after user interaction.
- Bells, impact sound, narration, reduced motion, and text scaling still work.
- The Astral Void, stars, particles, marginalia, shockwave, and revelation animations remain present.

### I. Device matrix

Minimum manual matrix:

- Fold 6 closed portrait.
- Fold 6 open portrait.
- Fold 6 open landscape.
- Desktop Chromium.
- One reduced-motion pass.
- One fresh/incognito profile with no journal data.
- One existing profile containing legacy journal data.

## 5. Sequential merge procedure

Do not merge the entire stack out of order.

For each PR in the canonical chain:

1. Confirm the preceding PR has merged into `main`.
2. Retarget the current PR base to `main`.
3. Verify GitHub shows only that PR's intended files and no previously merged changes.
4. Wait for required checks or run the local/GitHub validation gate.
5. Mark the PR ready for review only after its manual checklist is satisfied.
6. Merge it.
7. Repeat with the next PR.

Canonical order:

`#1 → #2 → #4 → #15 → #16 → #17 → #18 → #19 → #20 → #21 → #22 → #23 → #24`

Because PRs are stacked, merging a parent branch does not automatically guarantee that the child PR is correctly targeted to `main`. Always inspect the child diff after retargeting.

## 6. Stop conditions

Stop the merge sequence immediately if any of the following occurs:

- a retargeted PR shows previously merged files as new changes;
- legacy journal entries fail to load;
- fixed Single or Triad questions select different chapters;
- Oracle prompt snapshots or provider payload behavior changes;
- the Tree loses chapter groups or paths;
- a rite loses stations or wording;
- the landing screen shows duplicate geometry;
- Fold layout hides the title or primary action;
- `npm run test:unit` or `npm run build` fails;
- a Vercel result points to a genuine build log with an application error rather than only the quota page.

## 7. Post-stack release work

After PR #24 is merged and the replacement for PR #14 is verified:

1. Run a full release candidate build from `main`.
2. Restore fresh Vercel preview/production checks after the quota resets.
3. Verify Privacy, Terms, and Support URLs on the production domain.
4. Validate PWA installation, service-worker updates, offline fallback, and raster icons.
5. Add durable rate limiting, bot protection, provider budget limits, and monitoring before broad promotion.
6. Run a controlled public beta before beginning Capacitor/Google Play packaging.

## 8. Current decision

The code stack is suitable for manual merge-readiness testing, but it is not yet appropriate to merge automatically or publish publicly without the provider, journal-compatibility, device, and release-policy checks above.
