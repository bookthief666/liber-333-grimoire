import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const sourcePath = path.join(ROOT, 'src/liber333.jsx');
const modelPath = path.join(ROOT, 'src/features/tree/treeModel.js');

function replaceOnce(source, search, replacement, label) {
  const next = source.replace(search, replacement);
  if (next === source) throw new Error(`Tree model extraction could not replace: ${label}`);
  return next;
}

if (!fs.existsSync(modelPath)) throw new Error('Tree model module is missing');

let app = fs.readFileSync(sourcePath, 'utf8');
const importLine = "import { TREE_NODE_ORDER, TREE_POS, deriveTreePaths, getVeilChapters, groupChaptersBySephira } from './features/tree/treeModel.js';";
const alreadyExtracted = app.includes(importLine) &&
  !app.includes('const TREE_POS =') &&
  !app.includes('const TREE_NODE_ORDER =') &&
  !app.includes('const VEIL_KEYS =') &&
  app.includes('groupChaptersBySephira(LIBER_333)') &&
  app.includes('deriveTreePaths(groups)') &&
  app.includes('getVeilChapters(groups)');

if (!alreadyExtracted) {
  app = replaceOnce(
    app,
    "import { PLANETS, useLunarPhase, usePlanetaryTime } from './features/cosmic/cosmicTiming.js';",
    "import { PLANETS, useLunarPhase, usePlanetaryTime } from './features/cosmic/cosmicTiming.js';\n" + importLine,
    'Tree model import',
  );

  const constantsPattern = /const TREE_POS = \{[\s\S]*?\n\};\nconst TREE_NODE_ORDER = \[[^\n]+\];\nconst VEIL_KEYS = \[[^\n]+\];\n/;
  app = replaceOnce(app, constantsPattern, '', 'Tree constants');

  app = replaceOnce(
    app,
    `  // group every chapter by its sephira/path string
  const groups = useMemo(() => {
    const g = {};
    for (const ch of LIBER_333) {
      const key = ch.sephira || "—";
      (g[key] = g[key] || []).push(ch);
    }
    return g;
  }, []);`,
    `  // group every chapter by its sephira/path string
  const groups = useMemo(() => groupChaptersBySephira(LIBER_333), []);`,
    'chapter grouping',
  );

  app = replaceOnce(
    app,
    `  // path keys = compound "A-B" sephira strings that resolve to two nodes
  const paths = useMemo(() => {
    return Object.keys(groups)
      .filter(k => k.includes("-"))
      .map(k => {
        const [a, b] = k.split("-");
        if (TREE_POS[a] && TREE_POS[b]) return { key: k, a, b };
        return null;
      })
      .filter(Boolean);
  }, [groups]);`,
    `  // path keys = compound "A-B" sephira strings that resolve to two nodes
  const paths = useMemo(() => deriveTreePaths(groups), [groups]);`,
    'path derivation',
  );

  app = replaceOnce(
    app,
    `  const veilChapters = useMemo(
    () => VEIL_KEYS.flatMap(k => groups[k] || []),
    [groups]
  );`,
    `  const veilChapters = useMemo(() => getVeilChapters(groups), [groups]);`,
    'veil aggregation',
  );

  fs.writeFileSync(sourcePath, app);
}

const integrated = fs.readFileSync(sourcePath, 'utf8');
for (const legacyDeclaration of ['const TREE_POS =', 'const TREE_NODE_ORDER =', 'const VEIL_KEYS =']) {
  if (integrated.includes(legacyDeclaration)) throw new Error(`Legacy Tree declaration remains: ${legacyDeclaration}`);
}
for (const required of [
  importLine,
  'groupChaptersBySephira(LIBER_333)',
  'deriveTreePaths(groups)',
  'getVeilChapters(groups)',
  'The 96 chapters mapped to the 10 Sephiroth and 22 Paths',
]) {
  if (!integrated.includes(required)) throw new Error(`Required Tree integration seam is missing: ${required}`);
}

const packagePath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts['test:tree'] = 'node --test tests/treeModel.test.mjs';
pkg.scripts['test:unit'] = 'npm run test:gematria && npm run test:journal && npm run test:rites && npm run test:correspondences && npm run test:oracle && npm run test:chapters && npm run test:cosmic && npm run test:tree';
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log('Tree of Life model extraction is current.');
