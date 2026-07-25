export const EXPERIENCE_SETTINGS_VERSION = 1;
export const EXPERIENCE_SETTINGS_KEY = 'liber333_experience_settings_v1';
export const LEGACY_SHELL_PREFERENCES_KEY = 'liber333_shell_preferences_v2';

export const DEFAULT_EXPERIENCE_SETTINGS = Object.freeze({
  version: EXPERIENCE_SETTINGS_VERSION,
  ceremony: 'full',
  motion: 'full',
  motionExplicit: false,
  effects: 'high',
  sound: true,
  voice: true,
  haptics: true,
  textSize: 'standard',
  orientationSeen: false,
});

const MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const REDUCED_ANIMATION_FRAME_INTERVAL = 100;
const ENUMS = {
  ceremony: new Set(['full', 'reduced']),
  motion: new Set(['full', 'reduced']),
  effects: new Set(['high', 'low']),
  textSize: new Set(['standard', 'large']),
};

const bool = (value, fallback) => (typeof value === 'boolean' ? value : fallback);
const enumValue = (group, value, fallback) => (ENUMS[group].has(value) ? value : fallback);

export function normalizeExperienceSettings(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const legacyMotion = source.motion === 'system' ? 'full' : source.motion;
  const legacyTextSize = Number(source.textScale) >= 115 ? 'large' : 'standard';
  const hasExplicitLegacyMotion = source.motion === 'full' || source.motion === 'reduced';

  return {
    version: EXPERIENCE_SETTINGS_VERSION,
    ceremony: enumValue('ceremony', source.ceremony, DEFAULT_EXPERIENCE_SETTINGS.ceremony),
    motion: enumValue('motion', legacyMotion, DEFAULT_EXPERIENCE_SETTINGS.motion),
    motionExplicit: bool(source.motionExplicit, hasExplicitLegacyMotion),
    effects: enumValue('effects', source.effects, DEFAULT_EXPERIENCE_SETTINGS.effects),
    sound: bool(source.sound, DEFAULT_EXPERIENCE_SETTINGS.sound),
    voice: bool(source.voice, DEFAULT_EXPERIENCE_SETTINGS.voice),
    haptics: bool(source.haptics, DEFAULT_EXPERIENCE_SETTINGS.haptics),
    textSize: enumValue('textSize', source.textSize, source.textScale ? legacyTextSize : DEFAULT_EXPERIENCE_SETTINGS.textSize),
    orientationSeen: bool(source.orientationSeen, DEFAULT_EXPERIENCE_SETTINGS.orientationSeen),
  };
}

export function resolveEffectiveMotion(settings, prefersReducedMotion = false) {
  const normalized = normalizeExperienceSettings(settings);
  if (normalized.motion === 'reduced') return 'reduced';
  if (normalized.motionExplicit) return 'full';
  return prefersReducedMotion ? 'reduced' : 'full';
}

export function shouldReduceAnimationWork(settings, prefersReducedMotion = false) {
  const normalized = normalizeExperienceSettings(settings);
  return normalized.effects === 'low'
    || resolveEffectiveMotion(normalized, prefersReducedMotion) === 'reduced';
}

export function scaleCeremonyDuration(duration, settings) {
  const milliseconds = Number.isFinite(Number(duration)) ? Math.max(0, Number(duration)) : 0;
  const normalized = normalizeExperienceSettings(settings);
  if (normalized.ceremony !== 'reduced' || milliseconds <= 160) return milliseconds;
  return Math.max(120, Math.min(900, Math.round(milliseconds * 0.22)));
}


