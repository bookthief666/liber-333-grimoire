# Orientation and Integration Shell

## Purpose

This milestone adds product orientation and contextual guidance without modifying the Liber 333 corpus, chapter-selection mathematics, AI prompts, journal schema, ritual data, Tree mapping, or the existing Astral Void components.

The shell is mounted around the current application from `src/main.jsx`.

## What it adds

### First-run Ways of Working

A new user chooses one of five practical entrances:

- Ask — Oracle
- Study — Tree
- Practice — Rites
- Calculate — Gematria
- Review — Grimoire

The choice changes only the initial destination. It does not change calculations, content, or saved data.

### Contextual guidance

A persistent help control tracks the active top-level mode and explains:

- the tool’s purpose;
- when to use it;
- how its output is formed;
- one practical application;
- source and interpretation boundaries;
- data behavior;
- useful next actions.

### Reading environment

The settings sheet currently controls presentation only:

- Full, Balanced, or Low-power effects;
- System, Full, or Reduced motion;
- 90%, 100%, 115%, or 130% text scale;
- reopening the first-run orientation.

These settings are stored locally under `liber333_shell_preferences_v1`.

### PWA installation and shortcuts

The shell captures the browser install event when supported. `src/deepLinkBridge.js` resolves manifest shortcuts such as `?mode=gematria` after the React app mounts.

## Compatibility boundary

The core application currently keeps its navigation state inside the large `src/liber333.jsx` module and does not expose a routing or mode-control API. To avoid expanding that monolith in this milestone, the shell uses a deliberately isolated compatibility bridge that activates the existing visible navigation buttons.

This is temporary and should be replaced after the core application is decomposed.

The future interface should resemble:

```js
window.dispatchEvent(
  new CustomEvent('liber333:navigate', {
    detail: { mode: 'tree' },
  }),
);
```

Or, preferably, mode should move into a shared React context/router consumed by both the core application and the product shell.

## Protected systems

This milestone does not modify:

- `src/liber333.jsx`;
- `src/api.js`;
- `api/oracle.js`;
- chapter data or commentary;
- gematria or correspondence calculations;
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
- low-power effects mode;
- installed PWA shortcut launch.

Confirm that:

- the first-run screen appears once per browser profile;
- every path activates the intended existing mode;
- Ask enters the Oracle consultation screen;
- the help panel follows direct clicks on the existing navigation;
- settings persist after refresh;
- dialog focus remains contained and Escape closes the dialog;
- zoom remains available;
- the utility rail does not cover essential actions.

## Next architectural milestone

After this branch is validated, extract the application into explicit modules:

1. `data/liber333.js`
2. `features/oracle/`
3. `features/rites/`
4. `features/tree/`
5. `features/gematria/`
6. `features/journal/`
7. `contexts/GrimoireNavigationContext.jsx`

Only after that extraction should the DOM compatibility bridge be removed and deeper cross-tool actions—such as opening the exact Tree location of the current revelation—be implemented.
