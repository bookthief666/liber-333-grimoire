export const CORPUS_CONVENTION = Object.freeze({
  preliminaryRecords: 2,
  numberedStart: 0,
  numberedEnd: 91,
});

export const getCorpusRecordCount = (records) => Array.isArray(records) ? records.length : 0;

export const getCorpusConventionSummary = (records) => {
  const count = getCorpusRecordCount(records);
  return `${count} records: two preliminary veil entries, followed by Chapters 0–91.`;
};

export const PROVENANCE_LABELS = Object.freeze({
  sourceText: 'SOURCE TEXT',
  editorialCommentary: 'MODERN EDITORIAL COMMENTARY',
  oracleInterpretation: 'ORACLE INTERPRETATION',
});

export const PROVENANCE_NOTES = Object.freeze({
  sourceText: "The displayed chapter verse is Crowley's published Liber CCCXXXIII source text.",
  editorialCommentary: 'The commentary is modern editorial interpretation supplied by this digital edition; it is not presented as Crowley’s own commentary unless explicitly identified.',
  oracleInterpretation: 'The Oracle section is an optional interpretive response shaped from the question, selected chapter data, and available reading context. It remains distinct from both source text and editorial commentary.',
  corpus: 'This edition stores 94 records because it includes two preliminary veil entries before Chapters 0 through 91. Traditional descriptions may count the work differently depending on whether preliminary material and Chapter 0 are included.',
});
