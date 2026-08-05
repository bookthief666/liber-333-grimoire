import { getGrimoireConsultationKey } from './grimoireWorkbench.js';

function safeEntries(entries) {
  return Array.isArray(entries) ? entries.filter((entry) => entry && typeof entry === 'object') : [];
}

export function countJournalConsultations(entries) {
  return new Set(safeEntries(entries).map((entry) => getGrimoireConsultationKey(entry))).size;
}

export function countNewJournalConsultations(currentEntries, additions) {
  const existingKeys = new Set(
    safeEntries(currentEntries).map((entry) => getGrimoireConsultationKey(entry)),
  );
  const newKeys = new Set();

  safeEntries(additions).forEach((entry) => {
    const key = getGrimoireConsultationKey(entry);
    if (!existingKeys.has(key)) newKeys.add(key);
  });

  return newKeys.size;
}

export function groupJournalEntriesByConsultation(entries) {
  const groups = new Map();

  safeEntries(entries).forEach((entry) => {
    const key = getGrimoireConsultationKey(entry);
    const group = groups.get(key) || { key, entries: [] };
    group.entries.push(entry);
    groups.set(key, group);
  });

  return [...groups.values()];
}

export function retainCompleteJournalConsultations(entries, maxEntries) {
  const limit = Number.isInteger(maxEntries) && maxEntries >= 0 ? maxEntries : 0;
  const retained = [];
  const omitted = [];

  groupJournalEntriesByConsultation(entries).forEach((group) => {
    if (group.entries.length <= limit - retained.length) retained.push(...group.entries);
    else omitted.push(group);
  });

  return {
    entries: retained,
    omittedEntries: omitted.reduce((total, group) => total + group.entries.length, 0),
    omittedConsultations: omitted.length,
  };
}
