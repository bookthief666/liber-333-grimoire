# Settings Browser QA

This branch adds deterministic browser validation for the settings, accessibility, performance, and Oracle-first navigation milestone without merging PR #38.

## Automated matrix

The Playwright workflow runs against the GitHub pull-request merge tree by default and can also accept an exact public `liber-333` Vercel Preview URL.

Projects:

- Desktop Chromium
- Desktop Firefox
- Desktop WebKit
- Fold 6 closed-screen emulation
- Fold 6 unfolded-screen emulation

The suite covers:

- Oracle-first startup on a fresh profile and when storage access is blocked;
- optional Ways of Working access from the top rail and Reading Environment settings;
- dialog focus containment, Escape closing, active state, and trigger restoration;
- narrow Fold rail scrolling through GEMATRIA, GRIMOIRE, and WAYS without document overflow;
- settings persistence and root-state application;
- system and explicit reduced-motion precedence;
- Large Text and Low Effects overflow checks;
- structural axe scans for the Ways and Settings dialogs;
- Full and Reduced Ceremony runtime and actual reveal timing;
- Single and Triad reading structure;
- independent Sound, Voice, and Haptics browser-API guards;
- manifest, service-worker registration, offline reload, and local-setting persistence;
- screenshots, traces, and videos retained when relevant.

## Exact feature base

The workflow refuses to test a tree that does not include approved PR #38 head:

`e0bc328aeeed26b1e8c3cdb9074bc59251fe65cc`

That head makes the Oracle the uninterrupted default, exposes Ways of Working as an optional top-rail dialog, preserves explicit mode URLs, and keeps the existing settings, sensory, performance, and reduced-ceremony repairs. For pull-request runs, GitHub supplies the combined feature-and-QA merge tree. For manual runs, the workflow assembles the same tree before testing.

When an external Preview URL is supplied, the operator must separately verify in Vercel that the deployment metadata is attached to that exact feature SHA.

## Physical Fold 6 review still required

Browser emulation cannot certify:

- the real hinge transition and Samsung window-management behavior;
- actual speaker output, speech quality, or vibration;
- GPU smoothness, temperature, battery impact, or dropped frames;
- Android installation and home-screen launch behavior;
- subjective visual hierarchy and ritual quality on the physical displays.

PR #38 must remain unmerged until the automated findings are resolved and the physical-device pass is reported complete.
