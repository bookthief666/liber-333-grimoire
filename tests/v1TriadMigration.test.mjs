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
import { removeJournalEntry } from '../src/features/journal/journalStorage.js';

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
    assert.equal(new Set(parsed.entries.map((entry) => entry.legacyTriadFragmentId)).size, 1);
    assert.ok(parsed.entries.every((entry) => entry.legacyTriadFragmentId));
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
    assert.deepEqual(
      roundTripped.entries.map((entry) => entry.legacyTriadFragmentId),
      parsed.entries.map((entry) => entry.legacyTriadFragmentId),
    );
  });
}

test('marked version 2 fragments without boundary IDs receive conservative persisted identities', () => {
  const entries = [
    legacyTriadEntry('marked-idless-newer', 2, '2026-07-24T01:00:20.000Z'),
    legacyTriadEntry('marked-idless-older', 1, '2026-07-24T01:00:00.000Z'),
  ].map((entry) => ({
    ...entry,
    schemaVersion: 2,
    favorite: false,
    note: '',
    legacyTriadFragment: true,
  }));
  const parsed = parseJournalBackup(JSON.stringify({
    format: JOURNAL_BACKUP_FORMAT,
    version: 2,
    exportedAt: '2026-07-24T02:00:00.000Z',
    totalReadings: 2,
    entries,
  }));

  assert.equal(new Set(parsed.entries.map((entry) => entry.legacyTriadFragmentId)).size, 2);
  assert.equal(countJournalConsultations(parsed.entries), 2);

  const roundTripped = parseJournalBackup(serializeJournalBackup({
    entries: parsed.entries,
    totalReadings: parsed.totalReadings,
    exportedAt: new Date('2026-07-24T03:00:00.000Z'),
  }));
  assert.deepEqual(
    roundTripped.entries.map((entry) => entry.legacyTriadFragmentId),
    parsed.entries.map((entry) => entry.legacyTriadFragmentId),
  );
  assert.deepEqual(
    removeJournalEntry(roundTripped.entries, entries[0].id).map((entry) => entry.id),
    [entries[1].id],
  );
});

test('independently migrated fragments with long common entry-ID prefixes remain distinct', () => {
  const sharedIdPrefix = 'x'.repeat(127);
  const envelope = (entry) => ({
    format: JOURNAL_BACKUP_FORMAT,
    version: 1,
    exportedAt: '2026-07-24T02:00:00.000Z',
    totalReadings: 1,
    entries: [entry],
  });
  const current = parseJournalBackup(JSON.stringify(envelope({
    ...legacyTriadEntry(`${sharedIdPrefix}a`, 1, '2026-07-24T01:00:00.000Z'),
    question: 'Which independent fragment came first?',
  })));
  const backup = parseJournalBackup(JSON.stringify(envelope({
    ...legacyTriadEntry(`${sharedIdPrefix}b`, 2, '2026-07-25T01:00:00.000Z'),
    question: 'Which independent fragment came second?',
  })));

  assert.notEqual(
    current.entries[0].legacyTriadFragmentId,
    backup.entries[0].legacyTriadFragmentId,
  );

  const merged = mergeJournalBackup({
    currentEntries: current.entries,
    currentTotalReadings: current.totalReadings,
    backup,
  });
  assert.equal(countJournalConsultations(merged.entries), 2);
  assert.equal(new Set(merged.entries.map((entry) => entry.legacyTriadFragmentId)).size, 2);
  assert.deepEqual(
    removeJournalEntry(merged.entries, backup.entries[0].id).map((entry) => entry.id),
    [current.entries[0].id],
  );
});

test('import reconsideration preserves two distinct one-row fragment boundaries', () => {
  const envelope = (entry) => ({
    format: JOURNAL_BACKUP_FORMAT,
    version: 1,
    exportedAt: '2026-07-24T02:00:00.000Z',
    totalReadings: 1,
    entries: [entry],
  });
  const current = parseJournalBackup(JSON.stringify(envelope(
    legacyTriadEntry('independent-nearby-current', 1, '2026-07-24T01:00:00.000Z'),
  )));
  const backup = parseJournalBackup(JSON.stringify(envelope(
    legacyTriadEntry('independent-nearby-import', 2, '2026-07-24T01:00:20.000Z'),
  )));

  const merged = mergeJournalBackup({
    currentEntries: current.entries,
    currentTotalReadings: current.totalReadings,
    backup,
  });

  assert.equal(merged.entries.length, 2);
  assert.equal(countJournalConsultations(merged.entries), 2);
  assert.equal(new Set(merged.entries.map((entry) => entry.legacyTriadFragmentId)).size, 2);
  assert.deepEqual(
    removeJournalEntry(merged.entries, backup.entries[0].id).map((entry) => entry.id),
    [current.entries[0].id],
  );
});

