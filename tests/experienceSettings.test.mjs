import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  DEFAULT_EXPERIENCE_SETTINGS,
  EXPERIENCE_SETTINGS_KEY,
  LEGACY_SHELL_PREFERENCES_KEY,
  applyExperienceRootState,
  createExperienceSettingsRuntime,
  getExperienceRootState,
  normalizeExperienceSettings,
  persistExperienceSettings,
  readExperienceSettings,
  resolveEffectiveMotion,
  scaleCeremonyDuration,
  shouldReduceAnimationWork,
} from '../src/features/settings/experienceSettings.js';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    value(key) { return values.get(key); },
  };
}

function classListStub() {
  const values = new Set();
  return {
    toggle(name, enabled) { enabled ? values.add(name) : values.delete(name); },
    has(name) { return values.has(name); },
  };
}

test('defaults preserve the complete ritual experience', () => {
  assert.deepEqual(normalizeExperienceSettings(null), DEFAULT_EXPERIENCE_SETTINGS);
  assert.equal(DEFAULT_EXPERIENCE_SETTINGS.ceremony, 'full');
  assert.equal(DEFAULT_EXPERIENCE_SETTINGS.motion, 'full');
  assert.equal(DEFAULT_EXPERIENCE_SETTINGS.effects, 'high');
  assert.equal(DEFAULT_EXPERIENCE_SETTINGS.sound, true);
  assert.equal(DEFAULT_EXPERIENCE_SETTINGS.voice, true);
  assert.equal(DEFAULT_EXPERIENCE_SETTINGS.haptics, true);
  assert.equal(DEFAULT_EXPERIENCE_SETTINGS.textSize, 'standard');
});

test('invalid values recover independently without weakening valid preferences', () => {
  const normalized = normalizeExperienceSettings({
    ceremony: 'instant',
    motion: 'reduced',
    effects: 'minimal',
    sound: false,
    voice: 'off',
    haptics: false,
    textSize: 'huge',
    orientationSeen: true,
  });
  assert.equal(normalized.ceremony, 'full');
  assert.equal(normalized.motion, 'reduced');
  assert.equal(normalized.motionExplicit, true);
  assert.equal(normalized.effects, 'high');
  assert.equal(normalized.sound, false);
  assert.equal(normalized.voice, true);
  assert.equal(normalized.haptics, false);
  assert.equal(normalized.textSize, 'standard');
  assert.equal(normalized.orientationSeen, true);
});

test('legacy shell preferences migrate to the versioned settings schema', () => {
  const storage = memoryStorage({
    [LEGACY_SHELL_PREFERENCES_KEY]: JSON.stringify({ motion: 'system', textScale: '130' }),
  });
  const settings = readExperienceSettings(storage);
  assert.equal(settings.motion, 'full');
  assert.equal(settings.motionExplicit, false);
  assert.equal(settings.textSize, 'large');
});

test('malformed storage falls back safely and persistence writes normalized data', () => {
  const storage = memoryStorage({ [EXPERIENCE_SETTINGS_KEY]: '{bad json' });
  assert.deepEqual(readExperienceSettings(storage), DEFAULT_EXPERIENCE_SETTINGS);
  assert.equal(persistExperienceSettings(storage, { sound: false, effects: 'low' }), true);
  const written = JSON.parse(storage.value(EXPERIENCE_SETTINGS_KEY));
  assert.equal(written.sound, false);
  assert.equal(written.effects, 'low');
  assert.equal(written.ceremony, 'full');
});


test('malformed current settings recover to defaults instead of reviving stale legacy preferences', () => {
  const storage = memoryStorage({
    [EXPERIENCE_SETTINGS_KEY]: '{bad json',
    [LEGACY_SHELL_PREFERENCES_KEY]: JSON.stringify({ motion: 'reduced', textScale: '130' }),
  });
  const settings = readExperienceSettings(storage);
  assert.equal(settings.motion, 'full');
  assert.equal(settings.motionExplicit, false);
  assert.equal(settings.textSize, 'standard');
});