export function readExperienceSettings(storage) {
  if (!storage?.getItem) return { ...DEFAULT_EXPERIENCE_SETTINGS };

  let currentRaw;
  try {
    currentRaw = storage.getItem(EXPERIENCE_SETTINGS_KEY);
  } catch {
    return { ...DEFAULT_EXPERIENCE_SETTINGS };
  }

  if (currentRaw !== null && currentRaw !== undefined) {
    try {
      return normalizeExperienceSettings(JSON.parse(currentRaw));
    } catch {
      return { ...DEFAULT_EXPERIENCE_SETTINGS };
    }
  }

  try {
    const legacyRaw = storage.getItem(LEGACY_SHELL_PREFERENCES_KEY);
    if (legacyRaw !== null && legacyRaw !== undefined) {
      return normalizeExperienceSettings(JSON.parse(legacyRaw));
    }
  } catch {
    // A missing or malformed legacy preference never weakens safe defaults.
  }

  return { ...DEFAULT_EXPERIENCE_SETTINGS };
}

export function persistExperienceSettings(storage, settings) {
  const normalized = normalizeExperienceSettings(settings);
  try {
    storage?.setItem?.(EXPERIENCE_SETTINGS_KEY, JSON.stringify(normalized));
    return true;
  } catch {
    return false;
  }
}

export function getExperienceRootState(settings, prefersReducedMotion = false) {
  const normalized = normalizeExperienceSettings(settings);
  const effectiveMotion = resolveEffectiveMotion(normalized, prefersReducedMotion);
  return {
    settings: normalized,
    effectiveMotion,
    dataset: {
      liberCeremony: normalized.ceremony,
      liberMotion: normalized.motion,
      liberEffectiveMotion: effectiveMotion,
      liberEffects: normalized.effects,
      liberSound: normalized.sound ? 'on' : 'off',
      liberVoice: normalized.voice ? 'on' : 'off',
      liberHaptics: normalized.haptics ? 'on' : 'off',
      liberTextSize: normalized.textSize,
      liberAnimationBudget: shouldReduceAnimationWork(normalized, prefersReducedMotion) ? 'reduced' : 'full',
    },
  };
}

export function applyExperienceRootState(root, settings, prefersReducedMotion = false) {
  if (!root) return getExperienceRootState(settings, prefersReducedMotion);
  const state = getExperienceRootState(settings, prefersReducedMotion);
  Object.entries(state.dataset).forEach(([key, value]) => {
    root.dataset[key] = value;
  });
  root.classList?.toggle('liber-force-reduced-motion', state.effectiveMotion === 'reduced');
  root.classList?.toggle('liber-force-full-motion', state.effectiveMotion === 'full' && state.settings.motionExplicit);
  root.classList?.toggle('liber-low-effects', state.settings.effects === 'low');
  root.classList?.toggle('liber-reduced-ceremony', state.settings.ceremony === 'reduced');
  root.classList?.toggle('liber-large-text', state.settings.textSize === 'large');
  return state;
}

function focusableElements(container) {
  if (!container?.querySelectorAll) return [];
  return Array.from(container.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )).filter((element) => element.getClientRects?.().length !== 0);
}