test('import reconsideration validates complete boundaries before inferring a 2+1 completion', () => {
  const envelope = (entries) => ({
    format: JOURNAL_BACKUP_FORMAT,
    version: 1,
    exportedAt: '2026-07-24T02:00:00.000Z',
    totalReadings: 1,
    entries,
  });
  const current = parseJournalBackup(JSON.stringify(envelope([
    legacyTriadEntry('independent-two-current-newer', 2, '2026-07-24T01:00:20.000Z'),
    legacyTriadEntry('independent-two-current-older', 1, '2026-07-24T01:00:00.000Z'),
  ])));
  const backup = parseJournalBackup(JSON.stringify(envelope([
    legacyTriadEntry('independent-two-import-newer', 4, '2026-07-24T01:01:00.000Z'),
    legacyTriadEntry('independent-two-import-older', 3, '2026-07-24T01:00:40.000Z'),
  ])));

  const merged = mergeJournalBackup({
    currentEntries: current.entries,
    currentTotalReadings: current.totalReadings,
    backup,
  });

  assert.equal(merged.entries.length, 4);
  assert.equal(countJournalConsultations(merged.entries), 2);
  assert.equal(new Set(merged.entries.map((entry) => entry.legacyTriadFragmentId)).size, 2);
  assert.ok(merged.entries.every((entry) => !entry.consultationId && !entry.spreadPosition));
  assert.deepEqual(
    new Set(removeJournalEntry(merged.entries, backup.entries[0].id).map((entry) => entry.id)),
    new Set(current.entries.map((entry) => entry.id)),
  );
});

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
  const olderImportedSingle = {
    ...legacyTriadEntry('cap-older-import', 4, '2026-07-24T00:59:00.000Z'),
    spreadType: 'single',
  };
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
  const backup = parseJournalBackup(envelope([...historicalRows, olderImportedSingle]));

  const merged = mergeJournalBackup({
    currentEntries: [...newerSingles, fragment],
    currentTotalReadings: 50,
    backup,
  });

  assert.equal(merged.entries.length, 50);
  assert.equal(merged.importedEntryCount, 0);
  assert.equal(merged.omittedByCap, 3);
  assert.equal(merged.entries.some((entry) => entry.id === 'cap-older-import'), false);
  const retainedFragment = merged.entries.find((entry) => entry.id === 'cap-thesis');
  assert.equal(retainedFragment.legacyTriadFragment, true);
  assert.equal(retainedFragment.consultationId, undefined);
  assert.equal(retainedFragment.favorite, true);
  assert.equal(retainedFragment.note, 'Do not lose this local fragment.');
  assert.deepEqual(retainedFragment.futureReadingLayer, { seal: 'cap-local' });
});

test('capacity fallback restores a local fragment completed by differently identified rows', () => {
  const envelope = (entries) => JSON.stringify({
    format: JOURNAL_BACKUP_FORMAT,
    version: 1,
    exportedAt: '2026-07-24T03:00:00.000Z',
    totalReadings: 50,
    entries,
  });
  const historicalRows = [
    legacyTriadEntry('mixed-cap-synthesis', 3, '2026-07-24T01:00:40.000Z'),
    legacyTriadEntry('mixed-cap-antithesis', 2, '2026-07-24T01:00:20.000Z'),
    legacyTriadEntry('mixed-cap-thesis', 1, '2026-07-24T01:00:00.000Z'),
  ];
  const local = parseJournalBackup(envelope(historicalRows.slice(2))).entries[0];
  local.favorite = true;
  local.note = 'Retain the mixed-group local row.';
  const newerSingles = Array.from({ length: 49 }, (_, index) => ({
    ...legacyTriadEntry(
      `mixed-cap-single-${index}`,
      (index % 94) - 2,
      new Date(Date.UTC(2026, 6, 24, 2, 0, index)).toISOString(),
    ),
    spreadType: 'single',
  }));
  const backup = parseJournalBackup(envelope(historicalRows.slice(0, 2)));

  const merged = mergeJournalBackup({
    currentEntries: [...newerSingles, local],
    currentTotalReadings: 50,
    backup,
  });

  assert.equal(merged.entries.length, 50);
  assert.equal(merged.importedEntryCount, 0);
  assert.equal(merged.omittedByCap, 2);
  const retained = merged.entries.find((entry) => entry.id === local.id);
  assert.equal(retained.legacyTriadFragment, true);
  assert.equal(retained.consultationId, undefined);
  assert.equal(retained.favorite, true);
  assert.equal(retained.note, 'Retain the mixed-group local row.');
});

