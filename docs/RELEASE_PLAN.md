# Publication and Google Play Release Plan

## Recommended release strategy

Publish in three stages:

1. **Canonical production web app** — one verified Vercel project, custom domain, privacy documents, and public safeguards.
2. **Installable PWA** — manifest, service worker, offline shell, installed-app testing, and update behavior.
3. **Android application** — package the proven web product for Google Play.

Do not begin with the Play Store. The production web/PWA should remain the canonical product until reliability, cost, privacy, onboarding, accessibility, and low-power behavior are proven.

## Current repository status

Completed in source and tests:

- versioned typed Oracle requests;
- server-side canonical chapter resolution and prompt reconstruction;
- rejection of browser-supplied provider prompts and system instructions;
- emergency Oracle kill switch;
- short-window and daily rate-limit logic;
- optional Upstash Redis REST counters;
- optional fail-closed durable mode;
- privacy-preserving salted counter identifiers and operational logs;
- request IDs, allowance/reset headers, and controlled quota failures;
- corpus-count and provenance clarification;
- versioned local Grimoire export and non-destructive import;
- automated `npm run check` release gate;
- PWA manifest, service worker, offline fallback, icons, and standalone metadata.

The exact PR #35 preview passed manual browser/provider/filesystem testing, including Single and Triad readings, Oracle streaming/retry/cancellation, Grimoire export/import, duplicate and invalid imports, Fold 6 closed/unfolded layouts, and installed-PWA behavior.

Not yet verified as production-complete:

- final canonical production deployment;
- one canonical Vercel project and deployment ownership;
- custom domain and `PUBLIC_APP_ORIGIN`;
- production provider keys and model access;
- Upstash credentials and live durable-counter behavior;
- strong production salt;
- Vercel Bot Protection;
- provider budget alerts or hard ceilings;
- monitoring and rollback.

The final integration merge’s automatic Vercel deployments were rejected by the account’s daily deployment quota. This is an external deployment blocker, not a repository build failure.

## Stage 1 — Production web application

### Hosting and ownership

Vercel is appropriate for the current Vite frontend and serverless Oracle endpoint.

Before broad promotion:

- select one canonical Vercel project;
- disconnect or archive duplicate Git integrations that create competing deployments;
- configure production and preview environments deliberately;
- attach the custom domain;
- set `PUBLIC_APP_ORIGIN` to the canonical HTTPS origin;
- document who owns deployment, rollback, provider keys, and emergency disablement.

### Required production environment

Verify each value in the provider dashboard and the deployed runtime:

- `ANTHROPIC_API_KEY` or `GEMINI_API_KEY`;
- current accessible model identifier;
- `PUBLIC_APP_ORIGIN`;
- `ORACLE_PUBLIC_ENABLED`;
- short and daily allowance settings;
- strong `ORACLE_RATE_LIMIT_SALT`;
- `UPSTASH_REDIS_REST_URL`;
- `UPSTASH_REDIS_REST_TOKEN`;
- `ORACLE_REQUIRE_DURABLE_RATE_LIMIT=true` where public access requires shared durable counters.

Do not mark environment setup complete from documentation or source code alone.

### Public safeguards

Repository implementation is complete for the kill switch and allowance logic. Production verification still requires:

- live Upstash counter increments and expiry;
- 429 responses and `Retry-After` behavior;
- fail-closed behavior when durable storage is required but unavailable;
- confirmation that raw client addresses are absent from Redis keys and application logs;
- Vercel Bot Protection;
- provider usage alerts and hard budget ceilings;
- operational monitoring that avoids question text;
- emergency rollback and kill-switch rehearsal.

### Public documents

Verify deployed routes for:

- Privacy Policy;
- Terms / educational-use notice;
- Contact / support;
- text and editorial provenance;
- safety note for ritual material.

The privacy disclosure must distinguish local Grimoire data from optional provider processing and explain salted, expiring abuse-prevention identifiers.

### Public beta limits

For the first public version:

- allow static study tools without account creation;
- keep the Grimoire local;
- cap anonymous Oracle consultations;
- show clear quota and unavailable states;
- retain the fixed editorial commentary as a non-AI path;
- keep a tested emergency switch available.

