import fs from 'node:fs';

const path = 'src/liber333.jsx';
let source = fs.readFileSync(path, 'utf8');

const replacements = [
  [
    "import { LIBER_333 } from './data/liber333.js';",
    "import { LIBER_333 } from './data/liber333.js';\nimport { PROVENANCE_LABELS, PROVENANCE_NOTES, getCorpusConventionSummary, getCorpusRecordCount } from './data/provenance.js';",
  ],
  [
    '//  TREE OF LIFE — interactive map of all 93 chapters',
    '//  TREE OF LIFE — interactive map of the complete corpus',
  ],
  [
    '        The 96 chapters mapped to the 10 Sephiroth and 22 Paths · tap a sphere or path',
    '        {getCorpusRecordCount(LIBER_333)} records mapped to the 10 Sephiroth and 22 Paths · tap a sphere or path',
  ],
  [
    '                  93 chapters · gematric divination · the Oracle of the Abyss',
    '                  {getCorpusRecordCount(LIBER_333)} records · English Ordinal divination · the Oracle of the Abyss',
  ],
  [
    '                  <div aria-hidden="true" className="lux-crimson text-sm mb-3" style={{ fontFamily: "\'UnifrakturCook\', serif" }}>✦ ❧ ✦</div>',
    '                  <div className="text-[10px] tracking-[0.28em] lux-dim mb-3" style={{ fontFamily: \'JetBrains Mono, monospace\' }}>{PROVENANCE_LABELS.sourceText}</div>\n                  <div aria-hidden="true" className="lux-crimson text-sm mb-3" style={{ fontFamily: "\'UnifrakturCook\', serif" }}>✦ ❧ ✦</div>',
  ],
  [
    '<ExpandableSection title="Commentary" icon="☥" defaultOpen={true} accentColor={accentColor}>',
    '<ExpandableSection title={PROVENANCE_LABELS.editorialCommentary} icon="☥" defaultOpen={true} accentColor={accentColor}>',
  ],
  [
    '<ExpandableSection title={isSpread ? "ORACLE OF THE ABYSS · TRIAD SYNTHESIS" : "ORACLE OF THE ABYSS"} icon="☉" defaultOpen={true} accentColor={accentColor}>',
    '<ExpandableSection title={isSpread ? `${PROVENANCE_LABELS.aiInterpretation} · TRIAD SYNTHESIS` : PROVENANCE_LABELS.aiInterpretation} icon="☉" defaultOpen={true} accentColor={accentColor}>',
  ],
  [
    '                  <ExpandableSection title="Qabalistic Analysis" icon="♁" defaultOpen={false} accentColor={accentColor}>',
    '                  <ExpandableSection title="PROVENANCE & EDITION NOTE" icon="§" defaultOpen={false} accentColor={accentColor}>\n                    <div className="pt-1 space-y-3 text-[13px] leading-relaxed" style={{ fontFamily: "\'IM Fell English\', Georgia, serif" }}>\n                      <p><span className="lux-crimson">{PROVENANCE_LABELS.sourceText}:</span> {PROVENANCE_NOTES.sourceText}</p>\n                      <p><span className="lux-crimson">{PROVENANCE_LABELS.editorialCommentary}:</span> {PROVENANCE_NOTES.editorialCommentary}</p>\n                      <p><span className="lux-crimson">{PROVENANCE_LABELS.aiInterpretation}:</span> {PROVENANCE_NOTES.aiInterpretation}</p>\n                      <p><span className="lux-crimson">CORPUS CONVENTION:</span> {getCorpusConventionSummary(LIBER_333)} {PROVENANCE_NOTES.corpus}</p>\n                    </div>\n                  </ExpandableSection>\n\n                  <ExpandableSection title="Qabalistic Analysis" icon="♁" defaultOpen={false} accentColor={accentColor}>',
  ],
];

let changed = false;
for (const [from, to] of replacements) {
  if (source.includes(to)) continue;
  if (!source.includes(from)) {
    throw new Error(`Expected integration seam not found: ${from.slice(0, 100)}`);
  }
  source = source.replace(from, to);
  changed = true;
}

if (changed) fs.writeFileSync(path, source);
console.log(changed ? 'Applied provenance integration.' : 'Provenance integration already applied.');