test('prefers-reduced-motion is honored until the user makes an explicit choice', () => {
  assert.equal(resolveEffectiveMotion({ motion: 'full', motionExplicit: false }, true), 'reduced');
  assert.equal(resolveEffectiveMotion({ motion: 'full', motionExplicit: true }, true), 'full');
  assert.equal(resolveEffectiveMotion({ motion: 'reduced', motionExplicit: true }, false), 'reduced');
});

test('animation work is reduced for Low Effects or effective Reduced Motion', () => {
  assert.equal(shouldReduceAnimationWork({ effects: 'high', motion: 'full', motionExplicit: true }, false), false);
  assert.equal(shouldReduceAnimationWork({ effects: 'low', motion: 'full', motionExplicit: true }, false), true);
  assert.equal(shouldReduceAnimationWork({ effects: 'high', motion: 'reduced', motionExplicit: true }, false), true);
  assert.equal(shouldReduceAnimationWork({ effects: 'high', motion: 'full', motionExplicit: false }, true), true);
});

test('reduced ceremony shortens long presentation intervals but preserves immediate actions', () => {
  assert.equal(scaleCeremonyDuration(7000, { ceremony: 'full' }), 7000);
  assert.equal(scaleCeremonyDuration(7000, { ceremony: 'reduced' }), 900);
  assert.equal(scaleCeremonyDuration(1000, { ceremony: 'reduced' }), 220);
  assert.equal(scaleCeremonyDuration(120, { ceremony: 'reduced' }), 120);
});

test('root state exposes all settings and applies active classes', () => {
  const settings = {
    ceremony: 'reduced',
    motion: 'reduced',
    motionExplicit: true,
    effects: 'low',
    sound: false,
    voice: false,
    haptics: false,
    textSize: 'large',
  };
  const state = getExperienceRootState(settings, false);
  assert.deepEqual(state.dataset, {
    liberCeremony: 'reduced',
    liberMotion: 'reduced',
    liberEffectiveMotion: 'reduced',
    liberEffects: 'low',
    liberSound: 'off',
    liberVoice: 'off',
    liberHaptics: 'off',
    liberTextSize: 'large',
    liberAnimationBudget: 'reduced',
  });

  const root = { dataset: {}, classList: classListStub() };
  applyExperienceRootState(root, settings, false);
  assert.equal(root.dataset.liberEffects, 'low');
  assert.equal(root.dataset.liberAnimationBudget, 'reduced');
  assert.equal(root.classList.has('liber-force-reduced-motion'), true);
  assert.equal(root.classList.has('liber-low-effects'), true);
  assert.equal(root.classList.has('liber-reduced-ceremony'), true);
  assert.equal(root.classList.has('liber-large-text'), true);
});

test('runtime survives blocked access to the localStorage property', () => {
  const runtime = createExperienceSettingsRuntime({
    windowObject: {
      get localStorage() { throw new Error('SecurityError'); },
      dispatchEvent() {},
    },
    documentObject: null,
    navigatorObject: null,
  });
  assert.equal(runtime.getSnapshot().effects, 'high');
  assert.equal(runtime.getSnapshot().sound, true);
  runtime.destroy();
});

test('Sound Off suspends known contexts and Sound On resumes eligible contexts', async () => {
  let resumes = 0;
  let suspends = 0;
  class FakeAudioContext {
    constructor() { this.state = 'running'; }
    createGain() { return {}; }
    suspend() { suspends += 1; this.state = 'suspended'; return Promise.resolve(); }
    resume() { resumes += 1; this.state = 'running'; return Promise.resolve(); }
  }
  const runtime = createExperienceSettingsRuntime({
    windowObject: { AudioContext: FakeAudioContext, dispatchEvent() {} },
    documentObject: null,
    navigatorObject: null,
    storage: memoryStorage(),
  });
  const context = new FakeAudioContext();
  context.createGain();
  runtime.setSettings({ sound: false });
  await Promise.resolve();
  assert.equal(context.state, 'suspended');
  runtime.setSettings({ sound: true });
  await Promise.resolve();
  assert.equal(context.state, 'running');
  assert.ok(suspends > 0);
  assert.ok(resumes > 0);
  runtime.destroy();
});