test('capacity fallback restores a local row from an id-less two-fragment mixed group', () => {
  const envelope = (entries) => JSON.stringify({
    format: JOURNAL_BACKUP_FORMAT,
    version: 1,
    exportedAt: '2026-07-24T03:00:00.000Z',
    totalReadings: 50,
    entries,
  });
  const localRow = legacyTriadEntry('idless-cap-local', 1, '2026-07-24T01:00:00.000Z');
  const importedRow = legacyTriadEntry('idless-cap-import', 2, '2026-07-24T01:00:20.000Z');
  const local = parseJournalBackup(envelope([localRow])).entries[0];
  local.favorite = true;
  local.note = 'Retain the id-less mixed fragment.';
  const newerSingles = Array.from({ length: 49 }, (_, index) => ({
    ...legacyTriadEntry(
      `idless-cap-single-${index}`,
      (index % 94) - 2,
      new Date(Date.UTC(2026, 6, 24, 2, 0, index)).toISOString(),
    ),
    spreadType: 'single',
  }));
  const backup = parseJournalBackup(envelope([importedRow]));

  const merged = mergeJournalBackup({
    currentEntries: [...newerSingles, local],
    currentTotalReadings: 50,
    backup,
  });

  assert.equal(merged.entries.length, 50);
  assert.equal(merged.importedEntryCount, 0);
  assert.equal(merged.omittedByCap, 1);
  assert.equal(merged.omittedConsultationCount, 1);
  const retained = merged.entries.find((entry) => entry.id === local.id);
  assert.equal(retained.legacyTriadFragment, true);
  assert.equal(retained.consultationId, undefined);
  assert.equal(retained.favorite, true);
  assert.equal(retained.note, 'Retain the id-less mixed fragment.');
});

test('cap retention does not regroup fragments after separating Triads are omitted', () => {
  const sameQuestion = 'Keep these historical fragments distinct.';
  const fragment = (id, chapter, date) => ({
    ...legacyTriadEntry(id, chapter, date),
    question: sameQuestion,
    legacyTriadFragment: true,
    legacyTriadFragmentId: `retained-${id}`,
  });
  const explicitTriad = (consultationId, date, chapterOffset) => (
    ['thesis', 'antithesis', 'synthesis'].map((spreadPosition, index) => ({
      ...legacyTriadEntry(`${consultationId}-${spreadPosition}`, chapterOffset + index, date),
      question: `Separator ${consultationId}`,
      consultationId,
      spreadType: 'triad',
      spreadPosition,
    }))
  );
  const newerCurrentSingles = Array.from({ length: 41 }, (_, index) => ({
    ...legacyTriadEntry(
      `regroup-current-single-${index}`,
      (index % 41) - 2,
      new Date(Date.UTC(2026, 6, 24, 3, 0, index)).toISOString(),
    ),
    spreadType: 'single',
  }));
  const historicalTail = [
    fragment('regroup-fragment-1', 1, '2026-07-24T01:02:00.000Z'),
    ...explicitTriad('regroup-separator-1', '2026-07-24T01:01:40.000Z', 10),
    fragment('regroup-fragment-2', 2, '2026-07-24T01:01:20.000Z'),
    ...explicitTriad('regroup-separator-2', '2026-07-24T01:01:00.000Z', 20),
    fragment('regroup-fragment-3', 3, '2026-07-24T01:00:40.000Z'),
  ];
  const importedSingles = Array.from({ length: 6 }, (_, index) => ({
    ...legacyTriadEntry(
      `regroup-import-single-${index}`,
      40 + index,
      new Date(Date.UTC(2026, 6, 24, 4, 0, index)).toISOString(),
    ),
    spreadType: 'single',
  }));
  const backup = createJournalBackup({
    entries: importedSingles,
    totalReadings: 6,
    exportedAt: new Date('2026-07-24T05:00:00.000Z'),
  });

  const merged = mergeJournalBackup({
    currentEntries: [...newerCurrentSingles, ...historicalTail],
    currentTotalReadings: 50,
    backup,
  });

  assert.equal(merged.entries.length, 50);
  const retainedFragments = merged.entries.filter((entry) => entry.id.startsWith('regroup-fragment-'));
  assert.equal(retainedFragments.length, 3);
  assert.ok(retainedFragments.every((entry) => entry.legacyTriadFragment === true));
  assert.ok(retainedFragments.every((entry) => !entry.consultationId && !entry.spreadPosition));
  assert.equal(new Set(retainedFragments.map((entry) => entry.legacyTriadFragmentId)).size, 3);
  assert.equal(countJournalConsultations(merged.entries), 50);
});
