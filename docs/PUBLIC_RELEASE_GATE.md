# Public Release Gate

This checklist defines the minimum bar before promoting Liber 333 beyond a controlled preview.

## Automated gate

Every pull request must pass:

```bash
npm ci
npm run build
npm run validate:release
```

The release validator checks that the manifest, service worker, offline fallback, privacy policy, terms, support page, and application icon are present and structurally readable. It also rejects known wildcard-CORS patterns in provider routes that exist in the repository.

## Required manual verification

### Core product

- Oracle Single and Triad flows complete without navigation regressions.
- Source text remains usable when the AI provider is unavailable.
- Tree, Rites, Gematria, and Grimoire operate without an AI request.
- Existing local journal data still loads.
- Clearing journal data behaves as described.

### Devices

- Android phone portrait.
- Fold closed portrait.
- Fold open portrait and landscape.
- Tablet.
- Desktop keyboard and pointer navigation.
- Installed PWA launch and update.

### Privacy and transparency

- Privacy, Terms, and Support pages resolve on the production domain.
- The Oracle clearly identifies AI-generated reflection.
- Local-storage behavior is explained.
- No private API key is bundled into client code.
- Provider budgets, rate limits, and abuse controls are active.
- Hosting and provider log-retention settings have been reviewed.

### PWA assets

Before final public promotion, add and verify:

- 192x192 PNG icon;
- 512x512 PNG icon;
- maskable icon safe zone;
- Apple touch icon;
- install prompt behavior;
- offline fallback;
- service-worker update behavior.

The current SVG icon is suitable for previews but should not be the only production icon.

## Android / Google Play gate

Do not package the preview blindly. Complete the stable web release first, then:

1. Add Capacitor with an explicit Android application ID.
2. Configure release signing and secure key backup.
3. Use the production domain for Privacy Policy and Support URLs.
4. Prepare phone, tablet, and foldable screenshots.
5. Complete Data Safety and content-rating declarations from observed behavior, not assumptions.
6. Verify deep links, haptics, speech, audio, local storage, export/import, and app updates in an internal test track.
7. Complete any closed-testing requirement that applies to the developer account before production access.

## Current non-blocking warning

`npm run validate:release` currently warns when 192x192 and 512x512 PNG icons are absent. That warning becomes a release blocker before store submission or final PWA promotion.
