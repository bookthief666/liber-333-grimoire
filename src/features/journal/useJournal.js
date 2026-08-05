import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getJournalBackupFilename,
  mergeJournalBackup,
  parseJournalBackup,
  serializeJournalBackup,
} from './journalBackup.js';
import {
  countJournalConsultations,
  countNewJournalConsultations,
} from './consultationSemantics.js';
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

    const previousEntries = entriesRef.current;
    const consultationDelta = countNewJournalConsultations(previousEntries, additions);
    const nextEntries = prependJournalEntries(previousEntries, additions);
    const previousTotal = totalReadingsRef.current;
    const nextTotal = previousTotal + consultationDelta;
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
    const consultationCount = countJournalConsultations(entries);
    return {
      filename: getJournalBackupFilename(exportedAt),
      content: serializeJournalBackup({ entries, totalReadings, exportedAt }),
      entryCount: entries.length,
      consultationCount,
      recordCount: entries.length,
      totalReadings,
    };
  }, [entries, totalReadings]);

  const exportMarkdown = useCallback(({ selectedEntries = entries, filterDescription = null } = {}) => {
    const exportedAt = new Date();
    const safeSelectedEntries = Array.isArray(selectedEntries) ? selectedEntries : [];
    const filtered = selectedEntries !== entries || Boolean(filterDescription);
    const consultationCount = countJournalConsultations(safeSelectedEntries);
    return {
      filename: getGrimoireMarkdownFilename(exportedAt, { filtered }),
      content: serializeGrimoireMarkdown({
        entries: safeSelectedEntries,
        totalReadings,
        exportedAt,
        filterDescription,
      }),
      entryCount: safeSelectedEntries.length,
      consultationCount,
      recordCount: safeSelectedEntries.length,
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
      backupConsultationCount: countJournalConsultations(backup.entries),
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