## Stage 2 — Progressive Web App

### Implemented foundation

- valid web app manifest;
- standalone install metadata;
- 192 × 192 and 512 × 512 icons;
- maskable Android icon support;
- service worker and offline fallback;
- HTTPS through Vercel previews;
- responsive mobile/foldable foundation;
- application shortcuts.

### Remaining PWA verification

Before Android packaging:

- verify the canonical production origin rather than only a preview;
- test install/update/cache invalidation behavior;
- verify storage persistence through app updates;
- repeat closed-phone, open-foldable, tablet, and low/mid-range Android tests;
- add settings, accessibility, and low-effects controls;
- ensure no critical flow depends on browser chrome;
- confirm the Oracle fails gracefully offline and recovers after reconnection.

### Offline behavior

Offline mode should support:

- source text;
- fixed commentary;
- Tree browsing;
- Gematria calculation;
- guided Rites;
- local Grimoire review;
- local export/import where the installed platform exposes file access.

Offline mode cannot provide fresh Oracle interpretations. State this directly.

## Stage 3 — Android / Google Play

## Packaging choice

### Recommended: Capacitor

Use Capacitor when the app needs or may later need:

- reliable storage/database migration;
- native share and file export/import;
- haptics;
- status/navigation bar control;
- native text-to-speech;
- notifications or scheduled practice reminders;
- deeper Android lifecycle and offline control;
- in-app purchases or subscriptions.

Liber 333 already uses haptics, audio, speech, local data, and file export/import, so Capacitor remains the preferred long-term route.

### Alternative: Trusted Web Activity

Use a Trusted Web Activity only for a minimal wrapper around a proven hosted PWA. It requires Digital Asset Links, offers less native control, and depends directly on the production web origin.

## Capacitor implementation outline

1. Add Capacitor core, CLI, and Android packages.
2. Set the web output directory to `dist`.
3. Confirm final branding and app ID ownership.
4. Build the Vite app.
5. Add and sync the Android project.
6. Configure only required native capabilities.
7. Open Android Studio.
8. set the current required target SDK;
9. generate and protect the signing key;
10. generate a signed Android App Bundle;
11. upload through Play Console internal testing.

## Play Console preparation

Prepare:

- developer registration and verification;
- app name and descriptions;
- high-resolution icon and feature graphic;
- closed-phone, foldable, and tablet screenshots;
- privacy-policy URL and support email;
- content rating and Data Safety declarations;
- ads and target-audience declarations;
- AI-assisted content disclosure where applicable;
- testing instructions covering every major mode.

Newly created personal Play developer accounts may be required to keep at least 12 testers opted into a closed test for 14 continuous days before applying for production access. Confirm the requirement shown in the specific Play Console account.

## Store positioning

Position the app as **Books & Reference / Education**, not as a guaranteed fortune-telling or supernatural-results service.

Suggested public description:

> A richly designed digital companion to Liber CCCXXXIII: read and study the chapters, explore their Tree of Life attributions, calculate English Ordinal Gematria, follow guided textual rites, record recurring patterns, export or restore a local Grimoire, and optionally request an AI-assisted interpretive reflection.

## Release gate

Do not begin a broad public beta or submit to Google Play until all applicable items are true:

- the final `main` tree passes `npm run check`;
- the canonical production deployment points to the intended commit;
- current provider models work in production;
- typed Oracle requests remain enforced;
- durable rate limits, strong salt, and fail-closed behavior are verified;
- Bot Protection and provider budgets are active;
- privacy, terms, provenance, safety, and support pages are deployed;
- source, editorial commentary, and Oracle interpretation remain distinguished;
- settings, reduced motion/ceremony, large text, and low-effects modes exist;
- overlay keyboard and focus behavior are tested;
- Grimoire export/import and deletion behavior are tested;
- core flows pass on a closed phone, open foldable, tablet, and low/mid-range Android phone;
- monitoring, emergency disablement, and rollback are rehearsed;
- Play assets and declarations are complete;
- a signed release bundle installs and updates correctly.

## Immediate next milestone

Implement **Settings, Accessibility, and Performance** while preserving the full ritual experience as the default and protecting deterministic readings, corpus data, Oracle prompt wording, and the Astral Void identity.