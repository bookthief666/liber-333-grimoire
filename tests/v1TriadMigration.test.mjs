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
      legacyTriadEntry('legacy-synthesis', 3, '2026-07-24T01:00:40.000Z'),
      legacyTriadEntry('legacy-antithesis', 2, '2026-07-24T01:00:20.000Z'),
      legacyTriadEntry('legacy-thesis', 1, '2026-07-24T01:00:00.000Z'),
    ],
  };

  const parsed = parseJournalBackup(JSON.stringify(legacyBackup));
  const consultationIds = new Set(parsed.entries.map((entry) => entry.consultationId));

  assert.equal(parsed.sourceVersion, 1);
  assert.equal(consultationIds.size, 1);
  assert.ok(parsed.entries.every((entry) => entry.spreadType === 'triad'));
  assert.deepEqual(
    parsed.entries.map((entry) => entry.spreadPosition),
    ['synthesis', 'antithesis', 'thesis'],
  );
  assert.deepEqual(
    parsed.entries.map((entry) => entry.date),
    [
      '2026-07-24T01:00:40.000Z',
      '2026-07-24T01:00:20.000Z',
      '2026-07-24T01:00:00.000Z',
    ],
  );
  assert.ok(parsed.entries.every((entry) => entry.legacyTriadRecovered === true));

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

test('equal legacy timestamps use newest-first storage order as the chronological tie-breaker', () => {
  const date = '2026-07-24T01:00:00.000Z';
  const parsed = parseJournalBackup(JSON.stringify({
    format: JOURNAL_BACKUP_FORMAT,
    version: 1,
    exportedAt: '2026-07-24T02:00:00.000Z',
    totalReadings: 1,
    entries: [
      legacyTriadEntry('equal-synthesis', 3, date),
      legacyTriadEntry('equal-antithesis', 2, date),
      legacyTriadEntry('equal-thesis', 1, date),
    ],
  }));

  assert.deepEqual(
    Object.fromEntries(parsed.entries.map((entry) => [entry.id, entry.spreadPosition])),
    {
      'equal-synthesis': 'synthesis',
      'equal-antithesis': 'antithesis',
      'equal-thesis': 'thesis',
    },
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
    Object.fromEntries(merged.entries.map((entry) => [entry.id, entry.spreadPosition])),
    {
      'fragment-import-2': 'synthesis',
      'fragment-import-1': 'antithesis',
      'fragment-current': 'thesis',
    },
  );
  assert.ok(merged.entries.every((entry) => entry.legacyTriadFragment !== true));
  assert.ok(merged.entries.every((entry) => entry.legacyTriadRecovered === true));
  assert.equal(merged.importedConsultationCount, 0);
  assert.equal(merged.importedEntryCount, 2);
});

for (const fragmentSize of [1, 2]) {
  test(`a cumulative legacy backup safely completes and replaces ${fragmentSize} overlapping local row(s)`, () => {
    const envelope = (entries) => ({
      format: JOURNAL_BACKUP_FORMAT,
      version: 1,
      exportedAt: '2026-07-24T02:00:00.000Z',
      totalReadings: 1,
      entries,
    });
    const historicalRows = [
      legacyTriadEntry('cumulative-synthesis', 3, '2026-07-24T01:00:40.000Z'),
      legacyTriadEntry('cumulative-antithesis', 2, '2026-07-24T01:00:20.000Z'),
      legacyTriadEntry('cumulative-thesis', 1, '2026-07-24T01:00:00.000Z'),
    ];
    const currentRows = historicalRows.slice(3 - fragmentSize);
    const current = parseJournalBackup(JSON.stringify(envelope(currentRows)));
    current.entries.forEach((entry, index) => {
      entry.favorite = index === 0;
      entry.note = `Keep local note ${index + 1}.`;
      entry.futureReadingLayer = { seal: `local-${index + 1}` };
    });
    const backup = parseJournalBackup(JSON.stringify(envelope(historicalRows)));

    const merged = mergeJournalBackup({
      currentEntries: current.entries,
      currentTotalReadings: current.totalReadings,
      backup,
    });

    assert.equal(countJournalConsultations(merged.entries), 1);
    assert.equal(merged.entries.length, 3);
    assert.equal(merged.importedConsultationCount, 0);
    assert.equal(merged.importedEntryCount, 3 - fragmentSize);
    assert.equal(merged.duplicateCount, fragmentSize);
    assert.deepEqual(
      merged.entries.map((entry) => entry.spreadPosition),
      ['synthesis', 'antithesis', 'thesis'],
    );
    assert.deepEqual(
      merged.entries.map((entry) => entry.date),
      historicalRows.map((entry) => entry.date),
    );
    assert.ok(merged.entries.every((entry) => entry.legacyTriadRecovered === true));
    current.entries.forEach((localEntry, index) => {
      const retained = merged.entries.find((entry) => entry.id === localEntry.id);
      assert.equal(retained.favorite, index === 0);
      assert.equal(retained.note, `Keep local note ${index + 1}.`);
      assert.deepEqual(retained.futureReadingLayer, { seal: `local-${index + 1}` });
    });
    assert.doesNotThrow(() => createJournalBackup({
      entries: merged.entries,
      totalReadings: merged.totalReadings,
    }));
  });
}