test('Sound Off to On waits for an asynchronous suspension and restores the context', async () => {
  let releaseSuspend;
  class DeferredAudioContext {
    constructor() { this.state = 'running'; }
    createGain() { return {}; }
    suspend() {
      return new Promise((resolve) => {
        releaseSuspend = () => { this.state = 'suspended'; resolve(); };
      });
    }
    resume() { this.state = 'running'; return Promise.resolve(); }
  }
  const runtime = createExperienceSettingsRuntime({
    windowObject: { AudioContext: DeferredAudioContext, dispatchEvent() {} },
    documentObject: null,
    navigatorObject: null,
    storage: memoryStorage(),
  });
  const context = new DeferredAudioContext();
  context.createGain();
  runtime.setSettings({ sound: false });
  runtime.setSettings({ sound: true });
  releaseSuspend();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(context.state, 'running');
  runtime.destroy();
});


test('audio sources created or started while Sound is off are discarded instead of queued', async () => {
  let starts = 0;
  let disconnects = 0;
  class FakeAudioContext {
    constructor() { this.state = 'running'; }
    createGain() { return {}; }
    createOscillator() {
      return {
        start() { starts += 1; },
        stop() {},
        disconnect() { disconnects += 1; },
      };
    }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
    resume() { this.state = 'running'; return Promise.resolve(); }
  }
  const runtime = createExperienceSettingsRuntime({
    windowObject: { AudioContext: FakeAudioContext, dispatchEvent() {} },
    documentObject: null,
    navigatorObject: null,
    storage: memoryStorage(),
  });
  const context = new FakeAudioContext();
  context.createGain();
  runtime.setSettings({ sound: false });
  const mutedSource = context.createOscillator();
  mutedSource.start();
  assert.equal(starts, 0);
  assert.equal(disconnects, 1);

  runtime.setSettings({ sound: true });
  await Promise.resolve();
  mutedSource.start();
  assert.equal(starts, 0);

  const audibleSource = context.createOscillator();
  audibleSource.start();
  assert.equal(starts, 1);
  runtime.destroy();
});

test('blocked speech schedules an utterance error so speaking state can settle', async () => {
  let cancelled = 0;
  let errorEvents = 0;
  const speechSynthesis = {
    speak() {},
    cancel() { cancelled += 1; },
  };
  const runtime = createExperienceSettingsRuntime({
    windowObject: { speechSynthesis, dispatchEvent() {} },
    documentObject: null,
    navigatorObject: null,
    storage: memoryStorage(),
  });
  runtime.setSettings({ voice: false });
  speechSynthesis.speak({ onerror() { errorEvents += 1; } });
  await Promise.resolve();
  assert.ok(cancelled > 0);
  assert.equal(errorEvents, 1);
  runtime.destroy();
});


