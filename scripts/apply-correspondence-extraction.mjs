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
  if (!match) throw new Error(`Correspondence extraction could not find: ${label}`);
  return match;
}

function replaceOnce(source, search, replacement, label) {
  const next = source.replace(search, replacement);
  if (next === source) throw new Error(`Correspondence extraction could not replace: ${label}`);
  return next;
}

let app = fs.readFileSync(sourcePath, 'utf8');

const hebrew = extract(app, /const HEBREW_LETTERS = (\{[\s\S]*?\n\});\n\n(?=const SEPHIROTH_DATA)/, 'HEBREW_LETTERS');
const sephiroth = extract(app, /const SEPHIROTH_DATA = (\{[\s\S]*?\n\});\n\n(?=const ELEMENT_SYMBOLS)/, 'SEPHIROTH_DATA');
const elements = extract(app, /const ELEMENT_SYMBOLS = (\{[\s\S]*?\n\});\n\n(?=\/\/ ─+\n\/\/  GEMATRIA ENGINE — FUNCTIONS)/, 'ELEMENT_SYMBOLS');
const chapterNumber = extract(app, /const formatChapterNumber = \(num\) => \{[\s\S]*?\n\};\n\n(?=const getSephiraColor)/, 'formatChapterNumber');
const sephiraColor = extract(app, /const getSephiraColor = \(sephiraName\) => \{[\s\S]*?\n\};\n\n(?=const getSephiraInfo)/, 'getSephiraColor');
const sephiraInfo = extract(app, /const getSephiraInfo = \(sephiraName\) => \{[\s\S]*?\n\};\n\n(?=\/\/ ─+\n\/\/  NOISE TEXTURE)/, 'getSephiraInfo');

const exportedChapterNumber = chapterNumber[0].trim().replace('const formatChapterNumber', 'export const formatChapterNumber');
const exportedSephiraColor = sephiraColor[0].trim().replace('const getSephiraColor', 'export const getSephiraColor');
const exportedSephiraInfo = sephiraInfo[0].trim().replace('const getSephiraInfo', 'export const getSephiraInfo');

write('src/data/correspondences.js', `// Shared Qabalistic correspondence data extracted without editorial changes.\n\nexport const HEBREW_LETTERS = ${hebrew[1]};\n\nexport const SEPHIROTH_DATA = ${sephiroth[1]};\n\nexport const ELEMENT_SYMBOLS = ${elements[1]};\n\n${exportedChapterNumber}\n\n${exportedSephiraColor}\n\n${exportedSephiraInfo}\n`);

app = replaceOnce(
  app,
  "import { RITUALS } from './features/rites/ritualData.js';",
  "import { RITUALS } from './features/rites/ritualData.js';\nimport { ELEMENT_SYMBOLS, HEBREW_LETTERS, formatChapterNumber, getSephiraColor, getSephiraInfo } from './data/correspondences.js';",
  'correspondence import',
);

for (const block of [hebrew[0], sephiroth[0], elements[0], chapterNumber[0], sephiraColor[0], sephiraInfo[0]]) {
  app = app.replace(block, '');
}

for (const legacy of ['const HEBREW_LETTERS', 'const SEPHIROTH_DATA', 'const ELEMENT_SYMBOLS', 'const formatChapterNumber', 'const getSephiraColor', 'const getSephiraInfo']) {
  if (app.includes(legacy)) throw new Error(`Legacy correspondence definition remains: ${legacy}`);
}

fs.writeFileSync(sourcePath, app);

write('tests/correspondences.test.mjs', `import test from 'node:test';
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
`);

const packagePath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts['test:correspondences'] = 'node --test tests/correspondences.test.mjs';
pkg.scripts['test:unit'] = 'npm run test:gematria && npm run test:journal && npm run test:rites && npm run test:correspondences';
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

write('docs/CORRESPONDENCE_DATA_EXTRACTION.md', `# Correspondence Data Extraction

This milestone centralizes the Qabalistic correspondence records shared by the Oracle, Tree, Gematria display, chapter rendering, and guided rites.

## Extracted unchanged

- 22 Hebrew-letter records;
- Sephiroth, Negative Veils, path-combination, and Crown–Kingdom metadata;
- elemental display symbols;
- chapter-number formatting for ?, !, and numbered chapters;
- Sephira color and information lookup helpers.

## Protected behavior

- no Tree placement changes;
- no attribution or Tarot changes;
- no color changes;
- no Oracle prompt changes;
- no visible component changes;
- planetary-hour calculations remain outside this module.

## Regression command

\`npm run test:correspondences\`
`);

console.log('Correspondence extraction applied successfully.');
