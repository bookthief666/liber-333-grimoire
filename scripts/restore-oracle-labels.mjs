import fs from 'node:fs';

const path = 'src/liber333.jsx';
let source = fs.readFileSync(path, 'utf8');

const replacements = [
  [
    '<ExpandableSection title={isSpread ? `${PROVENANCE_LABELS.aiInterpretation} · TRIAD SYNTHESIS` : PROVENANCE_LABELS.aiInterpretation} icon="☉" defaultOpen={true} accentColor={accentColor}>',
    '<ExpandableSection title={isSpread ? "ORACLE OF THE ABYSS · TRIAD SYNTHESIS" : "ORACLE OF THE ABYSS"} icon="☉" defaultOpen={true} accentColor={accentColor}>',
  ],
  [
    '<p><span className="lux-crimson">{PROVENANCE_LABELS.aiInterpretation}:</span> {PROVENANCE_NOTES.aiInterpretation}</p>',
    '<p><span className="lux-crimson">{PROVENANCE_LABELS.oracleInterpretation}:</span> {PROVENANCE_NOTES.oracleInterpretation}</p>',
  ],
];

let changed = false;
for (const [from, to] of replacements) {
  if (source.includes(to)) continue;
  if (!source.includes(from)) {
    throw new Error(`Expected Oracle-label seam not found: ${from.slice(0, 120)}`);
  }
  source = source.replace(from, to);
  changed = true;
}

if (/AI-GENERATED INTERPRETATION/i.test(source)) {
  throw new Error('The reader still contains the rejected AI-generated label.');
}

if (changed) fs.writeFileSync(path, source);
console.log(changed ? 'Restored Oracle-facing labels.' : 'Oracle-facing labels already restored.');