test('reduced animation budget delays wrapper work between animation frames', () => {
  let nextNativeId = 1;
  let nextTimerId = 1;
  const callbacks = new Map();
  const timers = new Map();
  const windowObject = {
    requestAnimationFrame(callback) {
      const id = nextNativeId;
      nextNativeId += 1;
      callbacks.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id) { callbacks.delete(id); },
    setTimeout(callback, delay) {
      const id = nextTimerId;
      nextTimerId += 1;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    dispatchEvent() {},
  };
  const runtime = createExperienceSettingsRuntime({
    windowObject,
    documentObject: null,
    navigatorObject: null,
    storage: memoryStorage(),
  });
  runtime.setSettings({ effects: 'low' });

  let calls = 0;
  const callback = () => { calls += 1; };
  windowObject.requestAnimationFrame(callback);
  const first = callbacks.values().next().value;
  callbacks.clear();
  first(10);
  assert.equal(calls, 0);
  assert.equal(callbacks.size, 0);
  assert.equal(timers.size, 1);
  const timer = timers.values().next().value;
  assert.equal(timer.delay, 90);
  timers.clear();
  timer.callback();
  const retry = callbacks.values().next().value;
  callbacks.clear();
  retry(120);
  assert.equal(calls, 1);
  runtime.destroy();
});

test('settings UI preserves accessible labels and visible active state contracts', async () => {
  const source = await readFile(new URL('../src/ProductShell.jsx', import.meta.url), 'utf8');
  for (const label of ['Ceremony', 'Motion', 'Visual effects', 'Sound', 'Voice', 'Haptics', 'Text size']) {
    assert.match(source, new RegExp(`label=\\"${label}\\"`));
  }
  assert.match(source, /aria-pressed=\{value === option\.value\}/);
  assert.match(source, /aria-expanded=\{activePanel === 'settings'\}/);
  assert.match(source, /Open Ways of Working/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /event\.key === 'Escape'/);
});

test('Oracle is the uninterrupted default and Ways is an optional top-rail dialog', async () => {
  const source = await readFile(new URL('../src/ProductShell.jsx', import.meta.url), 'utf8');
  assert.match(source, /const \[activePanel, setActivePanel\] = useState\(null\)/);
  assert.doesNotMatch(source, /initialSettings\.orientationSeen \? null : 'orientation'/);
  assert.match(source, /document\.querySelector\('\.nav-rail'\)/);
  assert.match(source, /createPortal\(/);
  assert.match(source, /aria-label="Open Ways of Working guide"/);
  assert.match(source, /aria-haspopup="dialog"/);
  assert.match(source, />\s*WAYS\s*<\/button>/);
});

test('narrow navigation remains touch-scrollable after adding Ways', async () => {
  const css = await readFile(new URL('../src/experienceSettings.css', import.meta.url), 'utf8');
  assert.match(css, /\.nav-rail/);
  assert.match(css, /scrollbar-width: none/);
  assert.match(css, /overscroll-behavior-x: contain/);
  assert.match(css, /-webkit-overflow-scrolling: touch/);
  assert.match(css, /padding-right: 3\.5rem/);
});

test('low-effects stylesheet targets atmosphere, canvas, whispers, blur, and glow', async () => {
  const css = await readFile(new URL('../src/experienceSettings.css', import.meta.url), 'utf8');
  assert.match(css, /data-liber-effects='low'/);
  assert.match(css, /canvas/);
  assert.match(css, /whisper/);
  assert.match(css, /marginalia/);
  assert.match(css, /backdrop-filter/);
  assert.match(css, /text-shadow/);
});

test('reduced ceremony scales every ritual act threshold while preserving the full timeline', async () => {
  const source = await readFile(new URL('../src/liber333.jsx', import.meta.url), 'utf8');
  assert.match(source, /const ceremonyScale = duration \/ 7000/);
  assert.match(source, /communing: 2500 \* ceremonyScale/);
  assert.match(source, /receiving: 4500 \* ceremonyScale/);
  assert.match(source, /silence: 6000 \* ceremonyScale/);
  assert.match(source, /reveal: 6500 \* ceremonyScale/);
  assert.doesNotMatch(source, /if \(elapsed < 2500\) setRitualAct/);
  assert.doesNotMatch(source, /else if \(elapsed < 6500\) setRitualAct/);
});


test('reduced animation and layered dialog contracts are present in source', async () => {
  const reader = await readFile(new URL('../src/liber333.jsx', import.meta.url), 'utf8');
  const runtime = await readFile(new URL('../src/features/settings/experienceSettings.js', import.meta.url), 'utf8');
  assert.match(reader, /useReducedAnimationBudget/);
  assert.match(reader, /if \(!active \|\| reducedAnimation\)/);
  assert.match(reader, /if \(reducedAnimation\) \{/);
  assert.match(reader, /if \(!spinning \|\| reducedAnimation\)/);
  assert.match(runtime, /createOscillator/);
  assert.match(runtime, /blockedAtCreation/);
  assert.match(runtime, /\.liber-shell-backdrop \.liber-shell-dialog/);
  assert.match(runtime, /aria-labelledby/);
  assert.match(runtime, /resumeWhenSettled/);
});
