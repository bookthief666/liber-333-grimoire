# Settings, Accessibility, and Performance

## Design rule

The complete Astral Void ritual experience remains the default. Accessibility and performance controls alter pacing, movement, sensory output, text scale, or atmospheric intensity without changing the Liber 333 corpus, deterministic chapter selection, Oracle wording, provider behavior, or Grimoire data.

## Persistent settings

Settings use the versioned local key `liber333_experience_settings_v1` and currently include:

- Ceremony: `full` or `reduced`
- Motion: `full` or `reduced`
- Visual Effects: `high` or `low`
- Sound: on or off
- Voice: on or off
- Haptics: on or off when supported
- Text Size: `standard` or `large`
- orientation-guidance completion state

The runtime validates every field independently. Malformed data recovers to full-experience defaults. Existing `liber333_shell_preferences_v2` motion and text-scale preferences migrate on first read.

## Motion precedence

A stored explicit Motion choice takes precedence. Until the user chooses Full or Reduced, `prefers-reduced-motion: reduce` supplies the effective motion state without replacing the stored default. The visible segmented control follows the effective state until the user chooses an explicit override.

Reduced Motion disables nonessential animation and transition duration through the root accessibility state. It does not modify reading calculation, timers used by provider requests, or journal timestamps.

## Ceremony

Full preserves the seven-second invocation, communing, receiving, silence, and reveal sequence.

Reduced routes the same protected ritual sequence through the settings runtime and shortens its total presentation interval. The selected chapter or triad, Gematria, correspondences, source text, and Oracle request remain unchanged.

## Visual Effects

High preserves the complete atmosphere.

Low reduces presentation intensity and simultaneous compositor load by:

- reducing canvas and WebGL layer opacity;
- suppressing ambient whispers and marginalia;
- reducing particle and decorative fixed-layer intensity;
- removing nonessential backdrop blur;
- reducing glow and expensive shadow layers;
- simplifying the shell starfield.

Low Effects is not a redesign and does not remove functional state indicators.

## Sensory controls

- Sound Off suspends known Web Audio contexts, including contexts initialized after Sound was disabled, and prevents disabled contexts from being resumed through application controls.
- Voice Off cancels active speech and suppresses subsequent browser speech-synthesis output.
- Haptics Off suppresses vibration calls where the browser exposes the Vibration API.

These settings are independent. Device/browser capability remains authoritative.

## Orientation guidance

The first local launch opens a compact Ways of Working panel. Its completion state is local and can be reset from Reading Environment settings. Resetting guidance does not clear journal entries, reading totals, backups, or any other settings.

## Keyboard and focus behavior

The shell help, orientation, and settings dialogs provide:

- dialog semantics and accessible names;
- initial focus;
- Escape dismissal;
- Tab/Shift+Tab focus containment;
- restoration of focus to the invoking control.

The runtime also augments existing full-screen application overlays that expose a close action, including the Grimoire, without altering their feature logic.

Glyph controls retain their visual symbols while exposing labels, `aria-expanded`, `aria-pressed`, visible active state, and focus-visible outlines.

## Manual review matrix

Verify before merge:

1. Full defaults on a fresh profile.
2. Legacy motion/text preference migration.
3. Persistence after reload and installed-PWA restart.
4. System reduced-motion behavior before an explicit choice.
5. Explicit Full overriding system reduction and explicit Reduced overriding system Full.
6. Reduced Ceremony completes the same Single and Triad flows with shorter pacing.
7. Low Effects retains legibility and functional state while reducing atmosphere.
8. Sound, Voice, and Haptics switch independently, including Sound Off before audio initialization.
9. Standard and Large text on Fold 6 closed and unfolded layouts.
10. Escape, focus containment, and focus restoration in Help, Orientation, Settings, and Grimoire.
11. Reset orientation guidance without journal or settings loss.
12. Installed-PWA persistence and offline local surfaces.
