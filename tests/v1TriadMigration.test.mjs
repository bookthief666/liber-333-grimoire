import test from 'node:test';
import assert from 'node:assert/strict';

import {
  JOURNAL_BACKUP_FORMAT,
  createJournalBackup,
  mergeJournalBackup,
  parseJournalBackup,
  serializeJournalBackup,
} from '../src/features/journal/journalBackup.js';
import { countJournalConsultations } from '../src/features/journal/consultationSemantics.js';

const legacyTriadEntry = (id, chapter, date) => ({
  id,
  date,
  question: 'How should this contradiction be reconciled?',
  chapter,
  title: 'Legacy client title',
  gematria: 333,
  interpretation: null,
  spreadType: 'Thesis/Antithesis/Synthesis',
  planetary: 'Mercury',
  lunar: 'Full Moon',
});

test('version 1 Triads are upgraded before merge and remain strict-v2 exportable', () => {
  const legacyBackup = {
    format: JOURNAL_BACKUP_FORMAT,
    version: 1,
    exportedAt: '2026-07-24T02:00:00.000Z',
    totalReadings: 1,
    entries: [
      legacyTriadEntry('legacy-thesis', 1, '2026-07-24T01:00:00.000Z'),
      legacyTriadEntry('legacy-antithesis', 2, '2026-07-24T01:00:20.000Z'),
      legacyTriadEntry('legacy-synthesis', 3, '2026-07-24T01:00:40.000Z'),
    ],
  };

  const parsed = parseJournalBackup(JSON.stringify(legacyBackup));
  const consultationIds = new Set(parsed.entries.map((entry) => entry.consultationId));

  assert.equal(parsed.sourceVersion, 1);
  assert.equal(consultationIds.size, 1);
  assert.ok(parsed.entries.every((entry) => entry.spreadType === 'triad'));
  assert.deepEqual(
    parsed.entries.map((entry) => entry.spreadPosition),
    ['thesis', 'antithesis', 'synthesis'],
  );
  assert.ok(parsed.entries.every((entry) => entry.date === '2026-07-24T01:00:00.000Z'));

  const merged = mergeJournalBackup({
    currentEntries: [],
    currentTotalReadings: 0,
    backup: parsed,
  });
  const exported = createJournalBackup({
    entries: merged.entries,
    totalReadings: merged.totalReadings,
    exportedAt: new Date('2026-07-24T03:00:00.000Z'),
  });

  assert.equal(merged.importedConsultationCount, 1);
  assert.equal(merged.importedEntryCount, 3);
  assert.equal(exported.entries.length, 3);
  assert.equal(new Set(exported.entries.map((entry) => entry.consultationId)).size, 1);
  assert.deepEqual(
    new Set(exported.entries.map((entry) => entry.spreadPosition)),
    new Set(['thesis', 'antithesis', 'synthesis']),
  );
});

for (const fragmentSize of [1, 2]) {
  test(`version 1 ${fragmentSize}-row Triad remnants remain losslessly round-trippable`, () => {
    const entries = Array.from({ length: fragmentSize }, (_, index) => (
      legacyTriadEntry(
        `legacy-fragment-${fragmentSize}-${index}`,
        index + 1,
        new Date(Date.UTC(2026, 6, 24, 1, 0, index * 20)).toISOString(),
      )
    ));
    const legacyBackup = {
      format: JOURNAL_BACKUP_FORMAT,
      version: 1,
      exportedAt: '2026-07-24T02:00:00.000Z',
      totalReadings: 1,
      entries,
    };

    const parsed = parseJournalBackup(JSON.stringify(legacyBackup));
    assert.equal(parsed.entries.length, fragmentSize);
    assert.equal(countJournalConsultations(parsed.entries), 1);
    assert.ok(parsed.entries.every((entry) => entry.legacyTriadFragment === true));
    assert.ok(parsed.entries.every((entry) => !entry.consultationId && !entry.spreadPosition));
    assert.deepEqual(
      parsed.entries.map(({ id, date, chapter, question, gematria }) => ({ id, date, chapter, question, gematria })),
      entries.map(({ id, date, chapter, question, gematria }) => ({ id, date, chapter, question, gematria })),
    );

    const roundTripped = parseJournalBackup(serializeJournalBackup({
      entries: parsed.entries,
      totalReadings: parsed.totalReadings,
      exportedAt: new Date('2026-07-24T03:00:00.000Z'),
    }));
    assert.equal(roundTripped.sourceVersion, 2);
    assert.equal(roundTripped.entries.length, fragmentSize);
    assert.equal(countJournalConsultations(roundTripped.entries), 1);
    assert.ok(roundTripped.entries.every((entry) => entry.legacyTriadFragment === true));
  });
}

test('import completion upgrades historical fragments in the returned in-memory state', () => {
  const envelope = (entries) => ({
    format: JOURNAL_BACKUP_FORMAT,
    version: 1,
    exportedAt: '2026-07-24T02:00:00.000Z',
    totalReadings: 1,
    entries,
  });
  const historicalRows = [
    legacyTriadEntry('fragment-current', 1, '2026-07-24T01:00:00.000Z'),
    legacyTriadEntry('fragment-import-1', 2, '2026-07-24T01:00:20.000Z'),
    legacyTriadEntry('fragment-import-2', 3, '2026-07-24T01:00:40.000Z'),
  ];
  const current = parseJournalBackup(JSON.stringify(envelope(historicalRows.slice(0, 1))));
  const backup = parseJournalBackup(JSON.stringify(envelope(historicalRows.slice(1))));

  const merged = mergeJournalBackup({
    currentEntries: current.entries,
    currentTotalReadings: current.totalReadings,
    backup,
  });

  assert.equal(countJournalConsultations(merged.entries), 1);
  assert.equal(new Set(merged.entries.map((entry) => entry.consultationId)).size, 1);
  assert.deepEqual(
    merged.entries.map((entry) => entry.spreadPosition),
    ['thesis', 'antithesis', 'synthesis'],
  );
  assert.ok(merged.entries.every((entry) => entry.legacyTriadFragment !== true));
  assert.equal(merged.importedConsultationCount, 0);
  assert.equal(merged.importedEntryCount, 2);
});
