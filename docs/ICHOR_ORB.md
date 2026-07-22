# Ichor Orb — Landing Centerpiece

## Purpose

The Ichor Orb replaces only the original landing-screen combination of `ZodiacRing` and the large `AnimatedSigil` instance.

It does not replace the evolving sigil system throughout the rest of Liber 333. The existing sigil remains appropriate for:

- question formation;
- ritual transition;
- chapter revelation;
- journal evolution;
- milestone symbolism.

The orb is the threshold object of the Book, not a universal component pasted into every chamber.

## Visual contract

The orb should read as a living sacred substance:

- black water;
- obsidian plasma;
- abyssal ichor;
- depth beneath a reflective membrane;
- restrained teal, crimson, silver, and gold emerging from darkness.

It should not read as:

- a bright game pickup;
- a generic glass sphere;
- a loading spinner;
- a neon dashboard widget;
- a direct copy of any Returnal asset.

The intended relationship is one of mood and material sensation: alien, liquid, divine, and dangerous, while remaining native to the Astral Void identity.

## Verified Thelemic emblem

The orb now uses a local vector mask at:

```text
src/assets/crowley-unicursal-hexagram.svg
```

Its geometry is based on the public-domain Wikimedia Commons file **Crowley unicursal hexagram.svg**, described there as Aleister Crowley's unicursal hexagram. The Commons file history also records the corrected orientation: the central flower has one petal pointing upward.

The local asset preserves:

- the elongated Crowley form;
- one continuous six-point path rather than two equilateral triangles;
- the unequal vertical and lateral proportions;
- the central five-petaled flower;
- one upward-pointing petal;
- enough view-box padding to preserve the sharp outer points when used as a mask.

The vector is stored locally and is not fetched from Wikimedia at runtime.

## Submerged rendering

The emblem is not displayed as a crisp image above the orb.

It is used as a CSS mask over an antique-gold radial field and placed between:

1. the WebGL liquid body;
2. a moving dark surface-absorption veil;
3. the softened external reflection layer.

At rest, the effective visibility remains low and portions of the symbol are obscured by the dark surface veil. On touch, the veil briefly parts and the five-petaled center and continuous hexagram become more legible before sinking back into the ichor.

## Interaction

Touching or clicking the orb:

1. places the disturbance at the actual contact point;
2. sends a decaying wave across the apparent liquid surface;
3. briefly increases the internal crimson current;
4. reveals the submerged unicursal hexagram more strongly;
5. creates a small light core at the point of contact;
6. requests a restrained haptic pulse when supported.

The emblem reveal lasts approximately 2.4 seconds and then returns to its low idle visibility.

The orb does not begin an Oracle consultation. The existing `BEGIN CONSULTATION` action remains the explicit functional command.

Keyboard users can disturb the center of the orb with Enter or Space.

## Rendering approach

`src/IchorOrb.jsx` uses a dedicated WebGL 1 fragment shader without introducing Three.js or React Three Fiber.

Reasons:

- the project already contains custom WebGL and canvas systems;
- no new runtime dependency is needed;
- the shader remains isolated from the monolithic core file;
- device-pixel ratio is capped at 1.5 for mobile/foldable performance;
- the canvas is square and small rather than full-screen;
- a CSS fallback remains available when WebGL compilation fails.

The shader includes:

- domain-warped FBM currents;
- spherical normal approximation;
- restrained Fresnel edge light;
- softened, noise-broken liquid highlights;
- local touch ripples;
- a transparent halo outside the sphere;
- predominantly black/indigo material with narrow teal and sanguine ribbons.

The previous shader-drawn ring and ordinary overlapping triangles were removed.

## Performance and resilience

The implementation retains:

- WebGL 1 compatibility;
- a component-sized canvas;
- device-pixel-ratio ceiling of 1.5;
- ResizeObserver resizing with window-resize fallback;
- transparent framebuffer clearing every frame;
- requestAnimationFrame cleanup;
- reduced-motion behavior;
- a local CSS fallback using the same unicursal vector mask;
- graceful fallback if the WebGL context is lost.

## Integration boundary

The core `src/liber333.jsx` file does not currently expose the landing phase or a replaceable centerpiece slot.

`src/LandingIchorPortal.jsx` therefore uses a narrowly scoped compatibility mount:

- it finds the original `The Book of Lies` landing heading;
- it identifies only the immediate large circular centerpiece preceding that heading;
- it hides that one legacy landing instance;
- it inserts the Ichor Orb into the same document position;
- it removes the mount when the landing screen disappears.

This compatibility layer must be replaced with an explicit component slot when the navigation and feature-boundary extraction in issue #3 reaches the landing screen.

## Protected behavior

This milestone does not change:

- Oracle chapter selection;
- Gematria;
- AI prompts or endpoint behavior;
- the corpus or commentary;
- Tree mappings;
- guided rites;
- journal data;
- the original starfield, Abyss shader, particles, marginalia, Babalon star, or sound systems;
- the smaller `AnimatedSigil` instances used after entry.

## Review checklist

Verify on Fold closed, Fold open, desktop, and a reduced-motion setting:

- the old large spinning geometry is absent only on the initial Book screen;
- the orb remains centered and does not crowd the title;
- the internal symbol is unmistakably the unicursal hexagram;
- the symbol does not resemble a normal Star of David;
- the flower has one petal pointing upward;
- the symbol remains subdued at rest and emerges after touch;
- black remains the dominant material color;
- the highlight feels wet and soft rather than plastic;
- internal movement appears ribbon-like rather than blocky;
- touch ripples originate at the actual tap position;
- taps do not trigger consultation;
- the original `BEGIN CONSULTATION` button remains visible and functional;
- the orb disappears when consultation begins;
- returning/reloading restores the orb cleanly;
- no duplicated orb appears under React Strict Mode;
- the CSS fallback is legible if WebGL is unavailable;
- reduced motion leaves a living but nearly still object;
- frame rate remains acceptable on the Fold 6.
