import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const sourcePath = path.join(ROOT, 'src/liber333.jsx');

function replaceOnce(source, search, replacement, label) {
  const next = source.replace(search, replacement);
  if (next === source) throw new Error(`Oracle extraction could not replace: ${label}`);
  return next;
}

let app = fs.readFileSync(sourcePath, 'utf8');

app = replaceOnce(
  app,
  "import { fetchOracleInterpretation, streamOracleInterpretation } from './api.js';",
  "import { fetchOracleInterpretation } from './api.js';\nimport { useAIOracle } from './features/oracle/useAIOracle.js';",
  'Oracle imports',
);

const oracleLabel = '//  AI ORACLE (Enhanced with journal context)';
const ritesLabel = '//  GUIDED RITUALS — the three performable rites of Liber 333';
const oracleLabelIndex = app.indexOf(oracleLabel);
const ritesLabelIndex = app.indexOf(ritesLabel, oracleLabelIndex);
if (oracleLabelIndex === -1 || ritesLabelIndex === -1) {
  throw new Error('Oracle extraction could not find the hook section boundaries');
}

const sectionStart = app.lastIndexOf('// ─', oracleLabelIndex);
const sectionEnd = app.lastIndexOf('// ─', ritesLabelIndex);
if (sectionStart === -1 || sectionEnd === -1 || sectionEnd <= sectionStart) {
  throw new Error('Oracle extraction found invalid hook section boundaries');
}
app = app.slice(0, sectionStart) + app.slice(sectionEnd);

app = replaceOnce(
  app,
  'const oracle = useAIOracle();',
  'const oracle = useAIOracle(PLANETS);',
  'Oracle hook invocation',
);

if (app.includes('const useAIOracle =')) {
  throw new Error('Legacy useAIOracle hook remains in src/liber333.jsx');
}
if (app.includes('streamOracleInterpretation')) {
  throw new Error('Streaming provider import or usage remains in src/liber333.jsx');
}
if (!app.includes("import { useAIOracle } from './features/oracle/useAIOracle.js';")) {
  throw new Error('Extracted Oracle hook import is missing');
}
if (!app.includes('const oracle = useAIOracle(PLANETS);')) {
  throw new Error('Existing planetary attribution table is not injected into the Oracle hook');
}

fs.writeFileSync(sourcePath, app);

const packagePath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts['test:oracle'] = 'node --test tests/oraclePrompts.test.mjs';
pkg.scripts['test:unit'] = 'npm run test:gematria && npm run test:journal && npm run test:rites && npm run test:correspondences && npm run test:oracle';
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log('Oracle hook and prompt extraction applied successfully.');
