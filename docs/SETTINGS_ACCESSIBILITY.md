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
- legacy orientation-guidance completion state

The runtime validates every field independently. Malformed data recovers to full-experience defaults. Existing `liber333_shell_preferences_v2` motion and text-scale preferences migrate only when the current versioned key is absent; malformed current data never revives stale legacy preferences.

## Motion precedence

A stored explicit Motion choice takes precedence. Until the user chooses Full or Reduced, `prefers-reduced-motion: reduce` supplies the effective motion state without replacing the stored default. The visible segmented control follows the effective state until the user chooses an explicit override.

Reduced Motion disables nonessential CSS motion, immediately completes timer-driven GlitchText and TypewriterText, and holds AnimatedSigil at a stable frame rather than running its 16 ms update interval. It does not modify reading calculation, provider-request timing, or journal timestamps.

## Ceremony

Full preserves the seven-second invocation, communing, receiving, silence, and reveal sequence.

Reduced routes the same protected ritual sequence through the settings runtime and proportionally shortens every act boundary. The selected chapter or triad, Gematria, correspondences, source text, and Oracle request remain unchanged.

## Visual Effects

High preserves the complete atmosphere.

Low reduces presentation intensity and simultaneous compositor load by:

- reducing canvas and WebGL layer opacity;
- suppressing ambient whispers and marginalia;
- reducing particle and decorative fixed-layer intensity;
- removing nonessential backdrop blur;
- reducing glow and expensive shadow layers;
- simplifying the shell starfield;
- applying a reduced runtime animation budget to repeated frame work;
- sleeping for the remaining reduced-frame interval before requesting another paint frame;
- suppressing timer-driven text and sigil animation.

Low Effects is not a redesign and does not remove functional state indicators.

## Sensory controls

- Sound Off suspends known Web Audio contexts, including contexts initialized after Sound was disabled, and prevents disabled contexts from being resumed through application controls.
- Sound Off also discards oscillator and buffer-source cues created or started while muted, preventing frozen audio-timeline events from playing later when the context resumes.
- Sound On resumes eligible known contexts after an Off state, including recovery after an asynchronous suspension settles, without changing the application-level ambient gain choice.
- Voice Off cancels active speech, suppresses subsequent browser speech-synthesis output, and settles blocked utterances without leaving a false speaking state.
- Haptics Off suppresses vibration calls where the browser exposes the Vibration API.

These settings are independent. Device/browser capability remains authoritative.

## Oracle-first startup and Ways of Working

The Book of Lies Oracle is always the default application surface unless a valid explicit mode is requested through the existing navigation URL. Ways of Working is an optional dialog rather than a startup interruption.

The guide can be opened from `WAYS` in the top mode rail or from Reading Environment settings. Opening or closing it does not change the Oracle, Rites, Tree, or Gematria surface underneath it. Selecting one of its intention cards deliberately navigates to that feature.

The legacy orientation completion field remains readable for compatibility with existing local settings, but it no longer controls first render or causes a fresh-profile modal.

On narrow screens, the mode rail remains horizontally touch-scrollable, hides the native scrollbar, preserves momentum scrolling, and uses a slightly tighter gap and tracking so the additional guide control remains discoverable without shrinking unfolded or desktop typography.

## Keyboard and focus behavior

The shell help, Ways of Working, and settings dialogs provide:

- dialog semantics and accessible names;
- initial focus;
- Escape dismissal;
- Tab/Shift+Tab focus containment;
- restoration of focus to the invoking control.

The runtime also augments existing full-screen application overlays that expose a close action, including the Grimoire, without altering their feature logic. Augmented dialogs receive an accessible name from a visible heading or an explicit fallback label. When a shell dialog is opened over the Grimoire, the foreground shell dialog alone owns the first Escape action.

Glyph controls retain their visual symbols while exposing labels, `aria-expanded`, `aria-pressed`, visible active state, and focus-visible outlines.

## Completed review matrix

The final browser/device review covered:

1. Oracle visible immediately on a fresh profile with no guide interruption.
2. Legacy motion/text preference migration and malformed-current-data recovery.
3. Persistence after reload and installed-PWA restart.
4. System reduced-motion behavior before an explicit choice.
5. Explicit Full overriding system reduction and explicit Reduced overriding system Full.
6. Reduced Ceremony completing the same Single and Triad flows with shorter proportional pacing.
7. Low Effects retaining legibility and functional state while reducing frame, timer, and atmosphere work.
8. Sound, Voice, and Haptics switching independently, including pre-initialization mute, asynchronous Sound Off-to-On recovery, and muted cue disposal.
9. Standard and Large text on Fold 6 closed and unfolded layouts.
10. Escape, focus containment, accessible naming, and focus restoration in Help, Ways of Working, Settings, and Grimoire.
11. Opening Ways of Working from the top rail and Settings without changing the underlying mode or local data.
12. Scrolling the closed-Fold mode rail fully through GEMATRIA, GRIMOIRE, and WAYS.
13. Installed-PWA persistence and offline local surfaces.
