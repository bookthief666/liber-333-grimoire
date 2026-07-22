import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

import { LIBER_333 } from '../src/data/liber333.js';

const REQUIRED_FIELDS = ['chapter', 'title', 'text', 'commentary', 'sephira', 'path', 'element', 'tarot'];
const EXPECTED_DIGEST = 'fe69656ff630750f8fbd7893e1391a8b51a95828d5507d0ab179a1870b0bdfb4';

test('the complete 94-entry chapter sequence remains intact', () => {
  const expected = [-2, -1, ...Array.from({ length: 92 }, (_, index) => index)];
  assert.equal(LIBER_333.length, 94);
  assert.deepEqual(LIBER_333.map((entry) => entry.chapter), expected);
  assert.equal(new Set(LIBER_333.map((entry) => entry.chapter)).size, 94);
});

test('every chapter preserves the established record shape', () => {
  for (const entry of LIBER_333) {
    assert.deepEqual(Object.keys(entry), REQUIRED_FIELDS);
    assert.equal(typeof entry.chapter, 'number');
    for (const field of REQUIRED_FIELDS.slice(1)) {
      assert.equal(
        typeof entry[field],
        'string',
        'Chapter ' + entry.chapter + ' field ' + field + ' must remain a string',
      );
    }
  }
});

test('the negative veils, opening chapter, ritual chapters, and final seal remain exact', () => {
  assert.equal(LIBER_333[0].chapter, -2);
  assert.equal(LIBER_333[0].title, '?');
  assert.equal(LIBER_333[0].text, '?');
  assert.equal(LIBER_333[0].sephira, 'Ain Soph');
  assert.equal(LIBER_333[0].element, 'Void');
  assert.equal(LIBER_333[1].chapter, -1);
  assert.equal(LIBER_333[1].title, '!');
  assert.equal(LIBER_333[2].chapter, 0);
  assert.equal(LIBER_333[2].title, 'ΚΕΦΑΛΗ Η ΟΥΚ ΕΣΤΙ ΚΕΦΑΛΗ');
  assert.equal(LIBER_333.find((entry) => entry.chapter === 25).title, 'THE STAR RUBY');
  assert.equal(LIBER_333.find((entry) => entry.chapter === 36).title, 'THE STAR SAPPHIRE');
  assert.equal(LIBER_333.find((entry) => entry.chapter === 44).title, 'THE MASS OF THE PHOENIX');
  assert.equal(LIBER_333.at(-1).chapter, 91);
  assert.equal(LIBER_333.at(-1).title, 'THE HEIKLE');
  assert.equal(LIBER_333.at(-1).text, 'A.M.E.N.');
});

test('the complete serialized corpus remains byte-for-byte stable', () => {
  const digest = crypto.createHash('sha256').update(JSON.stringify(LIBER_333)).digest('hex');
  assert.equal(digest, EXPECTED_DIGEST);
});
