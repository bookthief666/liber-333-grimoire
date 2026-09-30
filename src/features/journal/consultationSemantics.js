import {
  assignJournalConsultationKeys,
  getJournalConsultationKey,
} from './consultationIdentity.js';

function safeEntries(entries) {
  return Array.isArray(entries) ? entries.filter((entry) => entry && typeof entry === 'object') : [];
}

function timestamp(entry) {
  const value = Date.parse(entry?.date);
  return Number.isNaN(value) ? 0 : value;
}

export function groupJournalEntriesByConsultation(entries) {
  const normalized = safeEntries(entries);
  const keys = assignJournalConsultationKeys(normalized);
  const groups = new Map();

  normalized.forEach((entry, index) => {
    const key = keys[index] || getJournalConsultationKey(entry);
    const group = groups.get(key) || { key, entries: [] };
    group.entries.push(entry);
    groups.set(key, group);
  });

  return [...groups.values()];
}

export function countJournalConsultations(entries) {
  return groupJournalEntriesByConsultation(entries).length;
}

export function countNewJournalConsultations(currentEntries, additions) {
  const current = safeEntries(currentEntries).map((entry, index) => ({ entry, source: 'current', index }));
  const added = safeEntries(additions).map((entry, index) => ({ entry, source: 'addition', index }));
  const combined = [...current, ...added]
    .sort((left, right) => (
      timestamp(right.entry) - timestamp(left.entry)
      || (left.source === right.source ? left.index - right.index : left.source === 'current' ? -1 : 1)
    ));
  const keys = assignJournalConsultationKeys(combined.map((item) => item.entry));
  const sourcesByKey = new Map();

  combined.forEach((item, index) => {
    const key = keys[index] || getJournalConsultationKey(item.entry);
    const sources = sourcesByKey.get(key) || new Set();
    sources.add(item.source);
    sourcesByKey.set(key, sources);
  });

  return [...sourcesByKey.values()]
    .filter((sources) => sources.has('addition') && !sources.has('current'))
    .length;
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
