# Publication and Google Play Release Plan

## Recommended release strategy

Publish in three stages:

1. **Production web app** — stable custom domain, privacy policy, public beta safeguards.
2. **Installable PWA** — manifest, service worker, offline shell, install testing.
3. **Android application** — package the proven web product for Google Play.

Do not begin with the Play Store. A Play listing amplifies every reliability, cost, privacy, and onboarding problem. The production web/PWA should be the canonical product first.

## Stage 1 — Production web application

### Hosting

Vercel is appropriate for the current Vite frontend and serverless Oracle endpoint.

Required:

- custom domain;
- production and preview environments;
- `ANTHROPIC_API_KEY` or `GEMINI_API_KEY`;
- environment-configurable model names;
- `PUBLIC_APP_ORIGIN`;
- error monitoring;
- analytics that avoid collecting question text by default;
- durable rate limiting or platform-level firewall rules;
- AI usage budget alerts.

### Public documents

Add public routes or static pages for:

- Privacy Policy;
- Terms / educational-use notice;
- Contact / support;
- About the text and editorial provenance;
- Safety note for ritual material.

### Public beta limits

For the first public version:

- allow static study tools without account creation;
- keep the journal local;
- cap anonymous AI consultations;
- show a clear quota state rather than silently failing;
- provide a non-AI interpretation path using the fixed commentary.

## Stage 2 — Progressive Web App

The web app should pass installability and offline checks before Android packaging.

### PWA requirements

- valid web app manifest;
- 192 × 192 and 512 × 512 raster icons before final release;
- maskable icon;
- service worker;
- offline fallback;
- HTTPS;
- responsive standalone layout;
- no critical dependency on browser chrome;
- tested launch from home screen;
- tested update behavior and cache invalidation.

### Offline behavior

Offline mode should support:

- source text;
- fixed commentary;
- Tree browsing;
- Gematria calculation;
- guided Rites;
- local journal review.

Offline mode cannot provide fresh AI interpretations. State this directly.

## Stage 3 — Android / Google Play

## Packaging choice

### Recommended: Capacitor

Use Capacitor when the app needs or may later need:

- reliable local storage/database migration;
- native share/export;
- haptics;
- status/navigation bar control;
- native text-to-speech;
- notifications or scheduled practice reminders;
- file export/import;
- in-app purchases or subscriptions;
- deeper control over Android lifecycle and offline behavior.

Liber 333 already uses haptics, audio, speech, local data, and may need export or reminders. Capacitor is therefore the preferred long-term route.

### Alternative: Trusted Web Activity

A Trusted Web Activity is suitable if the Android app will remain almost entirely the hosted PWA. It is faster to package, but the web origin and Android package must be linked with Digital Asset Links. It offers less native control and depends more directly on the hosted site.

Use a TWA only if the goal is a minimal Play Store wrapper around the web product.

## Capacitor implementation outline

1. Add Capacitor core, CLI, and Android packages.
2. Set the web output directory to `dist`.
3. Initialize an app ID such as `com.geistintheshell.liber333` after confirming ownership and final branding.
4. Build the Vite app.
5. Add the Android project.
6. Sync web assets into Android.
7. Configure status bar, splash screen, haptics, share, and file access only as needed.
8. Open Android Studio.
9. Set the required target SDK.
10. Generate a signed Android App Bundle (`.aab`).
11. Upload through Play Console internal testing.

## Play Console preparation

Prepare:

- developer account registration and verification;
- app name, short description, and full description;
- high-resolution icon;
- feature graphic;
- phone and tablet screenshots, including foldable layouts;
- privacy-policy URL;
- support email;
- content rating questionnaire;
- Data Safety form;
- ads declaration;
- target audience declaration;
- app-access instructions if any features require login;
- AI-generated content disclosure where applicable;
- testing instructions covering every major mode.

## Testing tracks

Recommended order:

1. local Android debug build;
2. Play internal testing;
3. closed testing;
4. production access application if required;
5. staged production rollout.

Newly created personal Play developer accounts may be required to keep at least 12 testers opted into a closed test for 14 continuous days before applying for production access. Confirm the requirement shown in the specific Play Console account.

## 2026 target API planning

The Android project must be kept on the current Google Play target API requirement. Starting August 31, 2026, new apps and updates are required to target Android 16 / API level 36 or higher, subject to Google's listed exceptions and extensions.

## Store-positioning recommendation

Position the app as:

**Books & Reference / Education**

Not as a guaranteed fortune-telling or supernatural-results service.

Suggested public description:

> A richly designed digital companion to Liber CCCXXXIII: read and study the chapters, explore their Tree of Life attributions, calculate English ordinal gematria, follow guided textual rites, record recurring patterns, and optionally request an AI-assisted interpretive reflection.

## Release gate

Do not submit to Google Play until all of these are true:

- Oracle runtime works with current provider models;
- rate limits and bot protection are active;
- privacy policy accurately describes AI processing and local journal storage;
- source/editorial/AI content is distinguished;
- first-run orientation is complete;
- chapter count and terminology inconsistencies are corrected;
- accessibility and low-power modes exist;
- journal export and deletion are tested;
- core flows pass on closed phone, open foldable, tablet, and a low/mid-range Android phone;
- Play assets and declarations are complete;
- a signed release bundle installs and updates correctly.
