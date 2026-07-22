# Public Release Gate

This checklist defines the minimum bar before promoting Liber 333 beyond a controlled preview.

## Automated gate

Every pull request and every push to `main` must pass:

```bash
npm ci
npm run check
```

`npm run check` executes:

1. all nine accumulated unit suites;
2. the production Vite build;
3. release-file validation.

The release validator checks:

- manifest structure;
- policy and support pages;
- offline fallback and service worker;
- SVG, 192×192 PNG, and 512×512 PNG icons;
- actual PNG dimensions;
- maskable icon declaration;
- Apple touch icon wiring;
- service-worker shell entries;
- required package scripts;
- known wildcard-CORS patterns in provider routes that exist in the repository.

A green build does not prove that an external AI provider, browser permission, or device-specific API works. Manual verification remains mandatory.

## Required manual verification

### Core product

- Oracle Single and Triad flows complete without navigation regressions.
- Source text remains usable when the AI provider is unavailable.
- Tree, Rites, Gematria, and Grimoire operate without an AI request.
- Existing local journal data loads in the browser profile where it was created.
- Clear All behaves as documented and does not reset the lifetime reading counter.
- The original Astral Void, stars, particles, marginalia, shockwaves, and ritual animation remain visible.

### Oracle provider

- A real Single request streams and completes.
- A real Triad request streams one unified interpretation.
- A second request aborts the first.
- Reset cancels an active request.
- Provider errors appear through the existing error UI.
- No client-side API secret is bundled.
- Rate limiting, bot protection, provider spending limits, and monitoring are active before broad promotion.

### Devices

- Android phone portrait.
- Fold closed portrait.
- Fold open portrait and landscape.
- Tablet.
- Desktop keyboard and pointer navigation.
- Reduced-motion mode.
- Installed PWA launch and update.
- Fresh profile with no journal data.
- Existing profile containing legacy journal data.

### Privacy and transparency

- `/privacy.html`, `/terms.html`, and `/support.html` resolve on the production domain.
- The Oracle is identified as AI-generated reflection where it is presented to users.
- Local-storage behavior is explained.
- Questions and reading context sent to the configured AI provider are disclosed.
- Hosting and provider log-retention settings have been reviewed.
- The public support process warns users not to post private journal or Oracle content.

### PWA assets and behavior

- 192×192 PNG icon.
- 512×512 maskable PNG icon.
- SVG scalable icon.
- Apple touch icon.
- Manifest shortcuts.
- Install prompt behavior.
- Offline fallback.
- Policy pages available from cache after installation.
- Service-worker update behavior after a new deployment.
- No stale preview remains indefinitely after the cache version changes.

## Public-beta gate

Before announcing the application broadly:

1. Use a stable custom domain.
2. Verify the complete gate from a clean clone.
3. Run a small controlled beta.
4. Monitor provider errors, latency, usage, and spend.
5. Confirm that non-AI features remain useful during provider outages.
6. Collect reproducible device reports rather than general visual impressions.
7. Back up or export valued journal data before storage migrations are introduced.

## Android / Google Play gate

Do not package a preview blindly. Complete the stable web release first, then:

1. Add Capacitor with an explicit Android application ID.
2. Configure release signing and secure key backup.
3. Use the production domain for Privacy Policy and Support URLs.
4. Prepare phone, tablet, and foldable screenshots.
5. Complete Data Safety and content-rating declarations from observed application behavior.
6. Verify deep links, haptics, speech, audio, local storage, file export/import, and application updates in an internal test track.
7. Complete any closed-testing requirement that applies to the developer account before production access.
8. Publish through staged rollout rather than immediate full production.

## Current release blockers

The following remain blockers for broad public promotion even when automated checks pass:

- durable hosted-AI abuse protection;
- provider budget ceilings and alerts;
- real-provider smoke testing;
- journal compatibility testing in an existing browser profile;
- Fold and desktop manual testing;
- stable production-domain policy URLs;
- service-worker install/update/offline testing.
