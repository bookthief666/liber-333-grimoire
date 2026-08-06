import {
  assignJournalConsultationKeys,
  normalizeJournalSpreadType,
} from './consultationIdentity.js';

export const JOURNAL_ENTRY_SCHEMA_VERSION = 2;
export const JOURNAL_NOTE_LIMIT = 12_000;
export const JOURNAL_CONSULTATION_ID_LIMIT = 128;

const SPREAD_POSITIONS = new Set(['single', 'thesis', 'antithesis', 'synthesis']);
const TRIAD_POSITION_LIST = Object.freeze(['thesis', 'antithesis', 'synthesis']);

function timestamp(entry) {
  const value = Date.parse(entry?.date);
  return Number.isNaN(value) ? 0 : value;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeOptionalIdentifier(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, JOURNAL_CONSULTATION_ID_LIMIT) : null;
}

function normalizeSpreadPosition(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLocaleLowerCase('en-US');
  return SPREAD_POSITIONS.has(normalized) ? normalized : null;
}

export function normalizeJournalNote(value, { strict = false } = {}) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') {
    if (strict) throw new TypeError('Integration note must be text.');
    return '';
  }
  const normalized = value.replace(/\r\n?/g, '\n');
  if (normalized.length > JOURNAL_NOTE_LIMIT) {
    if (strict) {
      throw new RangeError(`Integration note exceeds ${JOURNAL_NOTE_LIMIT.toLocaleString('en-US')} characters.`);
    }
    return normalized.slice(0, JOURNAL_NOTE_LIMIT);
  }
  return normalized;
}

export function migrateJournalEntry(entry) {
  if (!isPlainObject(entry)) return null;
  const next = {
    ...entry,
    schemaVersion: JOURNAL_ENTRY_SCHEMA_VERSION,
    favorite: entry.favorite === true,
    note: normalizeJournalNote(entry.note ?? entry.integrationNote),
  };

  const consultationId = normalizeOptionalIdentifier(entry.consultationId);
  const spreadPosition = normalizeSpreadPosition(entry.spreadPosition);
  if (consultationId) next.consultationId = consultationId;
  else delete next.consultationId;
  if (spreadPosition) next.spreadPosition = spreadPosition;
  else delete next.spreadPosition;
  if (entry.legacyTriadFragment === true) next.legacyTriadFragment = true;
  else delete next.legacyTriadFragment;
  const legacyTriadFragmentId = normalizeOptionalIdentifier(entry.legacyTriadFragmentId);
  if (entry.legacyTriadFragment === true && legacyTriadFragmentId) {
    next.legacyTriadFragmentId = legacyTriadFragmentId;
  } else {
    delete next.legacyTriadFragmentId;
  }
  if (entry.legacyTriadRecovered === true) next.legacyTriadRecovered = true;
  else delete next.legacyTriadRecovered;

  return next;
}

export function upgradeLegacyJournalTriads(
  entries,
  {
    reconsiderLegacyFragments = true,
    reconsiderEntryIds = null,
  } = {},
) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const consultationKeys = assignJournalConsultationKeys(safeEntries, {
    respectLegacyFragmentIds: !reconsiderLegacyFragments,
  });
  const groupedIndexes = new Map();
  const usedConsultationIds = new Set(
    safeEntries
      .map((entry) => (isPlainObject(entry) ? normalizeOptionalIdentifier(entry.consultationId) : null))
      .filter(Boolean),
  );

  safeEntries.forEach((entry, index) => {
    if (!isPlainObject(entry)) return;
    const isUnpositionedLegacyTriad = !entry.consultationId
      && !entry.spreadPosition
      && (reconsiderLegacyFragments || entry.legacyTriadFragment !== true)
      && normalizeJournalSpreadType(entry.spreadType) === 'triad';
    if (!isUnpositionedLegacyTriad) return;
    const key = consultationKeys[index];
    const indexes = groupedIndexes.get(key) || [];
    indexes.push(index);
    groupedIndexes.set(key, indexes);
  });

  const upgraded = safeEntries.map((entry) => (isPlainObject(entry) ? { ...entry } : entry));
  let consultationOrdinal = 0;
  let fragmentOrdinal = 0;

  groupedIndexes.forEach((indexes) => {
    const containsMarkedFragment = indexes.some((entryIndex) => (
      upgraded[entryIndex]?.legacyTriadFragment === true
    ));
    const shouldReconsider = !containsMarkedFragment || (
      reconsiderLegacyFragments
      && (
        !(reconsiderEntryIds instanceof Set)
        || indexes.some((entryIndex) => reconsiderEntryIds.has(upgraded[entryIndex]?.id))
      )
    );
    if (!shouldReconsider) return;
    if (indexes.length !== TRIAD_POSITION_LIST.length) {
      fragmentOrdinal += 1;
      const chronologicalIndexes = [...indexes]
        .sort((left, right) => timestamp(upgraded[left]) - timestamp(upgraded[right]) || right - left);
      const first = upgraded[chronologicalIndexes[0]];
      const firstId = typeof first?.id === 'string' && first.id.trim()
        ? first.id.trim()
        : 'entry';
      const legacyTriadFragmentId = `legacy-fragment-${fragmentOrdinal}-${firstId}`
        .slice(0, JOURNAL_CONSULTATION_ID_LIMIT);
      indexes.forEach((entryIndex) => {
        upgraded[entryIndex].legacyTriadFragment = true;
        upgraded[entryIndex].legacyTriadFragmentId = legacyTriadFragmentId;
        delete upgraded[entryIndex].legacyTriadRecovered;
      });
      return;
    }

    consultationOrdinal += 1;
    const chronologicalIndexes = [...indexes]
      .sort((left, right) => timestamp(upgraded[left]) - timestamp(upgraded[right]) || right - left);
    const first = upgraded[chronologicalIndexes[0]];
    const firstId = typeof first.id === 'string' && first.id.trim()
      ? first.id.trim()
      : 'entry';
    let identityOrdinal = consultationOrdinal;
    let consultationId;
    do {
      consultationId = `legacy-${identityOrdinal}-${firstId}`
        .slice(0, JOURNAL_CONSULTATION_ID_LIMIT);
      identityOrdinal += 1;
    } while (usedConsultationIds.has(consultationId));
    usedConsultationIds.add(consultationId);

    chronologicalIndexes.forEach((entryIndex, positionIndex) => {
      upgraded[entryIndex] = {
        ...upgraded[entryIndex],
        consultationId,
        spreadType: 'triad',
        spreadPosition: TRIAD_POSITION_LIST[positionIndex],
        legacyTriadRecovered: true,
      };
      delete upgraded[entryIndex].legacyTriadFragment;
      delete upgraded[entryIndex].legacyTriadFragmentId;
    });
  });

  return upgraded;
}

export function migrateJournalEntries(entries, options) {
  if (!Array.isArray(entries)) return [];
  return upgradeLegacyJournalTriads(
    entries.map(migrateJournalEntry).filter(Boolean),
    options,
  );
}

export function patchJournalEntryMetadata(entry, patch = {}) {
  const migrated = migrateJournalEntry(entry);
  if (!migrated) return null;
  const next = { ...migrated };
  if (Object.prototype.hasOwnProperty.call(patch, 'favorite')) next.favorite = patch.favorite === true;
  if (Object.prototype.hasOwnProperty.call(patch, 'note')) next.note = normalizeJournalNote(patch.note, { strict: true });
  return next;
}
