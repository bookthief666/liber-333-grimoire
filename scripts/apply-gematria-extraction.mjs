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
  if (!match) throw new Error(`Gematria extraction could not find: ${label}`);
  return match;
}

function replaceOnce(source, search, replacement, label) {
  const next = source.replace(search, replacement);
  if (next === source) throw new Error(`Gematria extraction could not replace: ${label}`);
  return next;
}

let app = fs.readFileSync(sourcePath, 'utf8');

const englishMatch = extract(
  app,
  /const ENGLISH_QABALAH = (\{[\s\S]*?\n\});\n\n(?=const HEBREW_LETTERS)/,
  'ENGLISH_QABALAH table',
);
const notableMatch = extract(
  app,
  /const NOTABLE_NUMBERS = (\{[\s\S]*?\n\});\n\n(?=const ELEMENT_SYMBOLS)/,
  'NOTABLE_NUMBERS table',
);
const calculateMatch = extract(
  app,
  /const calculateGematria = \(text\) => \{[\s\S]*?\n\};\n\n(?=const findCorrespondences)/,
  'calculateGematria',
);
const correspondencesMatch = extract(
  app,
  /const findCorrespondences = \(value\) => \{[\s\S]*?\n\};\n\n(?=const stringToHash)/,
  'findCorrespondences',
);
const hashMatch = extract(
  app,
  /const stringToHash = \(str\) => \{[\s\S]*?\n\};\n\n(?=const formatChapterNumber)/,
  'stringToHash',
);

const dataModule = `// Stable editorial tables used by the current English Ordinal calculator.\n// Values and wording are intentionally unchanged from the original monolith.\n\nexport const ENGLISH_QABALAH = ${englishMatch[1]};\n\nexport const NOTABLE_NUMBERS = ${notableMatch[1]};\n`;

const calculateExport = calculateMatch[0].trim().replace('const calculateGematria', 'export const calculateGematria');
const correspondencesExport = correspondencesMatch[0].trim().replace('const findCorrespondences', 'export const findCorrespondences');
const hashExport = hashMatch[0].trim().replace('const stringToHash', 'export const stringToHash');

const engineModule = `import { ENGLISH_QABALAH, NOTABLE_NUMBERS } from './gematriaData.js';\n\nexport const GEMATRIA_METHOD = Object.freeze({\n  id: 'english-ordinal-a1z26',\n  label: 'English Ordinal (A=1–Z=26)',\n  countedCharacters: 'Latin letters A through Z',\n});\n\n${calculateExport}\n\n${correspondencesExport}\n\n${hashExport}\n`;

write('src/features/gematria/gematriaData.js', dataModule);
write('src/features/gematria/gematriaEngine.js', engineModule);

app = replaceOnce(
  app,
  "import LandingCenterpiece from './LandingCenterpiece.jsx';",
  "import LandingCenterpiece from './LandingCenterpiece.jsx';\nimport { NOTABLE_NUMBERS } from './features/gematria/gematriaData.js';\nimport { calculateGematria, findCorrespondences, stringToHash } from './features/gematria/gematriaEngine.js';",
  'Gematria module imports',
);
app = app.replace(englishMatch[0], '');
app = app.replace(notableMatch[0], '');
app = app.replace(calculateMatch[0], '');
app = app.replace(correspondencesMatch[0], '');
app = app.replace(hashMatch[0], '');

for (const legacyDefinition of [
  'const ENGLISH_QABALAH',
  'const NOTABLE_NUMBERS',
  'const calculateGematria',
  'const findCorrespondences',
  'const stringToHash',
]) {
  if (app.includes(legacyDefinition)) throw new Error(`Legacy definition remains: ${legacyDefinition}`);
}

fs.writeFileSync(sourcePath, app);

const tests = `import test from 'node:test';\nimport assert from 'node:assert/strict';\n\nimport { calculateGematria, findCorrespondences, stringToHash } from '../src/features/gematria/gematriaEngine.js';\n\ntest('English Ordinal calculation preserves current sums and reductions', () => {\n  assert.deepEqual(calculateGematria('THELEMA'), {\n    simple: 64,\n    reduced: 1,\n    raw: 7,\n    reductionSteps: [64, 10, 1],\n  });\n\n  assert.deepEqual(calculateGematria('Do what thou wilt'), {\n    simple: 199,\n    reduced: 1,\n    raw: 14,\n    reductionSteps: [199, 19, 10, 1],\n  });\n});\n\ntest('non-Latin characters, spaces, punctuation, and digits remain ignored', () => {\n  assert.deepEqual(calculateGematria('A! Z? 93'), {\n    simple: 27,\n    reduced: 9,\n    raw: 2,\n    reductionSteps: [27, 9],\n  });\n  assert.deepEqual(calculateGematria('93'), { simple: 0, reduced: 0, raw: 0 });\n});\n\ntest('correspondence ordering remains direct, square, factor, then proximity', () => {\n  const ninetyThree = findCorrespondences(93);\n  assert.equal(ninetyThree[0].type, 'direct');\n  assert.match(ninetyThree[0].text, /Thelema/);\n\n  const fortyNine = findCorrespondences(49);\n  assert.equal(fortyNine[0].type, 'direct');\n  assert.equal(fortyNine[1].type, 'square');\n  assert.match(fortyNine[1].text, /7²/);\n  assert.ok(fortyNine.length <= 8);\n});\n\ntest('triad hash remains deterministic', () => {\n  assert.equal(stringToHash('Do what thou wilt'), 1630500505);\n  assert.equal(stringToHash('THELEMA'), 631747426);\n  assert.equal(stringToHash(''), 0);\n});\n`;
write('tests/gematriaEngine.test.mjs', tests);

const packagePath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts['test:gematria'] = 'node --test tests/gematriaEngine.test.mjs';
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

write('docs/GEMATRIA_ENGINE_EXTRACTION.md', `# Gematria Engine Extraction\n\nThis milestone moves the current numerical engine out of the single-file application without changing its behavior.\n\n## Extracted\n\n- English Ordinal A=1 through Z=26 values;\n- notable-number editorial correspondences;\n- full-sum and digit-reduction calculation;\n- correspondence ranking and result limit;\n- deterministic string hash used by the Triad draw.\n\n## Preserved\n\n- non-Latin characters, punctuation, spaces, and digits remain ignored;\n- empty input returns the existing zero-valued shape;\n- correspondence wording and ordering are unchanged;\n- chapter selection still uses the same full sum, reduced value, and hash;\n- no visible Gematria, Oracle, Tree, journal, or ritual design changes are included.\n\n## Regression command\n\n\`npm run test:gematria\`\n`);

console.log('Gematria engine extraction applied successfully.');
