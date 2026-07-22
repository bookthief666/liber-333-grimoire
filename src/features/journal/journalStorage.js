export const JOURNAL_STORAGE_KEY = 'liber333_journal';
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
