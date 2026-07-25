import { useCallback, useEffect, useState } from 'react';
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

  const load = useCallback(async () => {
    const state = readJournalState(getLocalStorage());
    setEntries(state.entries);
    setTotalReadings(state.totalReadings);
    setLoaded(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (newEntries) => {
    writeJournalEntries(getLocalStorage(), newEntries);
  }, []);

  const addEntry = useCallback(async (entry) => {
    const newEntries = prependJournalEntry(entries, entry);
    setEntries(newEntries);
    await save(newEntries);

    const newTotal = totalReadings + 1;
    setTotalReadings(newTotal);
    writeTotalReadings(getLocalStorage(), newTotal);

    const nextMilestone = getMilestoneForTotal(newTotal);
    if (nextMilestone) setMilestone(nextMilestone);
  }, [entries, save, totalReadings]);

  const removeEntry = useCallback(async (id) => {
    const newEntries = removeJournalEntry(entries, id);
    setEntries(newEntries);
    await save(newEntries);
  }, [entries, save]);

  const updateEntryMetadata = useCallback(async (id, patch) => {
    const newEntries = updateGrimoireEntryMetadata(entries, id, patch);
    setEntries(newEntries);
    await save(newEntries);
    return newEntries.find((entry) => entry.id === id) || null;
  }, [entries, save]);

  const setFavorite = useCallback(
    (id, favorite) => updateEntryMetadata(id, { favorite }),
    [updateEntryMetadata],
  );

  const saveNote = useCallback(
    (id, note) => updateEntryMetadata(id, { note }),
    [updateEntryMetadata],
  );

  const clearAll = useCallback(async () => {
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
      currentEntries: entries,
      currentTotalReadings: totalReadings,
      backup,
    });

    setEntries(result.entries);
    setTotalReadings(result.totalReadings);
    writeJournalEntries(getLocalStorage(), result.entries);
    writeTotalReadings(getLocalStorage(), result.totalReadings);

    return {
      ...result,
      backupExportedAt: backup.exportedAt,
      backupEntryCount: backup.entries.length,
      backupSourceVersion: backup.sourceVersion,
    };
  }, [entries, totalReadings]);

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