test('cumulative recovery preserves newest-first position order when every timestamp is equal', () => {
  const date = '2026-07-24T01:00:00.000Z';
  const envelope = (entries) => JSON.stringify({
    format: JOURNAL_BACKUP_FORMAT,
    version: 1,
    exportedAt: '2026-07-24T02:00:00.000Z',
    totalReadings: 1,
    entries,
  });
  const historicalRows = [
    legacyTriadEntry('tie-synthesis', 3, date),
    legacyTriadEntry('tie-antithesis', 2, date),
    legacyTriadEntry('tie-thesis', 1, date),
  ];
  const current = parseJournalBackup(envelope(historicalRows.slice(2)));
  const backup = parseJournalBackup(envelope(historicalRows));

  const merged = mergeJournalBackup({
    currentEntries: current.entries,
    currentTotalReadings: current.totalReadings,
    backup,
  });

  assert.deepEqual(
    merged.entries.map((entry) => entry.spreadPosition),
    ['synthesis', 'antithesis', 'thesis'],
  );
});

test('capacity-limited cumulative recovery retains the original local fragment', () => {
  const fragmentDate = '2026-07-24T01:00:00.000Z';
  const envelope = (entries) => JSON.stringify({
    format: JOURNAL_BACKUP_FORMAT,
    version: 1,
    exportedAt: '2026-07-24T03:00:00.000Z',
    totalReadings: 50,
    entries,
  });
  const historicalRows = [
    legacyTriadEntry('cap-synthesis', 3, '2026-07-24T01:00:40.000Z'),
    legacyTriadEntry('cap-antithesis', 2, '2026-07-24T01:00:20.000Z'),
    legacyTriadEntry('cap-thesis', 1, fragmentDate),
  ];
  const fragment = parseJournalBackup(envelope(historicalRows.slice(2))).entries[0];
  fragment.favorite = true;
  fragment.note = 'Do not lose this local fragment.';
  fragment.futureReadingLayer = { seal: 'cap-local' };
  const newerSingles = Array.from({ length: 49 }, (_, index) => ({
    ...legacyTriadEntry(
      `cap-single-${index}`,
      (index % 94) - 2,
      new Date(Date.UTC(2026, 6, 24, 2, 0, index)).toISOString(),
    ),
    spreadType: 'single',
  }));
  const backup = parseJournalBackup(envelope(historicalRows));

  const merged = mergeJournalBackup({
    currentEntries: [...newerSingles, fragment],
    currentTotalReadings: 50,
    backup,
  });

  assert.equal(merged.entries.length, 50);
  assert.equal(merged.importedEntryCount, 0);
  assert.equal(merged.omittedByCap, 2);
  const retainedFragment = merged.entries.find((entry) => entry.id === 'cap-thesis');
  assert.equal(retainedFragment.legacyTriadFragment, true);
  assert.equal(retainedFragment.consultationId, undefined);
  assert.equal(retainedFragment.favorite, true);
  assert.equal(retainedFragment.note, 'Do not lose this local fragment.');
  assert.deepEqual(retainedFragment.futureReadingLayer, { seal: 'cap-local' });
});
