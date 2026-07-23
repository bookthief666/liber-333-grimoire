# Contextual Guidance and Integration Shell

## Purpose

This milestone adds optional, mode-aware guidance without modifying the Liber 333 corpus, chapter-selection mathematics, AI prompts, journal schema, ritual data, Tree mapping, or the established Astral Void components.

The shell is mounted around the current application from `src/main.jsx`.

## Design correction after device review

The first implementation introduced a large first-run “Ways of Working” screen. Fold 6 review showed that this made the explanatory shell more dominant than the grimoire itself, interrupted the original mysterious entrance, and visually flattened the Astral Void.

That entrance has been removed.

Liber 333 now opens directly into its original Book experience. Guidance is available only when the user requests it through a small, mode-aware sigil.

## What it adds

### Optional contextual guidance

A small symbol near the active chamber tracks the top-level mode:

- Oracle — `☉?`
- Rites — `✦?`
- Tree — `☷?`
- Gematria — `∴?`
- Grimoire — `☥?`

Selecting the symbol explains:

- what the chamber does;
- how its output is formed;
- one practical use;
- source, editorial, calculated, and AI boundaries;
- data behavior;
- useful next actions.

The explanation is never shown automatically.

### Reading environment

A smaller secondary settings symbol controls presentation only:

- System, Full, or Reduced motion;
- 90%, 100%, 115%, or 130% text scale;
- PWA installation when the browser exposes an install prompt.

Preferences are stored locally under `liber333_shell_preferences_v2`.

The former global Full/Balanced/Low-power canvas-opacity controls were removed. They visually dimmed or hid the existing animated canvases without actually coordinating their render loops. All existing Astral Void animation systems now remain fully visible by default. Reduced motion occurs only when explicitly selected or requested by the operating system.

### Astral Void reinforcement

The shell adds a subtle drifting stellar veil so sparse application phases still retain visible points of light over the black field.

This layer augments rather than replaces:

- the WebGL Abyss shader;
- animated particles and constellation lines;
- zodiac and planetary rings;
- evolving sigils;
- the Babalon star;
- marginalia;
- ambient whispers;
- ritual transitions and shockwaves.

No existing animation component was removed or disabled in this correction.

### Tailwind 4 control reset

The Fold screenshots exposed browser-default gray button chrome around the navigation, sound control, spread selector, and return actions. The project uses Tailwind CSS 4 but was still importing the framework with the older directive syntax.

`src/index.css` now uses `@import "tailwindcss";` and explicitly removes native button appearance. This restores the intended transparent floating controls and allows component-specific active and focus treatments to remain visible.

### PWA shortcuts

`src/deepLinkBridge.js` resolves manifest shortcuts such as `?mode=gematria` after the React app mounts.

## Compatibility boundary

The core application currently keeps navigation state inside the large `src/liber333.jsx` module and does not expose a routing or mode-control API. To avoid expanding that monolith in this milestone, the shell uses an isolated compatibility bridge that activates the existing visible navigation buttons.

This is temporary and should be replaced by shared React navigation state.

The future interface should preferably use a shared context or reducer consumed by both the core application and the shell, with actions such as:

```js
setMode('tree');
openJournal();
openOracleInput();
```

## Protected systems

This milestone does not modify:

- `src/liber333.jsx`;
- `src/api.js`;
- `api/oracle.js`;
- chapter data or commentary;
- Gematria or correspondence calculations;
- divination indexing;
- Tree placements;
- ritual scripts;
- journal records.

## Required review

Test on:

- narrow Android phone;
- Fold closed width;
- Fold open/tablet width;
- desktop keyboard navigation;
- reduced-motion operating-system setting;
- installed PWA shortcut launch.

Confirm that:

- the original Book entrance appears immediately;
- the small help symbol changes with the active mode;
- guidance never opens without a user action;
- settings remain visually secondary;
- all original animated layers remain visible;
- the additional star veil remains subtle and does not reduce text contrast;
- native gray button backgrounds are absent;
- settings persist after refresh;
- dialog focus remains contained and Escape closes the dialog;
- zoom remains available;
- contextual symbols do not cover essential actions.

## Next architectural milestone

After this branch is visually validated, extract the application into explicit modules:

1. `data/liber333.js`
2. `features/oracle/`
3. `features/rites/`
4. `features/tree/`
5. `features/gematria/`
6. `features/journal/`
7. `contexts/GrimoireNavigationContext.jsx`

Only after that extraction should the DOM compatibility bridge be removed and deeper cross-tool actions—such as opening the exact Tree location of the current revelation—be implemented.
