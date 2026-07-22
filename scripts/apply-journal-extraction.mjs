import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const sourcePath = path.join(ROOT, 'src/liber333.jsx');

function write(relativePath, content) {
  const target = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function replaceOnce(source, search, replacement, label) {
  const next = source.replace(search, replacement);
  if (next === source) throw new Error(`Journal extraction could not replace: ${label}`);
  return next;
}

let app = fs.readFileSync(sourcePath, 'utf8');

const journalStorage = `export const JOURNAL_STORAGE_KEY = 'liber333_journal';
export const TOTAL_READINGS_STORAGE_KEY = 'liber333_total';
export const MAX_JOURNAL_ENTRIES = 50;
export const JOURNAL_MILESTONES = Object.freeze([33, 66, 93, 333]);

export function readJournalState(storage) {
  let entries = [];
  let totalReadings = 0;

  try {
    const raw = storage?.getItem(JOURNAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      entries = Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    entries = [];
  }

  try {
    const countRaw = storage?.getItem(TOTAL_READINGS_STORAGE_KEY);
    if (countRaw) totalReadings = parseInt(countRaw) || 0;
  } catch {
    totalReadings = 0;
  }

  return { entries, totalReadings };
}

export function prependJournalEntry(entries, entry) {
  return [entry, ...entries].slice(0, MAX_JOURNAL_ENTRIES);
}

export function removeJournalEntry(entries, id) {
  return entries.filter((entry) => entry.id !== id);
}

export function getJournalRecurrenceCount(entries, chapterNum) {
  return entries.filter((entry) => entry.chapter === chapterNum).length;
}

export function getRecentJournalReadings(entries, limit = 5) {
  return entries.slice(0, limit);
}

export function getMilestoneForTotal(totalReadings) {
  return JOURNAL_MILESTONES.includes(totalReadings) ? totalReadings : null;
}

export function writeJournalEntries(storage, entries) {
  try {
    storage?.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Browser storage is best-effort; preserve the current in-memory session.
  }
}

export function writeTotalReadings(storage, totalReadings) {
  try {
    storage?.setItem(TOTAL_READINGS_STORAGE_KEY, String(totalReadings));
  } catch {
    // Browser storage is best-effort; preserve the current in-memory session.
  }
}

export function clearStoredJournalEntries(storage) {
  try {
    storage?.removeItem(JOURNAL_STORAGE_KEY);
  } catch {
    // Clear remains best-effort, matching the existing implementation.
  }
}
`;

const useJournal = `import { useCallback, useEffect, useState } from 'react';
import {
  clearStoredJournalEntries,
  getJournalRecurrenceCount,
  getMilestoneForTotal,
  getRecentJournalReadings,
  prependJournalEntry,
  readJournalState,
  removeJournalEntry,
  writeJournalEntries,
  writeTotalReadings,
} from './journalStorage.js';

export function useJournal() {
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [totalReadings, setTotalReadings] = useState(0);
  const [milestone, setMilestone] = useState(null);

  const load = useCallback(async () => {
    const state = readJournalState(localStorage);
    setEntries(state.entries);
    setTotalReadings(state.totalReadings);
    setLoaded(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (newEntries) => {
    writeJournalEntries(localStorage, newEntries);
  }, []);

  const addEntry = useCallback(async (entry) => {
    const newEntries = prependJournalEntry(entries, entry);
    setEntries(newEntries);
    await save(newEntries);

    const newTotal = totalReadings + 1;
    setTotalReadings(newTotal);
    writeTotalReadings(localStorage, newTotal);

    const nextMilestone = getMilestoneForTotal(newTotal);
    if (nextMilestone) setMilestone(nextMilestone);
  }, [entries, save, totalReadings]);

  const removeEntry = useCallback(async (id) => {
    const newEntries = removeJournalEntry(entries, id);
    setEntries(newEntries);
    await save(newEntries);
  }, [entries, save]);

  const clearAll = useCallback(async () => {
    setEntries([]);
    clearStoredJournalEntries(localStorage);
  }, []);

  const getRecurrenceCount = useCallback(
    (chapterNum) => getJournalRecurrenceCount(entries, chapterNum),
    [entries],
  );

  const getRecentReadings = useCallback(
    (limit = 5) => getRecentJournalReadings(entries, limit),
    [entries],
  );

  const dismissMilestone = useCallback(() => setMilestone(null), []);

  return {
    entries,
    loaded,
    totalReadings,
    milestone,
    dismissMilestone,
    addEntry,
    removeEntry,
    clearAll,
    getRecurrenceCount,
    getRecentReadings,
  };
}
`;

write('src/features/journal/journalStorage.js', journalStorage);
write('src/features/journal/useJournal.js', useJournal);

app = replaceOnce(
  app,
  "import { calculateGematria, findCorrespondences, stringToHash } from './features/gematria/gematriaEngine.js';",
  "import { calculateGematria, findCorrespondences, stringToHash } from './features/gematria/gematriaEngine.js';\nimport { useJournal } from './features/journal/useJournal.js';",
  'journal hook import',
);

app = replaceOnce(
  app,
  /\n\/\/ ─+\n\/\/  JOURNAL \(Enhanced with recurrence \+ milestones\)\n\/\/ ─+\nconst MAX_JOURNAL = 50;\nconst MILESTONES = \[33, 66, 93, 333\];\n/,
  '\n',
  'journal constants',
);

app = replaceOnce(
  app,
  /\nconst useJournal = \(\) => \{[\s\S]*?\n\};\n\n(?=\/\/ ─+\n\/\/  GEMATRIA ECHOES)/,
  '\n',
  'useJournal hook',
);

for (const legacyDefinition of ['const MAX_JOURNAL', 'const MILESTONES', 'const useJournal']) {
  if (app.includes(legacyDefinition)) throw new Error(`Legacy journal definition remains: ${legacyDefinition}`);
}

fs.writeFileSync(sourcePath, app);

const tests = `import test from 'node:test';
import assert from 'node:assert/strict';

import {
  JOURNAL_STORAGE_KEY,
  TOTAL_READINGS_STORAGE_KEY,
  MAX_JOURNAL_ENTRIES,
  clearStoredJournalEntries,
  getJournalRecurrenceCount,
  getMilestoneForTotal,
  getRecentJournalReadings,
  prependJournalEntry,
  readJournalState,
  removeJournalEntry,
  writeJournalEntries,
  writeTotalReadings,
} from '../src/features/journal/journalStorage.js';

class FakeStorage {
  constructor(initial = {}) {
    this.values = new Map(Object.entries(initial));
  }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

const legacyEntry = {
  id: 'legacy-1',
  date: '2026-07-01T00:00:00.000Z',
  question: 'What remains unfinished?',
  chapter: 8,
  title: 'STEEPED HORSEHAIR',
  gematria: 314,
  interpretation: 'Legacy reflection',
  spreadType: 'single',
  planetary: 'Mercury',
  lunar: 'Full Moon',
};

test('loads the existing unversioned journal array and lifetime counter unchanged', () => {
  const storage = new FakeStorage({
    [JOURNAL_STORAGE_KEY]: JSON.stringify([legacyEntry]),
    [TOTAL_READINGS_STORAGE_KEY]: '33',
  });

  assert.deepEqual(readJournalState(storage), {
    entries: [legacyEntry],
    totalReadings: 33,
  });
});

test('malformed or non-array journal data falls back to an empty list', () => {
  assert.deepEqual(readJournalState(new FakeStorage({ [JOURNAL_STORAGE_KEY]: '{bad' })).entries, []);
  assert.deepEqual(readJournalState(new FakeStorage({ [JOURNAL_STORAGE_KEY]: JSON.stringify({ entries: [] }) })).entries, []);
  assert.equal(readJournalState(new FakeStorage({ [TOTAL_READINGS_STORAGE_KEY]: 'not-a-number' })).totalReadings, 0);
});

test('new entries remain newest-first and capped at fifty', () => {
  const existing = Array.from({ length: MAX_JOURNAL_ENTRIES }, (_, index) => ({ id: String(index) }));
  const newest = { ...legacyEntry, id: 'newest' };
  const result = prependJournalEntry(existing, newest);

  assert.equal(result.length, MAX_JOURNAL_ENTRIES);
  assert.equal(result[0], newest);
  assert.equal(result.at(-1).id, '48');
});

test('removal, recurrence, and recent-reading helpers preserve current semantics', () => {
  const entries = [
    { id: 'a', chapter: 8 },
    { id: 'b', chapter: 8 },
    { id: 'c', chapter: '8' },
    { id: 'd', chapter: 44 },
  ];

  assert.deepEqual(removeJournalEntry(entries, 'b').map((entry) => entry.id), ['a', 'c', 'd']);
  assert.equal(getJournalRecurrenceCount(entries, 8), 2);
  assert.deepEqual(getRecentJournalReadings(entries, 2).map((entry) => entry.id), ['a', 'b']);
});

test('milestones remain limited to the four established lifetime totals', () => {
  assert.deepEqual([33, 66, 93, 333].map(getMilestoneForTotal), [33, 66, 93, 333]);
  assert.equal(getMilestoneForTotal(32), null);
  assert.equal(getMilestoneForTotal(334), null);
});

test('clear removes saved entries but intentionally preserves the lifetime counter', () => {
  const storage = new FakeStorage();
  writeJournalEntries(storage, [legacyEntry]);
  writeTotalReadings(storage, 93);
  clearStoredJournalEntries(storage);

  assert.equal(storage.getItem(JOURNAL_STORAGE_KEY), null);
  assert.equal(storage.getItem(TOTAL_READINGS_STORAGE_KEY), '93');
});
`;

write('tests/journalStorage.test.mjs', tests);

const packagePath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts['test:journal'] = 'node --test tests/journalStorage.test.mjs';
pkg.scripts['test:unit'] = 'npm run test:gematria && npm run test:journal';
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

write('docs/JOURNAL_EXTRACTION.md', `# Journal Persistence Extraction

This milestone moves the existing journal hook and local-storage mechanics out of the single-file application without redesigning the Grimoire.

## Storage contract preserved

- entries key: \`liber333_journal\`;
- lifetime total key: \`liber333_total\`;
- journal payload: the existing unversioned array of entry objects;
- newest saved entry appears first;
- at most 50 entries are retained;
- milestones occur at 33, 66, 93, and 333 lifetime saved readings;
- Clear All removes the entries key but deliberately leaves the lifetime total intact.

## Extracted modules

- \`journalStorage.js\`: pure persistence and list helpers;
- \`useJournal.js\`: the React hook consumed by the application.

No entry fields, UI, recurrence language, milestone copy, or save choreography are changed in this PR.

## Regression command

\`npm run test:journal\`
`);

console.log('Journal extraction applied successfully.');
