import test from 'node:test';
import assert from 'node:assert/strict';

import { RITUALS } from '../src/features/rites/ritualData.js';

test('the three established guided rites remain available by chapter', () => {
  assert.deepEqual(Object.keys(RITUALS), ['25', '36', '44']);
  assert.equal(RITUALS[25].title, 'The Star Ruby');
  assert.equal(RITUALS[36].title, 'The Star Sapphire');
  assert.equal(RITUALS[44].title, 'The Mass of the Phoenix');
});

test('station ordering and exact step counts remain unchanged', () => {
  assert.equal(RITUALS[25].steps.length, 9);
  assert.equal(RITUALS[36].steps.length, 8);
  assert.equal(RITUALS[44].steps.length, 8);

  for (const rite of Object.values(RITUALS)) {
    assert.equal(rite.steps.at(-1).final, true);
    assert.equal(rite.steps.slice(0, -1).some((step) => step.final), false);
    for (const step of rite.steps) {
      assert.equal(typeof step.station, 'string');
      assert.equal(typeof step.direction, 'string');
      assert.equal(typeof step.words, 'string');
      assert.equal(typeof step.bell, 'boolean');
    }
  }
});

test('chapter identifiers and performative metadata remain internally consistent', () => {
  for (const [chapter, rite] of Object.entries(RITUALS)) {
    assert.equal(rite.chapter, Number(chapter));
    assert.ok(rite.subtitle.length > 0);
    assert.ok(rite.element.length > 0);
    assert.ok(rite.duration.length > 0);
    assert.ok(rite.intro.length > 0);
  }
});

test('the Phoenix blood-sign remains explicitly symbolic and non-injurious', () => {
  assert.match(RITUALS[44].intro, /trace it, do not cut/i);
  const bloodSign = RITUALS[44].steps.find((step) => step.station === 'THE BLOOD-SIGN');
  assert.ok(bloodSign);
  assert.match(bloodSign.direction, /symbolically — do not cut/i);
});
