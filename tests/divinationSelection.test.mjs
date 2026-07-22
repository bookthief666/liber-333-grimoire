import test from 'node:test';
import assert from 'node:assert/strict';

import { LIBER_333 } from '../src/data/liber333.js';
import { calculateGematria } from '../src/features/gematria/gematriaEngine.js';
import {
  getReadingChapterIndexes,
  selectReadingChapters,
} from '../src/features/oracle/divinationSelection.js';

test('Single selection remains full-sum modulo corpus length', () => {
  const thelema = calculateGematria('THELEMA');
  const doWhatThouWilt = calculateGematria('Do what thou wilt');

  assert.deepEqual(getReadingChapterIndexes({
    chapterCount: LIBER_333.length,
    gematria: thelema,
    question: 'THELEMA',
    spreadType: 'single',
  }), [64]);
  assert.deepEqual(selectReadingChapters({
    chapters: LIBER_333,
    gematria: thelema,
    question: 'THELEMA',
    spreadType: 'single',
  }).map((chapter) => chapter.chapter), [62]);

  assert.deepEqual(getReadingChapterIndexes({
    chapterCount: LIBER_333.length,
    gematria: doWhatThouWilt,
    question: 'Do what thou wilt',
    spreadType: 'single',
  }), [11]);
  assert.deepEqual(selectReadingChapters({
    chapters: LIBER_333,
    gematria: doWhatThouWilt,
    question: 'Do what thou wilt',
    spreadType: 'single',
  }).map((chapter) => chapter.chapter), [9]);
});

test('Triad selection preserves full-sum, reduced, and deterministic-hash positions', () => {
  const gematria = calculateGematria('Do what thou wilt');
  const indexes = getReadingChapterIndexes({
    chapterCount: LIBER_333.length,
    gematria,
    question: 'Do what thou wilt',
    spreadType: 'spread',
  });

  assert.deepEqual(indexes, [11, 1, 5]);
  assert.deepEqual(selectReadingChapters({
    chapters: LIBER_333,
    gematria,
    question: 'Do what thou wilt',
    spreadType: 'spread',
  }).map((chapter) => chapter.chapter), [9, -1, 3]);
});

test('a second known Triad remains stable across all three derivations', () => {
  const gematria = calculateGematria('THELEMA');

  assert.deepEqual(getReadingChapterIndexes({
    chapterCount: LIBER_333.length,
    gematria,
    question: 'THELEMA',
    spreadType: 'spread',
  }), [64, 1, 28]);
  assert.deepEqual(selectReadingChapters({
    chapters: LIBER_333,
    gematria,
    question: 'THELEMA',
    spreadType: 'spread',
  }).map((chapter) => chapter.chapter), [62, -1, 26]);
});

test('duplicate Triad positions advance forward with corpus wrapping semantics', () => {
  assert.deepEqual(getReadingChapterIndexes({
    chapterCount: 94,
    gematria: { simple: 1, reduced: 1 },
    question: 'q19',
    spreadType: 'spread',
  }), [1, 2, 3]);

  assert.deepEqual(getReadingChapterIndexes({
    chapterCount: 4,
    gematria: { simple: 3, reduced: 3 },
    question: 'q19',
    spreadType: 'spread',
  }), [3, 0, 1]);
});

test('selection returns the original corpus object references', () => {
  const gematria = calculateGematria('THELEMA');
  const selected = selectReadingChapters({
    chapters: LIBER_333,
    gematria,
    question: 'THELEMA',
    spreadType: 'spread',
  });

  assert.equal(selected[0], LIBER_333[64]);
  assert.equal(selected[1], LIBER_333[1]);
  assert.equal(selected[2], LIBER_333[28]);
});

test('every non-spread mode retains Single selection semantics', () => {
  const gematria = { simple: 95, reduced: 5 };
  assert.deepEqual(getReadingChapterIndexes({
    chapterCount: 94,
    gematria,
    question: 'ignored by Single selection',
    spreadType: 'anything-else',
  }), [1]);
});
