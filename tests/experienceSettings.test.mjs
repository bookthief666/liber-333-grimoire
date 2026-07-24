import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  DEFAULT_EXPERIENCE_SETTINGS,
  EXPERIENCE_SETTINGS_KEY,
  LEGACY_SHELL_PREFERENCES_KEY,
  applyExperienceRootState,
  getExperienceRootState,
  normalizeExperienceSettings,
  persistExperienceSettings,
  readExperienceSettings,
  resolveEffectiveMotion,
  scaleCeremonyDuration,
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

test('prefers-reduced-motion is honored until the user makes an explicit choice', () => {
  assert.equal(resolveEffectiveMotion({ motion: 'full', motionExplicit: false }, true), 'reduced');
  assert.equal(resolveEffectiveMotion({ motion: 'full', motionExplicit: true }, true), 'full');
  assert.equal(resolveEffectiveMotion({ motion: 'reduced', motionExplicit: true }, false), 'reduced');
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
  });

  const root = { dataset: {}, classList: classListStub() };
  applyExperienceRootState(root, settings, false);
  assert.equal(root.dataset.liberEffects, 'low');
  assert.equal(root.classList.has('liber-force-reduced-motion'), true);
  assert.equal(root.classList.has('liber-low-effects'), true);
  assert.equal(root.classList.has('liber-reduced-ceremony'), true);
  assert.equal(root.classList.has('liber-large-text'), true);
});

test('settings UI preserves accessible labels and visible active state contracts', async () => {
  const source = await readFile(new URL('../src/ProductShell.jsx', import.meta.url), 'utf8');
  for (const label of ['Ceremony', 'Motion', 'Visual effects', 'Sound', 'Voice', 'Haptics', 'Text size']) {
    assert.match(source, new RegExp(`label=\\"${label}\\"`));
  }
  assert.match(source, /aria-pressed=\{value === option\.value\}/);
  assert.match(source, /aria-expanded=\{activePanel === 'settings'\}/);
  assert.match(source, /Reset orientation guidance/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /event\.key === 'Escape'/);
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
