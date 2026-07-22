import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ELEMENT_SYMBOLS,
  HEBREW_LETTERS,
  SEPHIROTH_DATA,
  formatChapterNumber,
  getSephiraColor,
  getSephiraInfo,
} from '../src/data/correspondences.js';

test('the Hebrew correspondence table retains all twenty-two letters', () => {
  assert.equal(Object.keys(HEBREW_LETTERS).length, 22);
  assert.deepEqual(HEBREW_LETTERS.Aleph, {
    letter: 'א', value: 1, meaning: 'Ox', element: 'Air', tarot: 'The Fool',
  });
  assert.equal(HEBREW_LETTERS['Hé'].tarot, 'The Star');
  assert.equal(HEBREW_LETTERS.Tzaddi.tarot, 'The Emperor');
  assert.equal(HEBREW_LETTERS.Tau.value, 400);
});

test('the ten primary Sephiroth and established extended entries remain available', () => {
  for (const name of ['Kether', 'Chokmah', 'Binah', 'Chesed', 'Geburah', 'Tiphareth', 'Netzach', 'Hod', 'Yesod', 'Malkuth']) {
    assert.ok(SEPHIROTH_DATA[name]);
  }
  assert.equal(SEPHIROTH_DATA.Daath.meaning, 'Knowledge (The Abyss)');
  assert.equal(SEPHIROTH_DATA['Ain Soph'].meaning, 'The Boundless');
  assert.equal(SEPHIROTH_DATA['Kether-Malkuth'].godName, 'YHVH + ADNY');
});

test('element symbols remain unchanged for ritual and chapter displays', () => {
  assert.deepEqual(ELEMENT_SYMBOLS, {
    Fire: '🜂', Water: '🜄', Air: '🜁', Earth: '🜃', Spirit: '☉', Void: '∅', Light: '☆',
  });
});

test('chapter-number formatting preserves the two negative veils', () => {
  assert.equal(formatChapterNumber(-2), '?');
  assert.equal(formatChapterNumber(-1), '!');
  assert.equal(formatChapterNumber(0), '0');
  assert.equal(formatChapterNumber(91), '91');
});

test('Sephira lookup helpers preserve known and fallback behavior', () => {
  assert.equal(getSephiraColor('Tiphareth'), '#DAA520');
  assert.equal(getSephiraColor('Unknown'), '#dc2626');
  assert.deepEqual(getSephiraInfo('Hod'), {
    name: 'Hod', number: 8, meaning: 'Splendor', color: '#FF8C00', planet: 'Mercury', godName: 'Elohim Tzabaoth', archangel: 'Michael',
  });
  assert.deepEqual(getSephiraInfo('Unknown'), {
    name: 'Unknown', meaning: 'Unknown', color: '#dc2626', planet: '—', godName: '—', archangel: '—',
  });
});
