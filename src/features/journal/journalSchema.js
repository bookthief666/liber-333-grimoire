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

function hashLegacyFragmentIdentity(value, offset) {
  let hash = offset;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 1099511628211n);
  }
  return hash.toString(16).padStart(16, '0');
}

function getLegacyFragmentFingerprint(entries) {
  return JSON.stringify(entries.map((entry) => ({
    id: typeof entry?.id === 'string' ? entry.id.trim() : null,
    date: entry?.date ?? null,
    question: entry?.question ?? null,
    chapter: entry?.chapter ?? null,
    gematria: entry?.gematria ?? null,
    spreadType: entry?.spreadType ?? null,
    planetary: entry?.planetary ?? null,
    lunar: entry?.lunar ?? null,
  })));
}

function allocateLegacyFragmentId(entries, usedIds) {
  const fingerprint = getLegacyFragmentFingerprint(entries);
  const digest = [
    hashLegacyFragmentIdentity(fingerprint, 14695981039346656037n),
    hashLegacyFragmentIdentity(fingerprint, 7809847782465536322n),
  ].join('');
  const base = `legacy-fragment-${digest}`;
  let candidate = base;
  let collisionOrdinal = 1;
  while (usedIds.has(candidate)) {
    candidate = `${base}-${collisionOrdinal}`;
    collisionOrdinal += 1;
  }
  usedIds.add(candidate);
  return candidate;
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
    migrateUnmarkedLegacyTriads = true,
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

  const upgraded = safeEntries.map((entry) => (isPlainObject(entry) ? { ...entry } : entry));
  const usedLegacyFragmentIds = new Set(
    upgraded
      .map((entry) => (
        entry?.legacyTriadFragment === true
          ? normalizeOptionalIdentifier(entry.legacyTriadFragmentId)
          : null
      ))
      .filter(Boolean),
  );

  // Older schema-v2 data could carry the fragment marker without a boundary ID.
  // Its original grouping is unknowable once separators are gone, so preserve
  // each surviving row independently rather than risking cross-fragment deletion.
  upgraded.forEach((entry) => {
    if (
      !isPlainObject(entry)
      || entry.legacyTriadFragment !== true
      || normalizeOptionalIdentifier(entry.legacyTriadFragmentId)
    ) return;
    entry.legacyTriadFragmentId = allocateLegacyFragmentId([entry], usedLegacyFragmentIds);
  });

  upgraded.forEach((entry, index) => {
    if (!isPlainObject(entry)) return;
    const isUnpositionedLegacyTriad = migrateUnmarkedLegacyTriads
      && !entry.consultationId
      && !entry.spreadPosition
      && (reconsiderLegacyFragments || entry.legacyTriadFragment !== true)
      && normalizeJournalSpreadType(entry.spreadType) === 'triad';
    if (!isUnpositionedLegacyTriad) return;
    const key = consultationKeys[index];
    const indexes = groupedIndexes.get(key) || [];
    indexes.push(index);
    groupedIndexes.set(key, indexes);
  });

  let consultationOrdinal = 0;

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
      const legacyTriadFragmentId = allocateLegacyFragmentId(
        indexes.map((entryIndex) => upgraded[entryIndex]),
        usedLegacyFragmentIds,
      );
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
