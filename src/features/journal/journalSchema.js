import {
  assignJournalConsultationKeys,
  getLegacyTriadSignature,
  LEGACY_TRIAD_TOLERANCE_MS,
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

  const preservedKeys = assignJournalConsultationKeys(upgraded, {
    respectLegacyFragmentIds: true,
  });
  const preservedGroups = new Map();
  upgraded.forEach((entry, index) => {
    if (!isPlainObject(entry)) return;
    const isUnpositionedLegacyTriad = !entry.consultationId
      && !entry.spreadPosition
      && (entry.legacyTriadFragment === true || migrateUnmarkedLegacyTriads)
      && normalizeJournalSpreadType(entry.spreadType) === 'triad';
    if (!isUnpositionedLegacyTriad) return;
    const key = preservedKeys[index];
    const indexes = preservedGroups.get(key) || [];
    indexes.push(index);
    preservedGroups.set(key, indexes);
  });

  const groupsToUpgrade = [];
  const crossBoundaryIndexes = new Set();
  if (reconsiderLegacyFragments && reconsiderEntryIds instanceof Set) {
    const isCoherentGroup = (indexes, { requireContiguous = false } = {}) => {
      const orderedIndexes = [...indexes].sort((left, right) => left - right);
      if (
        requireContiguous
        && orderedIndexes.some((entryIndex, position) => (
          position > 0 && entryIndex !== orderedIndexes[position - 1] + 1
        ))
      ) return false;
      const signatures = new Set(
        orderedIndexes.map((entryIndex) => getLegacyTriadSignature(upgraded[entryIndex])),
      );
      if (signatures.size !== 1) return false;
      const timestamps = orderedIndexes.map((entryIndex) => Date.parse(upgraded[entryIndex]?.date));
      return timestamps.every((value, position) => (
        !Number.isNaN(value)
        && (
          position === 0
          || Math.abs(value - timestamps[position - 1]) <= LEGACY_TRIAD_TOLERANCE_MS
        )
      ));
    };

    const persistedBoundaries = [...preservedGroups.entries()]
      .filter(([, indexes]) => indexes.every((entryIndex) => (
        upgraded[entryIndex]?.legacyTriadFragment === true
      )))
      .map(([key, indexes]) => {
        const importedMembership = indexes.map((entryIndex) => (
          reconsiderEntryIds.has(upgraded[entryIndex]?.id)
        ));
        return {
          key,
          indexes,
          source: importedMembership.every(Boolean)
            ? 'imported'
            : importedMembership.some(Boolean) ? 'mixed' : 'local',
        };
      });

    const candidatePairs = [];
    const localBoundaries = persistedBoundaries.filter((group) => group.source === 'local');
    const importedBoundaries = persistedBoundaries.filter((group) => group.source === 'imported');
    localBoundaries.forEach((localBoundary) => {
      importedBoundaries.forEach((importedBoundary) => {
        const sizes = [localBoundary.indexes.length, importedBoundary.indexes.length]
          .sort((left, right) => left - right);
        const indexes = [...localBoundary.indexes, ...importedBoundary.indexes]
          .sort((left, right) => left - right);
        const localTimestamps = localBoundary.indexes.map((entryIndex) => (
          Date.parse(upgraded[entryIndex]?.date)
        ));
        const importedTimestamps = importedBoundary.indexes.map((entryIndex) => (
          Date.parse(upgraded[entryIndex]?.date)
        ));
        const boundariesHaveStrictTemporalOrder = (
          Math.max(...localTimestamps) < Math.min(...importedTimestamps)
          || Math.max(...importedTimestamps) < Math.min(...localTimestamps)
        );
        if (
          sizes[0] !== 1
          || sizes[1] !== 2
          || !boundariesHaveStrictTemporalOrder
          || !isCoherentGroup(indexes, { requireContiguous: true })
        ) return;
        candidatePairs.push({ localBoundary, importedBoundary, indexes });
      });
    });

    const candidateUseCount = new Map();
    candidatePairs.forEach(({ localBoundary, importedBoundary }) => {
      for (const key of [localBoundary.key, importedBoundary.key]) {
        candidateUseCount.set(key, (candidateUseCount.get(key) || 0) + 1);
      }
    });
    candidatePairs.forEach(({ localBoundary, importedBoundary, indexes }) => {
      if (
        candidateUseCount.get(localBoundary.key) !== 1
        || candidateUseCount.get(importedBoundary.key) !== 1
      ) return;
      groupsToUpgrade.push({ indexes, reconsiderPersistedBoundaries: true });
      indexes.forEach((entryIndex) => crossBoundaryIndexes.add(entryIndex));
    });

    persistedBoundaries
      .filter((group) => (
        group.source === 'mixed'
        && group.indexes.length === TRIAD_POSITION_LIST.length
        && isCoherentGroup(group.indexes)
      ))
      .forEach(({ indexes }) => {
        groupsToUpgrade.push({ indexes, reconsiderPersistedBoundaries: true });
        indexes.forEach((entryIndex) => crossBoundaryIndexes.add(entryIndex));
      });
  }

  preservedGroups.forEach((indexes) => {
    if (indexes.some((entryIndex) => crossBoundaryIndexes.has(entryIndex))) return;
    groupsToUpgrade.push({ indexes, reconsiderPersistedBoundaries: false });
  });
  groupsToUpgrade.sort((left, right) => left.indexes[0] - right.indexes[0]);

  let consultationOrdinal = 0;

  groupsToUpgrade.forEach(({ indexes, reconsiderPersistedBoundaries }) => {
    const containsMarkedFragment = indexes.some((entryIndex) => (
      upgraded[entryIndex]?.legacyTriadFragment === true
    ));
    if (containsMarkedFragment && !reconsiderPersistedBoundaries) return;
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
