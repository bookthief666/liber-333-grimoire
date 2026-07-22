import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CHALDEAN_ORDER,
  DAY_RULERS,
  MOON_PHASES,
  PLANETS,
  calculateLunarPhase,
  calculatePlanetaryTime,
} from '../src/features/cosmic/cosmicTiming.js';

test('planetary tables preserve their established order and attributions', () => {
  assert.deepEqual(CHALDEAN_ORDER, ['Saturn', 'Jupiter', 'Mars', 'Sol', 'Venus', 'Mercury', 'Luna']);
  assert.deepEqual(DAY_RULERS, {
    0: 'Sol',
    1: 'Luna',
    2: 'Mars',
    3: 'Mercury',
    4: 'Jupiter',
    5: 'Venus',
    6: 'Saturn',
  });
  assert.deepEqual(Object.keys(PLANETS), CHALDEAN_ORDER);
  assert.deepEqual(PLANETS.Mars, {
    symbol: '♂',
    color: '#dc2626',
    colorLight: '#f87171',
    element: 'Fire/Iron',
    frequency: 144.72,
  });
  assert.equal(PLANETS.Mercury.frequency, 141.27);
  assert.equal(PLANETS.Luna.element, 'Water/Silver');
});

test('planetary hours continue to use the fixed 6 AM day start', () => {
  const atDayStart = calculatePlanetaryTime(new Date(2026, 6, 22, 6, 0, 0));
  assert.deepEqual(atDayStart, {
    planet: 'Mercury',
    ...PLANETS.Mercury,
    dayRuler: 'Mercury',
    hourIndex: 0,
    isNight: false,
    timeOfDay: 'morning',
  });

  const midday = calculatePlanetaryTime(new Date(2026, 6, 22, 12, 30, 0));
  assert.equal(midday.planet, 'Venus');
  assert.equal(midday.dayRuler, 'Mercury');
  assert.equal(midday.hourIndex, 6);
  assert.equal(midday.isNight, false);
  assert.equal(midday.timeOfDay, 'midday');
});

test('pre-dawn wrapping and evening classification remain unchanged', () => {
  const preDawn = calculatePlanetaryTime(new Date(2026, 6, 22, 5, 30, 0));
  assert.equal(preDawn.planet, 'Saturn');
  assert.equal(preDawn.hourIndex, 23);
  assert.equal(preDawn.isNight, true);
  assert.equal(preDawn.timeOfDay, 'deep night');

  const evening = calculatePlanetaryTime(new Date(2026, 6, 22, 18, 0, 0));
  assert.equal(evening.planet, 'Sol');
  assert.equal(evening.hourIndex, 12);
  assert.equal(evening.isNight, true);
  assert.equal(evening.timeOfDay, 'evening');
});

test('the eight lunar display records remain unchanged', () => {
  assert.deepEqual(MOON_PHASES.map((phase) => phase.name), [
    'New Moon',
    'Waxing Crescent',
    'First Quarter',
    'Waxing Gibbous',
    'Full Moon',
    'Waning Gibbous',
    'Last Quarter',
    'Waning Crescent',
  ]);
  assert.equal(MOON_PHASES[0].emoji, '🌑');
  assert.equal(MOON_PHASES[4].waxing, false);
  assert.equal(MOON_PHASES[7].index, 7);
});

test('Conway lunar-phase approximation remains locked for fixed calendar dates', () => {
  assert.equal(calculateLunarPhase(new Date(2026, 6, 22, 12, 0, 0)).name, 'Waxing Crescent');
  assert.equal(calculateLunarPhase(new Date(2026, 6, 1, 12, 0, 0)).name, 'Full Moon');
  assert.equal(calculateLunarPhase(new Date(2026, 0, 1, 12, 0, 0)).name, 'Waxing Gibbous');
  assert.equal(calculateLunarPhase(new Date(2000, 0, 1, 12, 0, 0)).name, 'Last Quarter');
  assert.equal(calculateLunarPhase(new Date(1999, 0, 1, 12, 0, 0)).name, 'Waxing Gibbous');
});
