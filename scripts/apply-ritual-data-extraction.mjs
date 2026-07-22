import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const sourcePath = path.join(ROOT, 'src/liber333.jsx');

function write(relativePath, content) {
  const target = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function extract(source, pattern, label) {
  const match = source.match(pattern);
  if (!match) throw new Error(`Ritual data extraction could not find: ${label}`);
  return match;
}

function replaceOnce(source, search, replacement, label) {
  const next = source.replace(search, replacement);
  if (next === source) throw new Error(`Ritual data extraction could not replace: ${label}`);
  return next;
}

let app = fs.readFileSync(sourcePath, 'utf8');
const ritualMatch = extract(
  app,
  /const RITUALS = (\{[\s\S]*?\n\});\n\n(?=\/\/ ─+\n\/\/  GEMATRIA ECHOES)/,
  'RITUALS table',
);

write(
  'src/features/rites/ritualData.js',
  `// Static guided-rite content extracted from the original application.\n// Wording, ordering, station counts, and safety language remain unchanged.\n\nexport const RITUALS = ${ritualMatch[1]};\n`,
);

app = replaceOnce(
  app,
  "import { useJournal } from './features/journal/useJournal.js';",
  "import { useJournal } from './features/journal/useJournal.js';\nimport { RITUALS } from './features/rites/ritualData.js';",
  'ritual data import',
);
app = app.replace(ritualMatch[0], '');

if (app.includes('const RITUALS =')) throw new Error('Legacy RITUALS table remains in src/liber333.jsx');
fs.writeFileSync(sourcePath, app);

write('tests/ritualData.test.mjs', `import test from 'node:test';
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
  assert.equal(RITUALS[36].steps.length, 7);
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
`);

const packagePath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts['test:rites'] = 'node --test tests/ritualData.test.mjs';
pkg.scripts['test:unit'] = 'npm run test:gematria && npm run test:journal && npm run test:rites';
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

write('docs/RITUAL_DATA_EXTRACTION.md', `# Guided Rite Data Extraction

This milestone moves the static guided-rite corpus out of the single-file application while preserving the existing Ritual Mode component and choreography.

## Extracted unchanged

- Chapter 25 — The Star Ruby;
- Chapter 36 — The Star Sapphire;
- Chapter 44 — The Mass of the Phoenix;
- rite titles, subtitles, elements, durations, introductions;
- station order, directions, words, transliterations, meanings, bell flags, and final flags.

## Protected behavior

- Ritual Mode state remains in the existing component;
- no station timing or navigation changes;
- no audio or bell behavior changes;
- no visual changes;
- the symbolic non-injury instruction in the Mass of the Phoenix remains explicit.

## Regression command

\`npm run test:rites\`
`);

console.log('Ritual data extraction applied successfully.');
