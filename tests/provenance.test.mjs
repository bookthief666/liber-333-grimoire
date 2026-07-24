import test from 'node:test';
import assert from 'node:assert/strict';
import { LIBER_333 } from '../src/data/liber333.js';
import {
  CORPUS_CONVENTION,
  PROVENANCE_LABELS,
  PROVENANCE_NOTES,
  getCorpusConventionSummary,
  getCorpusRecordCount,
} from '../src/data/provenance.js';

test('corpus count is derived from the actual dataset', () => {
  assert.equal(getCorpusRecordCount(LIBER_333), 94);
  assert.equal(getCorpusRecordCount(null), 0);
  assert.equal(getCorpusRecordCount({ length: 94 }), 0);
});

test('corpus convention remains explicit', () => {
  assert.deepEqual(CORPUS_CONVENTION, {
    preliminaryRecords: 2,
    numberedStart: 0,
    numberedEnd: 91,
  });
  assert.equal(
    getCorpusConventionSummary(LIBER_333),
    '94 records: two preliminary veil entries, followed by Chapters 0–91.',
  );
});

test('reader labels distinguish the three interpretive layers', () => {
  assert.equal(PROVENANCE_LABELS.sourceText, 'SOURCE TEXT');
  assert.equal(PROVENANCE_LABELS.editorialCommentary, 'MODERN EDITORIAL COMMENTARY');
  assert.equal(PROVENANCE_LABELS.aiInterpretation, 'AI-GENERATED INTERPRETATION');
  assert.match(PROVENANCE_NOTES.sourceText, /Crowley/);
  assert.match(PROVENANCE_NOTES.editorialCommentary, /not presented as Crowley/);
  assert.match(PROVENANCE_NOTES.aiInterpretation, /external AI provider/);
  assert.match(PROVENANCE_NOTES.corpus, /94 records/);
});
