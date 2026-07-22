import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const sourcePath = path.join(ROOT, 'src/liber333.jsx');
const modulePath = path.join(ROOT, 'src/features/cosmic/cosmicTiming.js');

function replaceOnce(source, search, replacement, label) {
  const next = source.replace(search, replacement);
  if (next === source) throw new Error(`Cosmic timing extraction could not replace: ${label}`);
  return next;
}

if (!fs.existsSync(modulePath)) {
  throw new Error('Cosmic timing module is missing');
}

let app = fs.readFileSync(sourcePath, 'utf8');
const importLine = "import { PLANETS, useLunarPhase, usePlanetaryTime } from './features/cosmic/cosmicTiming.js';";
const alreadyExtracted = app.includes(importLine) &&
  !app.includes('const PLANETS =') &&
  !app.includes('const usePlanetaryTime =') &&
  !app.includes('const MOON_PHASES =') &&
  !app.includes('const useLunarPhase =');

if (!alreadyExtracted) {
  const planetaryLabel = '//  PLANETARY HOURS SYSTEM';
  const hapticLabel = '//  HAPTIC FEEDBACK';
  const planetaryLabelIndex = app.indexOf(planetaryLabel);
  const hapticLabelIndex = app.indexOf(hapticLabel, planetaryLabelIndex);
  const sectionStart = app.lastIndexOf('// ─', planetaryLabelIndex);
  const sectionEnd = app.lastIndexOf('// ─', hapticLabelIndex);

  if (planetaryLabelIndex === -1 || hapticLabelIndex === -1 || sectionStart === -1 || sectionEnd <= sectionStart) {
    throw new Error('Cosmic timing extraction could not find subsystem boundaries');
  }

  app = app.slice(0, sectionStart) + app.slice(sectionEnd);
  app = replaceOnce(
    app,
    "import { LIBER_333 } from './data/liber333.js';",
    "import { LIBER_333 } from './data/liber333.js';\n" + importLine,
    'cosmic timing import',
  );
  fs.writeFileSync(sourcePath, app);
}

const integrated = fs.readFileSync(sourcePath, 'utf8');
for (const legacyDeclaration of [
  'const PLANETS =',
  'const CHALDEAN_ORDER =',
  'const DAY_RULERS =',
  'const usePlanetaryTime =',
  'const MOON_PHASES =',
  'const useLunarPhase =',
]) {
  if (integrated.includes(legacyDeclaration)) {
    throw new Error(`Legacy cosmic declaration remains: ${legacyDeclaration}`);
  }
}
if (!integrated.includes(importLine)) {
  throw new Error('Cosmic timing import is missing');
}
if (!integrated.includes('const oracle = useAIOracle(PLANETS);')) {
  throw new Error('Oracle no longer receives the shared planetary table');
}

const packagePath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts['test:cosmic'] = 'node --test tests/cosmicTiming.test.mjs';
pkg.scripts['test:unit'] = 'npm run test:gematria && npm run test:journal && npm run test:rites && npm run test:correspondences && npm run test:oracle && npm run test:chapters && npm run test:cosmic';
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log('Cosmic timing extraction is current.');
