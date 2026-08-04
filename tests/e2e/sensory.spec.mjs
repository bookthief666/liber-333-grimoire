import { expect, test } from '@playwright/test';
import {
  closeDialogWithEscape,
  dismissOrientation,
  openSettings,
  selectSetting,
  visitApp,
} from './helpers.mjs';

test('Sound, Voice, and Haptics remain independent and suppress their browser APIs', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Sensory API guards are sampled once in Chromium.');

  await page.addInitScript(() => {
    window.__LIBER_QA_SENSORY__ = {
      spoken: 0,
      cancelled: 0,
      vibrations: [],
      audioResumes: 0,
      audioSuspends: 0,
    };

    class FakeAudioContext {
      constructor() { this.state = 'running'; }
      createGain() { return {}; }
      resume() {
        window.__LIBER_QA_SENSORY__.audioResumes += 1;
        this.state = 'running';
        return Promise.resolve();
      }
      suspend() {
        window.__LIBER_QA_SENSORY__.audioSuspends += 1;
        this.state = 'suspended';
        return Promise.resolve();
      }
      close() { this.state = 'closed'; return Promise.resolve(); }
    }
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: FakeAudioContext });
    Object.defineProperty(window, 'webkitAudioContext', { configurable: true, value: FakeAudioContext });

    const synth = window.speechSynthesis;
    if (synth) {
      try {
        synth.speak = () => { window.__LIBER_QA_SENSORY__.spoken += 1; };
        synth.cancel = () => { window.__LIBER_QA_SENSORY__.cancelled += 1; };
      } catch {
        // The browser may expose read-only speech methods; the test will report that limitation.
      }
    }

    try {
      Object.defineProperty(navigator, 'vibrate', {
        configurable: true,
        value: (pattern) => {
          window.__LIBER_QA_SENSORY__.vibrations.push(pattern);
          return true;
        },
      });
    } catch {
      // Unsupported or non-configurable navigator implementation.
    }
  });

  await visitApp(page);
  await dismissOrientation(page);

  const baseline = await page.evaluate(() => {
    window.speechSynthesis?.speak?.({});
    navigator.vibrate?.(25);
    return window.__LIBER_QA_SENSORY__;
  });
  expect(baseline.spoken).toBe(1);
  expect(baseline.vibrations).toEqual([25]);

  let opened = await openSettings(page);
  await selectSetting(opened.dialog, 'Sound', 'Off');
  await closeDialogWithEscape(page, opened.dialog);

  const soundOffState = await page.evaluate(async () => {
    const context = new window.AudioContext();
    window.__LIBER_QA_AUDIO_CONTEXT__ = context;
    context.createGain();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await context.resume();
    window.speechSynthesis?.speak?.({});
    navigator.vibrate?.(50);
    return {
      state: context.state,
      sensory: window.__LIBER_QA_SENSORY__,
    };
  });

  expect(soundOffState.state).toBe('suspended');
  expect(soundOffState.sensory.audioSuspends).toBeGreaterThan(0);
  expect(soundOffState.sensory.spoken).toBe(2);
  expect(soundOffState.sensory.vibrations).toEqual([25, 50]);

  opened = await openSettings(page);
  await selectSetting(opened.dialog, 'Sound', 'On');
  await closeDialogWithEscape(page, opened.dialog);

  const soundOnState = await page.evaluate(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
    return {
      state: window.__LIBER_QA_AUDIO_CONTEXT__?.state,
      sensory: window.__LIBER_QA_SENSORY__,
    };
  });
  expect(soundOnState.state).toBe('running');
  expect(soundOnState.sensory.audioResumes).toBeGreaterThan(0);

  opened = await openSettings(page);
  await selectSetting(opened.dialog, 'Voice', 'Off');
  await selectSetting(opened.dialog, 'Haptics', 'Off');
  await closeDialogWithEscape(page, opened.dialog);

  const allOff = await page.evaluate(() => {
    window.speechSynthesis?.speak?.({});
    const vibrationResult = navigator.vibrate?.(75);
    return {
      vibrationResult,
      sensory: window.__LIBER_QA_SENSORY__,
    };
  });

  expect(allOff.sensory.spoken).toBe(2);
  expect(allOff.sensory.vibrations).toEqual([25, 50]);
  expect(allOff.vibrationResult).toBe(false);
  expect(allOff.sensory.cancelled).toBeGreaterThan(0);
});
