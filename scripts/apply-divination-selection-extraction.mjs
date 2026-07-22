import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const sourcePath = path.join(ROOT, 'src/liber333.jsx');
const modulePath = path.join(ROOT, 'src/features/oracle/divinationSelection.js');

function replaceOnce(source, search, replacement, label) {
  const next = source.replace(search, replacement);
  if (next === source) throw new Error(`Divination selection extraction could not replace: ${label}`);
  return next;
}

if (!fs.existsSync(modulePath)) throw new Error('Divination selection module is missing');

let app = fs.readFileSync(sourcePath, 'utf8');
const importLine = "import { selectReadingChapters } from './features/oracle/divinationSelection.js';";
const integratedCall = `    const chapters = selectReadingChapters({
      chapters: LIBER_333,
      gematria: gem,
      question,
      spreadType,
    });`;
const alreadyExtracted = app.includes(importLine) &&
  app.includes(integratedCall) &&
  !app.includes('stringToHash(question) % LIBER_333.length');

if (!alreadyExtracted) {
  app = replaceOnce(
    app,
    "import { calculateGematria, findCorrespondences, stringToHash } from './features/gematria/gematriaEngine.js';",
    "import { calculateGematria, findCorrespondences } from './features/gematria/gematriaEngine.js';\n" + importLine,
    'selection import and legacy hash import removal',
  );

  app = replaceOnce(
    app,
    `    // Select chapters
    let chapters;
    if (spreadType === "spread") {
      // Past: simple value, Present: reduced, Future: hash
      const idx1 = gem.simple % LIBER_333.length;
      const idx2 = gem.reduced % LIBER_333.length;
      const idx3 = stringToHash(question) % LIBER_333.length;
      // Ensure no duplicates
      const set = new Set([idx1]);
      let i2 = idx2; while (set.has(i2)) i2 = (i2 + 1) % LIBER_333.length; set.add(i2);
      let i3 = idx3; while (set.has(i3)) i3 = (i3 + 1) % LIBER_333.length;
      chapters = [LIBER_333[idx1], LIBER_333[i2], LIBER_333[i3]];
    } else {
      const idx = gem.simple % LIBER_333.length;
      chapters = [LIBER_333[idx]];
    }`,
    `    // Select chapters
${integratedCall}`,
    'inline chapter selection',
  );

  fs.writeFileSync(sourcePath, app);
}

const integrated = fs.readFileSync(sourcePath, 'utf8');
for (const forbidden of [
  'stringToHash(question) % LIBER_333.length',
  'let chapters;\n    if (spreadType === "spread")',
]) {
  if (integrated.includes(forbidden)) throw new Error(`Legacy selection logic remains: ${forbidden}`);
}
for (const required of [importLine, integratedCall, 'setDrawnChapters(chapters);']) {
  if (!integrated.includes(required)) throw new Error(`Required selection seam is missing: ${required}`);
}

const packagePath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts['test:selection'] = 'node --test tests/divinationSelection.test.mjs';
pkg.scripts['test:unit'] = 'npm run test:gematria && npm run test:journal && npm run test:rites && npm run test:correspondences && npm run test:oracle && npm run test:chapters && npm run test:cosmic && npm run test:tree && npm run test:selection';
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log('Divination chapter selection extraction is current.');
