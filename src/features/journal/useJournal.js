import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getJournalBackupFilename,
  mergeJournalBackup,
  parseJournalBackup,
  serializeJournalBackup,
} from './journalBackup.js';
import {
  getGrimoireMarkdownFilename,
  serializeGrimoireMarkdown,
} from './journalMarkdown.js';
import { updateGrimoireEntryMetadata } from './grimoireWorkbench.js';
import { migrateJournalEntries } from './journalSchema.js';
import {
  clearStoredJournalEntries,
  getJournalRecurrenceCount,
  getMilestoneCrossed,
  getRecentJournalReadings,
  prependJournalEntries,
  readJournalState,
  removeJournalEntry,
  writeJournalEntries,
  writeTotalReadings,
} from './journalStorage.js';

function getLocalStorage() {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function useJournal() {
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [totalReadings, setTotalReadings] = useState(0);
  const [milestone, setMilestone] = useState(null);
  const entriesRef = useRef([]);
  const totalReadingsRef = useRef(0);

  const commitEntries = useCallback((nextEntries) => {
    entriesRef.current = nextEntries;
    setEntries(nextEntries);
    writeJournalEntries(getLocalStorage(), nextEntries);
  }, []);

  const commitTotal = useCallback((nextTotal) => {
    totalReadingsRef.current = nextTotal;
    setTotalReadings(nextTotal);
    writeTotalReadings(getLocalStorage(), nextTotal);
  }, []);

  const load = useCallback(async () => {
    const state = readJournalState(getLocalStorage());
    entriesRef.current = state.entries;
    totalReadingsRef.current = state.totalReadings;
    setEntries(state.entries);
    setTotalReadings(state.totalReadings);
    setLoaded(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addEntries = useCallback(async (newEntries) => {
    const additions = migrateJournalEntries(Array.isArray(newEntries) ? newEntries : []);
    if (!additions.length) return [];

    const nextEntries = prependJournalEntries(entriesRef.current, additions);
    const previousTotal = totalReadingsRef.current;
    const nextTotal = previousTotal + additions.length;
    commitEntries(nextEntries);
    commitTotal(nextTotal);

    const crossedMilestone = getMilestoneCrossed(previousTotal, nextTotal);
    if (crossedMilestone) setMilestone(crossedMilestone);
    return additions;
  }, [commitEntries, commitTotal]);

  const addEntry = useCallback(async (entry) => {
    const [added = null] = await addEntries([entry]);
    return added;
  }, [addEntries]);

  const removeEntry = useCallback(async (id) => {
    const nextEntries = removeJournalEntry(entriesRef.current, id);
    commitEntries(nextEntries);
  }, [commitEntries]);

  const updateEntryMetadata = useCallback(async (id, patch) => {
    const nextEntries = updateGrimoireEntryMetadata(entriesRef.current, id, patch);
    commitEntries(nextEntries);
    return nextEntries.find((entry) => entry.id === id) || null;
  }, [commitEntries]);

  const setFavorite = useCallback(
    (id, favorite) => updateEntryMetadata(id, { favorite }),
    [updateEntryMetadata],
  );

  const saveNote = useCallback(
    (id, note) => updateEntryMetadata(id, { note }),
    [updateEntryMetadata],
  );

  const clearAll = useCallback(async () => {
    entriesRef.current = [];
    setEntries([]);
    clearStoredJournalEntries(getLocalStorage());
  }, []);

  const exportBackup = useCallback(() => {
    const exportedAt = new Date();
    return {
      filename: getJournalBackupFilename(exportedAt),
      content: serializeJournalBackup({ entries, totalReadings, exportedAt }),
      entryCount: entries.length,
      totalReadings,
    };
  }, [entries, totalReadings]);

  const exportMarkdown = useCallback(({ selectedEntries = entries, filterDescription = null } = {}) => {
    const exportedAt = new Date();
    const filtered = selectedEntries !== entries || Boolean(filterDescription);
    return {
      filename: getGrimoireMarkdownFilename(exportedAt, { filtered }),
      content: serializeGrimoireMarkdown({
        entries: selectedEntries,
        totalReadings,
        exportedAt,
        filterDescription,
      }),
      entryCount: Array.isArray(selectedEntries) ? selectedEntries.length : 0,
      totalReadings,
      filtered,
    };
  }, [entries, totalReadings]);

  const importBackup = useCallback(async (text) => {
    const backup = parseJournalBackup(text);
    const result = mergeJournalBackup({
      currentEntries: entriesRef.current,
      currentTotalReadings: totalReadingsRef.current,
      backup,
    });

    commitEntries(result.entries);
    commitTotal(result.totalReadings);

    return {
      ...result,
      backupExportedAt: backup.exportedAt,
      backupEntryCount: backup.entries.length,
      backupSourceVersion: backup.sourceVersion,
    };
  }, [commitEntries, commitTotal]);

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
    addEntries,
    removeEntry,
    updateEntryMetadata,
    setFavorite,
    saveNote,
    clearAll,
    exportBackup,
    exportMarkdown,
    importBackup,
    getRecurrenceCount,
    getRecentReadings,
  };
}
