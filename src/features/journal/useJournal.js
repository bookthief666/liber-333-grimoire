import { useCallback, useEffect, useState } from 'react';
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
