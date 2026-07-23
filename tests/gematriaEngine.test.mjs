import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateGematria, findCorrespondences, stringToHash } from '../src/features/gematria/gematriaEngine.js';

test('English Ordinal calculation preserves current sums and reductions', () => {
  assert.deepEqual(calculateGematria('THELEMA'), {
    simple: 64,
    reduced: 1,
    raw: 7,
    reductionSteps: [64, 10, 1],
  });

  assert.deepEqual(calculateGematria('Do what thou wilt'), {
    simple: 199,
    reduced: 1,
    raw: 14,
    reductionSteps: [199, 19, 10, 1],
  });
});

test('non-Latin characters, spaces, punctuation, and digits remain ignored', () => {
  assert.deepEqual(calculateGematria('A! Z? 93'), {
    simple: 27,
    reduced: 9,
    raw: 2,
    reductionSteps: [27, 9],
  });
  assert.deepEqual(calculateGematria('93'), { simple: 0, reduced: 0, raw: 0 });
});

test('correspondence ordering remains direct, square, factor, then proximity', () => {
  const ninetyThree = findCorrespondences(93);
  assert.equal(ninetyThree[0].type, 'direct');
  assert.match(ninetyThree[0].text, /Thelema/);

  const fortyNine = findCorrespondences(49);
  assert.equal(fortyNine[0].type, 'direct');
  assert.equal(fortyNine[1].type, 'square');
  assert.match(fortyNine[1].text, /7²/);
  assert.ok(fortyNine.length <= 8);
});

test('triad hash remains deterministic', () => {
  assert.equal(stringToHash('Do what thou wilt'), 1630500505);
  assert.equal(stringToHash('THELEMA'), 631747426);
  assert.equal(stringToHash(''), 0);
});
