import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const sourcePath = path.join(ROOT, 'src/liber333.jsx');
const dataPath = path.join(ROOT, 'src/data/liber333.js');

function ensureDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function write(relativePath, content) {
  const target = path.join(ROOT, relativePath);
  ensureDirectory(target);
  fs.writeFileSync(target, content);
}

function replaceOnce(source, search, replacement, label) {
  const next = source.replace(search, replacement);
  if (next === source) throw new Error(`Chapter extraction could not replace: ${label}`);
  return next;
}

function extractArrayLiteral(source, declaration) {
  const marker = `${declaration} = [`;
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) return null;

  const arrayStart = source.indexOf('[', markerIndex);
  let depth = 0;
  let inString = false;
  let quote = '';
  let escaped = false;

  for (let index = arrayStart; index < source.length; index += 1) {
    const character = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        inString = false;
        quote = '';
      }
      continue;
    }

    if (character === '"' || character === "'" || character === '`') {
      inString = true;
      quote = character;
      continue;
    }

    if (character === '[') depth += 1;
    if (character === ']') {
      depth -= 1;
      if (depth === 0) return source.slice(arrayStart, index + 1);
    }
  }

  throw new Error(`Chapter extraction found an unterminated array for ${declaration}`);
}

let app = fs.readFileSync(sourcePath, 'utf8');
let literal = extractArrayLiteral(app, 'const LIBER_333');
const alreadyExtracted = !literal && app.includes("import { LIBER_333 } from './data/liber333.js';");

if (alreadyExtracted) {
  if (!fs.existsSync(dataPath)) throw new Error('Chapter import exists but src/data/liber333.js is missing');
  literal = extractArrayLiteral(fs.readFileSync(dataPath, 'utf8'), 'export const LIBER_333');
}

if (!literal) throw new Error('Chapter extraction could not find the Liber 333 corpus');

const corpus = Function(`"use strict"; return (${literal});`)();
if (!Array.isArray(corpus) || corpus.length !== 94) {
  throw new Error(`Expected 94 Liber 333 entries, found ${Array.isArray(corpus) ? corpus.length : 'non-array data'}`);
}

const expectedChapters = [-2, -1, ...Array.from({ length: 92 }, (_, index) => index)];
if (JSON.stringify(corpus.map((entry) => entry.chapter)) !== JSON.stringify(expectedChapters)) {
  throw new Error('Liber 333 chapter sequence is not -2, -1, 0 through 91');
}

const digest = crypto.createHash('sha256').update(JSON.stringify(corpus)).digest('hex');
write(
  'src/data/liber333.js',
  `// Liber CCCXXXIII chapter corpus extracted from the original application.\n// Source text, editorial commentary, order, and correspondences remain unchanged.\n\nexport const LIBER_333 = ${literal};\n`,
);

if (!alreadyExtracted) {
  const chapterLabel = '//  COMPLETE CHAPTER DATA (94 entries)';
  const nextSectionLabel = '//  GEMATRIA ENGINE — TABLES';
  const labelIndex = app.indexOf(chapterLabel);
  const nextLabelIndex = app.indexOf(nextSectionLabel, labelIndex);
  const sectionStart = app.lastIndexOf('// ═', labelIndex) >= 0
    ? app.lastIndexOf('// ═', labelIndex)
    : app.lastIndexOf('// ─', labelIndex);
  const sectionEnd = app.lastIndexOf('// ─', nextLabelIndex);

  if (labelIndex === -1 || nextLabelIndex === -1 || sectionStart === -1 || sectionEnd <= sectionStart) {
    throw new Error('Chapter extraction could not find corpus section boundaries');
  }

  app = app.slice(0, sectionStart) + app.slice(sectionEnd);
  app = replaceOnce(
    app,
    "import { ELEMENT_SYMBOLS, HEBREW_LETTERS, formatChapterNumber, getSephiraColor, getSephiraInfo } from './data/correspondences.js';",
    "import { ELEMENT_SYMBOLS, HEBREW_LETTERS, formatChapterNumber, getSephiraColor, getSephiraInfo } from './data/correspondences.js';\nimport { LIBER_333 } from './data/liber333.js';",
    'chapter corpus import',
  );
  fs.writeFileSync(sourcePath, app);
}

const testContent = `import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

import { LIBER_333 } from '../src/data/liber333.js';

const REQUIRED_FIELDS = ['chapter', 'title', 'text', 'commentary', 'sephira', 'path', 'element', 'tarot'];
const EXPECTED_DIGEST = '${digest}';

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
      assert.equal(typeof entry[field], 'string', \\`Chapter \\${entry.chapter} field \\${field} must remain a string\\`);
    }
  }
});

test('the negative veils, opening chapter, ritual chapters, and final seal remain exact', () => {
  assert.deepEqual(LIBER_333[0], {
    chapter: -2,
    title: '?',
    text: '?',
    commentary: LIBER_333[0].commentary,
    sephira: 'Ain Soph',
    path: '—',
    element: 'Void',
    tarot: '—',
  });
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
`;
write('tests/liber333Data.test.mjs', testContent);

write('docs/CHAPTER_DATA_EXTRACTION.md', `# Liber 333 Chapter Corpus Extraction

This milestone moves the complete 94-entry chapter corpus out of the single-file application without editing its source text, editorial commentary, ordering, or attributions.

## Extracted unchanged

- the two preliminary veil entries, numbered -2 and -1;
- Chapter 0;
- Chapters 1 through 91;
- chapter titles;
- source-text excerpts;
- editorial commentary;
- Sephira, path, element, and Tarot fields.

## Integrity protection

The regression suite locks:

- the exact 94-entry sequence;
- unique chapter identifiers;
- the established eight-field record shape;
- sentinel veil, opening, ritual, and closing entries;
- a SHA-256 digest of the complete serialized corpus.

## Protected behavior

- Oracle Single and Triad indexing;
- random ambient chapter selection;
- Tree browsing and selected-chapter lookup;
- journal restoration;
- chapter display and commentary rendering;
- all chapter wording and attributions.

## Regression command

\`npm run test:chapters\`
`);

const packagePath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts['test:chapters'] = 'node --test tests/liber333Data.test.mjs';
pkg.scripts['test:unit'] = 'npm run test:gematria && npm run test:journal && npm run test:rites && npm run test:correspondences && npm run test:oracle && npm run test:chapters';
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log(`Liber 333 chapter corpus extraction is current. SHA-256: ${digest}`);