function installOverlayAccessibility(documentObject) {
  if (!documentObject?.addEventListener || typeof MutationObserver === 'undefined') return () => {};

  let currentOverlay = null;
  let previousFocus = null;
  let generatedLabelId = 0;

  const findOverlay = () => {
    if (documentObject.querySelector('.liber-shell-backdrop .liber-shell-dialog')) return null;
    const closeButtons = Array.from(documentObject.querySelectorAll('[aria-label^="Close"]'));
    for (let index = closeButtons.length - 1; index >= 0; index -= 1) {
      const button = closeButtons[index];
      const overlay = button.closest?.('.fixed.inset-0, [data-liber-overlay]');
      if (overlay && !overlay.querySelector('.liber-shell-dialog')) return { overlay, button };
    }
    return null;
  };

  const syncOverlay = () => {
    const found = findOverlay();
    const nextOverlay = found?.overlay || null;
    if (nextOverlay === currentOverlay) return;

    if (currentOverlay && previousFocus && documentObject.contains(previousFocus)) previousFocus.focus?.();
    currentOverlay = nextOverlay;
    previousFocus = currentOverlay ? documentObject.activeElement : null;

    if (currentOverlay) {
      currentOverlay.setAttribute('role', currentOverlay.getAttribute('role') || 'dialog');
      currentOverlay.setAttribute('aria-modal', 'true');

if (!currentOverlay.hasAttribute('aria-label') && !currentOverlay.hasAttribute('aria-labelledby')) {
  const heading = currentOverlay.querySelector('h1, h2, h3, [data-liber-overlay-title]');
  if (heading) {
    if (!heading.id) {
      generatedLabelId += 1;
      heading.id = `liber-overlay-title-${generatedLabelId}`;
    }
    currentOverlay.setAttribute('aria-labelledby', heading.id);
  } else {
    const closeLabel = found?.button?.getAttribute?.('aria-label')?.replace(/^Close\s*/i, '').trim();
    currentOverlay.setAttribute('aria-label', closeLabel || 'Liber 333 dialog');
  }
}
      queueMicrotask(() => {
        const items = focusableElements(currentOverlay);
        (items[0] || currentOverlay).focus?.();
      });
    }
  };

  const observer = new MutationObserver(syncOverlay);
  observer.observe(documentObject.body, { childList: true, subtree: true });
  syncOverlay();

  const onKeyDown = (event) => {
    if (event.defaultPrevented || documentObject.querySelector('.liber-shell-backdrop .liber-shell-dialog')) return;
    if (!currentOverlay) return;
    if (event.key === 'Escape') {
      const close = currentOverlay.querySelector('[aria-label^="Close"]');
      if (close) {
        event.preventDefault();
        close.click();
      }
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusableElements(currentOverlay);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && documentObject.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && documentObject.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  documentObject.addEventListener('keydown', onKeyDown);
  return () => {
    observer.disconnect();
    documentObject.removeEventListener('keydown', onKeyDown);
    if (currentOverlay && previousFocus && documentObject.contains(previousFocus)) previousFocus.focus?.();
  };
}

function installAnimationBudget(windowObject, shouldReduceWork) {
  const originalRequest = windowObject?.requestAnimationFrame?.bind(windowObject);
  const originalCancel = windowObject?.cancelAnimationFrame?.bind(windowObject);
  if (!originalRequest || !originalCancel) return { destroy() {} };

  const patchSymbol = Symbol.for('liber333.experience.animation.patch');
  if (windowObject[patchSymbol]) return { destroy() {} };

  const pending = new Map();
  const lastRunByCallback = new WeakMap();
  let nextId = 1;

  const controlledRequest = (callback) => {
    if (typeof callback !== 'function') return originalRequest(callback);
    const publicId = nextId;
    nextId += 1;
    const state = { nativeId: null, cancelled: false };

    const run = (timestamp) => {
      if (state.cancelled) return;
      const lastRun = lastRunByCallback.get(callback) || 0;
      if (shouldReduceWork() && timestamp - lastRun < REDUCED_ANIMATION_FRAME_INTERVAL) {
        state.nativeId = originalRequest(run);
        return;
      }
      pending.delete(publicId);
      lastRunByCallback.set(callback, timestamp);
      callback(timestamp);
    };

    state.nativeId = originalRequest(run);
    pending.set(publicId, state);
    return publicId;
  };

  const controlledCancel = (id) => {
    const state = pending.get(id);
    if (!state) {
      originalCancel(id);
      return;
    }
    state.cancelled = true;
    originalCancel(state.nativeId);
    pending.delete(id);
  };

  try {
    windowObject.requestAnimationFrame = controlledRequest;
    windowObject.cancelAnimationFrame = controlledCancel;
    windowObject[patchSymbol] = true;
  } catch {
    return { destroy() {} };
  }

  return {
    destroy() {
      pending.forEach((state) => {
        state.cancelled = true;
        originalCancel(state.nativeId);
      });
      pending.clear();
      if (windowObject.requestAnimationFrame === controlledRequest) windowObject.requestAnimationFrame = originalRequest;
      if (windowObject.cancelAnimationFrame === controlledCancel) windowObject.cancelAnimationFrame = originalCancel;
      try { delete windowObject[patchSymbol]; } catch { /* non-critical */ }
    },
  };
}

function installSensoryGuards(windowObject, navigatorObject, getSettings) {
  const cleanups = [];
const contexts = new Set();
const pendingSuspends = new WeakMap();
const patchSymbol = Symbol.for('liber333.experience.audio.patch');
let previousSound = Boolean(getSettings().sound);

const resumeWhenSettled = (context) => {
  const resumeIfNeeded = () => {
    if (getSettings().sound && context?.state !== 'closed' && context?.state !== 'running') {
      return context?.resume?.().catch?.(() => {});
    }
    return undefined;
  };
  const pending = pendingSuspends.get(context);
  if (pending) pending.finally(resumeIfNeeded);
  else resumeIfNeeded();
};

const suspendContext = (context) => {
  if (!context || context.state === 'closed') return Promise.resolve();
  const existing = pendingSuspends.get(context);
  if (existing) return existing;
  let pending;
  try {
    pending = Promise.resolve(context.suspend?.()).catch(() => {});
  } catch {
    pending = Promise.resolve();
  }
  pendingSuspends.set(context, pending);
  pending.finally(() => {
    if (pendingSuspends.get(context) === pending) pendingSuspends.delete(context);
    if (getSettings().sound) resumeWhenSettled(context);
  });
  return pending;
};

  for (const name of ['AudioContext', 'webkitAudioContext']) {
    const Constructor = windowObject?.[name];
    const prototype = Constructor?.prototype;
    if (!prototype || prototype[patchSymbol]) continue;

    const originalResume = prototype.resume;
    const originalCreateGain = prototype.createGain;
    const resume = function controlledResume(...args) {
      contexts.add(this);
      if (!getSettings().sound) return Promise.resolve();
      return originalResume?.apply(this, args);
    };
    const createGain = function controlledCreateGain(...args) {
      contexts.add(this);
      const node = originalCreateGain.apply(this, args);
      if (!getSettings().sound && this?.state !== 'closed') {
        queueMicrotask(() => suspendContext(this));
      }
      return node;
    };

    try {
      prototype.resume = resume;
      prototype.createGain = createGain;
      prototype[patchSymbol] = true;
      cleanups.push(() => {
        if (prototype.resume === resume) prototype.resume = originalResume;
        if (prototype.createGain === createGain) prototype.createGain = originalCreateGain;
        try { delete prototype[patchSymbol]; } catch { /* non-critical */ }
      });
    } catch {
      // Some browser prototypes are non-writable. The root setting still communicates state.
    }
  }

  const synth = windowObject?.speechSynthesis;
  if (synth?.speak) {
    const originalSpeak = synth.speak.bind(synth);
    const guardedSpeak = (utterance) => {
      if (!getSettings().voice) {
        synth.cancel?.();
        queueMicrotask(() => {
          try {
            utterance?.onerror?.({ error: 'canceled', type: 'error', target: utterance });
          } catch {
            // An utterance callback must never compromise the settings runtime.
          }
        });
        return undefined;
      }
      return originalSpeak(utterance);
    };
    try {
      synth.speak = guardedSpeak;
      cleanups.push(() => { if (synth.speak === guardedSpeak) synth.speak = originalSpeak; });
    } catch {
      // Speech synthesis may expose read-only methods.
    }
  }

  const originalVibrate = navigatorObject?.vibrate?.bind(navigatorObject);
  if (originalVibrate) {
    const guardedVibrate = (pattern) => (getSettings().haptics ? originalVibrate(pattern) : false);
    try {
      Object.defineProperty(navigatorObject, 'vibrate', { configurable: true, value: guardedVibrate });
      cleanups.push(() => {
        try { Object.defineProperty(navigatorObject, 'vibrate', { configurable: true, value: originalVibrate }); } catch { /* non-critical */ }
      });
    } catch {
      // Navigator methods may not be configurable.
    }
  }

  return {

onSettingsChanged(settings) {
  if (!settings.sound) {
    contexts.forEach((context) => suspendContext(context));
  } else if (!previousSound) {
    contexts.forEach((context) => resumeWhenSettled(context));
  }
  previousSound = Boolean(settings.sound);
  if (!settings.voice) synth?.cancel?.();
},
    destroy() {
      cleanups.reverse().forEach((cleanup) => cleanup());
    },
  };
}

export function createExperienceSettingsRuntime({
  windowObject = typeof window !== 'undefined' ? window : null,
  documentObject = typeof document !== 'undefined' ? document : null,
  navigatorObject = typeof navigator !== 'undefined' ? navigator : null,
  storage,
} = {}) {
  let resolvedStorage = storage;
  if (resolvedStorage === undefined) {
    try {
      resolvedStorage = windowObject?.localStorage || null;
    } catch {
      resolvedStorage = null;
    }
  }

  let settings = readExperienceSettings(resolvedStorage);
  const listeners = new Set();
  const media = windowObject?.matchMedia?.(MOTION_QUERY) || null;
  let prefersReducedMotion = Boolean(media?.matches);
  const effectiveMotion = () => resolveEffectiveMotion(settings, prefersReducedMotion);
  const animationBudget = installAnimationBudget(
    windowObject,
    () => settings.effects === 'low' || effectiveMotion() === 'reduced',
  );
  const sensory = installSensoryGuards(windowObject, navigatorObject, () => settings);
  const removeOverlayAccessibility = installOverlayAccessibility(documentObject);

  const snapshot = () => ({
    ...settings,
    effectiveMotion: effectiveMotion(),
    hapticsSupported: Boolean(navigatorObject?.vibrate),
  });

  const apply = ({ persist = true } = {}) => {
    const rootState = applyExperienceRootState(documentObject?.documentElement, settings, prefersReducedMotion);
    if (persist) persistExperienceSettings(resolvedStorage, settings);
    sensory.onSettingsChanged(settings);
    const detail = snapshot();
    listeners.forEach((listener) => listener(detail));
    try {
      windowObject?.dispatchEvent?.(new CustomEvent('liber333:settings-changed', { detail }));
    } catch {
      // CustomEvent is not available in every test environment.
    }
    return rootState;
  };

  const setSettings = (patch) => {
    const nextPatch = typeof patch === 'function' ? patch(snapshot()) : patch;
    const merged = { ...settings, ...(nextPatch || {}) };
    if (nextPatch && Object.prototype.hasOwnProperty.call(nextPatch, 'motion')) merged.motionExplicit = true;
    settings = normalizeExperienceSettings(merged);
    apply();
    return snapshot();
  };

  const onMediaChange = (event) => {
    prefersReducedMotion = Boolean(event.matches);
    apply({ persist: false });
  };
  media?.addEventListener?.('change', onMediaChange);
  media?.addListener?.(onMediaChange);

  apply({ persist: false });

  const runtime = {
    getSnapshot: snapshot,
    setSettings,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    markOrientationSeen() {
      return setSettings({ orientationSeen: true });
    },
    resetOrientation() {
      return setSettings({ orientationSeen: false });
    },
    ceremonyDuration(duration) {
      return scaleCeremonyDuration(duration, settings);
    },
    destroy() {
      media?.removeEventListener?.('change', onMediaChange);
      media?.removeListener?.(onMediaChange);
      removeOverlayAccessibility();
      animationBudget.destroy();
      sensory.destroy();
      listeners.clear();
    },
  };

  if (windowObject) windowObject.__LIBER333_EXPERIENCE__ = runtime;
  return runtime;
}

let browserRuntime = null;

export function initializeExperienceSettingsRuntime() {
  if (browserRuntime) return browserRuntime;
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  browserRuntime = createExperienceSettingsRuntime();
  return browserRuntime;
}

export function getExperienceSettingsRuntime() {
  return browserRuntime || initializeExperienceSettingsRuntime();
}
