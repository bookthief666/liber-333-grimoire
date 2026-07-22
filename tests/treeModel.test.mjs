import test from 'node:test';
import assert from 'node:assert/strict';

import { LIBER_333 } from '../src/data/liber333.js';
import {
  TREE_NODE_ORDER,
  TREE_POS,
  VEIL_KEYS,
  deriveTreePaths,
  getVeilChapters,
  groupChaptersBySephira,
} from '../src/features/tree/treeModel.js';

test('Tree coordinates remain unchanged', () => {
  assert.deepEqual(TREE_POS, {
    Kether: { x: 50, y: 7 },
    Chokmah: { x: 79, y: 19 },
    Binah: { x: 21, y: 19 },
    Daath: { x: 50, y: 31 },
    Chesed: { x: 79, y: 43 },
    Geburah: { x: 21, y: 43 },
    Tiphareth: { x: 50, y: 54 },
    Netzach: { x: 79, y: 68 },
    Hod: { x: 21, y: 68 },
    Yesod: { x: 50, y: 80 },
    Malkuth: { x: 50, y: 95 },
  });
});

test('Tree node and negative-veil order remain unchanged', () => {
  assert.deepEqual(TREE_NODE_ORDER, [
    'Kether',
    'Chokmah',
    'Binah',
    'Daath',
    'Chesed',
    'Geburah',
    'Tiphareth',
    'Netzach',
    'Hod',
    'Yesod',
    'Malkuth',
  ]);
  assert.deepEqual(VEIL_KEYS, ['Ain', 'Ain Soph', 'Ain Soph Aur']);
});

test('grouping conserves all 94 chapter records exactly once', () => {
  const groups = groupChaptersBySephira(LIBER_333);
  const grouped = Object.values(groups).flat();

  assert.equal(grouped.length, 94);
  assert.equal(new Set(grouped).size, 94);
  assert.deepEqual(grouped.map((chapter) => chapter.chapter).sort((a, b) => a - b),
    LIBER_333.map((chapter) => chapter.chapter).sort((a, b) => a - b));

  assert.deepEqual(groups['Ain Soph'].map((chapter) => chapter.chapter), [-2]);
  assert.deepEqual(groups['Ain Soph Aur'].map((chapter) => chapter.chapter), [-1]);
  assert.deepEqual(groups.Ain.map((chapter) => chapter.chapter), [0]);
});

test('missing Sephira values retain the existing em-dash fallback bucket', () => {
  const chapters = [
    { chapter: 1, sephira: '' },
    { chapter: 2, sephira: null },
    { chapter: 3, sephira: 'Kether' },
  ];
  const groups = groupChaptersBySephira(chapters);

  assert.deepEqual(groups['—'].map((chapter) => chapter.chapter), [1, 2]);
  assert.deepEqual(groups.Kether.map((chapter) => chapter.chapter), [3]);
});

test('drawable paths require a compound key with two known endpoints', () => {
  const groups = {
    'Kether-Binah': [{}],
    'Kether-Tiphareth': [{}],
    'Kether-Unknown': [{}],
    'Ain Soph': [{}],
    Kether: [{}],
  };

  assert.deepEqual(deriveTreePaths(groups), [
    { key: 'Kether-Binah', a: 'Kether', b: 'Binah' },
    { key: 'Kether-Tiphareth', a: 'Kether', b: 'Tiphareth' },
  ]);
});

test('all corpus-derived drawable paths resolve to current Tree coordinates', () => {
  const groups = groupChaptersBySephira(LIBER_333);
  const paths = deriveTreePaths(groups);

  assert.ok(paths.length > 0);
  assert.ok(paths.some((path) => path.key === 'Kether-Binah'));
  assert.ok(paths.some((path) => path.key === 'Kether-Malkuth'));
  for (const path of paths) {
    assert.ok(TREE_POS[path.a], `${path.a} must have a Tree coordinate`);
    assert.ok(TREE_POS[path.b], `${path.b} must have a Tree coordinate`);
    assert.equal(path.key, `${path.a}-${path.b}`);
  }
});

test('veil aggregation preserves Ain, Ain Soph, Ain Soph Aur order', () => {
  const groups = groupChaptersBySephira(LIBER_333);
  const veils = getVeilChapters(groups);

  assert.deepEqual(veils.map((chapter) => chapter.chapter), [0, -2, -1]);
  assert.deepEqual(veils.map((chapter) => chapter.sephira), VEIL_KEYS);
});
