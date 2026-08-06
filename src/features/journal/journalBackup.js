import { LIBER_333 } from '../../data/liber333.js';
import {
  assignJournalConsultationKeys,
  LEGACY_TRIAD_TOLERANCE_MS,
  normalizeJournalSpreadType,
} from './consultationIdentity.js';
import {
  countJournalConsultations,
  countNewJournalConsultations,
  retainCompleteJournalConsultations,
} from './consultationSemantics.js';
import { MAX_JOURNAL_ENTRIES } from './journalStorage.js';
import {
  JOURNAL_CONSULTATION_ID_LIMIT,
  JOURNAL_ENTRY_SCHEMA_VERSION,
  JOURNAL_NOTE_LIMIT,
  migrateJournalEntries,
  normalizeJournalNote,
  upgradeLegacyJournalTriads,
} from './journalSchema.js';

export const JOURNAL_BACKUP_FORMAT = 'liber-333-grimoire-backup';
export const JOURNAL_BACKUP_VERSION = 2;
export const SUPPORTED_JOURNAL_BACKUP_VERSIONS = Object.freeze([1, JOURNAL_BACKUP_VERSION]);

export const JOURNAL_BACKUP_LIMITS = Object.freeze({
  fileBytes: 2 * 1024 * 1024,
  entries: MAX_JOURNAL_ENTRIES,
  idChars: 128,
  consultationIdChars: JOURNAL_CONSULTATION_ID_LIMIT,
  questionChars: 4000,
  interpretationChars: 50000,
  noteChars: JOURNAL_NOTE_LIMIT,
  labelChars: 100,
  totalReadings: 10_000_000,
});

const CHAPTER_BY_NUMBER = new Map(LIBER_333.map((chapter) => [chapter.chapter, chapter]));
const SPREAD_POSITIONS = new Set(['single', 'thesis', 'antithesis', 'synthesis']);
const TRIAD_POSITION_LIST = Object.freeze(['thesis', 'antithesis', 'synthesis']);
const TRIAD_POSITIONS = new Set(TRIAD_POSITION_LIST);

export class JournalBackupError extends Error {
  constructor(message, code = 'invalid_journal_backup') {
    super(message);
    this.name = 'JournalBackupError';
    this.code = code;
  }
}

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function requireString(value, label, maxChars, { allowEmpty = false } = {}) {
  if (typeof value !== 'string') throw new JournalBackupError(`${label} must be text.`);
  const normalized = value.trim();
  if (!allowEmpty && !normalized) throw new JournalBackupError(`${label} cannot be empty.`);
  if (normalized.length > maxChars) throw new JournalBackupError(`${label} exceeds ${maxChars.toLocaleString('en-US')} characters.`);
  return normalized;
}

function optionalString(value, label, maxChars) {
  if (value === undefined || value === null || value === '') return null;
  return requireString(value, label, maxChars, { allowEmpty: true });
}

function normalizeDate(value) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new JournalBackupError('A journal entry contains an invalid date.');
  }
  return new Date(value).toISOString();
}

function normalizeGematria(value) {
  if (!Number.isFinite(Number(value))) return 0;
  const number = Math.trunc(Number(value));
  return Math.max(0, Math.min(number, Number.MAX_SAFE_INTEGER));
}

function normalizeFavorite(value) {
  if (value === undefined || value === null) return false;
  if (typeof value !== 'boolean') throw new JournalBackupError('Entry favorite state must be true or false.');
  return value;
}

function normalizeLegacyTriadFragment(value) {
  if (value === undefined || value === null || value === false) return false;
  if (value !== true) {
    throw new JournalBackupError('Legacy Triad fragment state must be true or false.');
  }
  return true;
}

function normalizeLegacyTriadRecovered(value) {
  if (value === undefined || value === null || value === false) return false;
  if (value !== true) {
    throw new JournalBackupError('Recovered legacy Triad state must be true or false.');
  }
  return true;
}

function normalizeNote(value) {
  try {
    return normalizeJournalNote(value, { strict: true });
  } catch (error) {
    throw new JournalBackupError(error instanceof Error ? error.message : 'Entry integration note is invalid.');
  }
}

function normalizeSpreadPosition(value) {
  if (value === undefined || value === null || value === '') return null;
  const normalized = requireString(value, 'Spread position', JOURNAL_BACKUP_LIMITS.labelChars)
    .toLocaleLowerCase('en-US');
  if (!SPREAD_POSITIONS.has(normalized)) {
    throw new JournalBackupError('Spread position must be single, thesis, antithesis, or synthesis.');
  }
  return normalized;
}

export function normalizeJournalEntry(entry, { sourceVersion = JOURNAL_BACKUP_VERSION } = {}) {
  if (!isPlainObject(entry)) throw new JournalBackupError('Each journal entry must be an object.');

  const id = requireString(entry.id, 'Entry ID', JOURNAL_BACKUP_LIMITS.idChars);
  const date = normalizeDate(entry.date);
  const question = requireString(entry.question, 'Entry question', JOURNAL_BACKUP_LIMITS.questionChars);

  if (!Number.isInteger(entry.chapter) || !CHAPTER_BY_NUMBER.has(entry.chapter)) {
    throw new JournalBackupError(`Entry ${id} references an unknown Liber 333 chapter.`);
  }
  const chapter = CHAPTER_BY_NUMBER.get(entry.chapter);

  const normalized = {
    id,
    date,
    question,
    chapter: chapter.chapter,
    title: chapter.title,
    gematria: normalizeGematria(entry.gematria),
    interpretation: optionalString(entry.interpretation, 'Entry interpretation', JOURNAL_BACKUP_LIMITS.interpretationChars),
    spreadType: optionalString(entry.spreadType, 'Spread label', JOURNAL_BACKUP_LIMITS.labelChars) || 'single',
    planetary: optionalString(entry.planetary, 'Planetary label', JOURNAL_BACKUP_LIMITS.labelChars),
    lunar: optionalString(entry.lunar, 'Lunar label', JOURNAL_BACKUP_LIMITS.labelChars),
    schemaVersion: JOURNAL_ENTRY_SCHEMA_VERSION,
    favorite: sourceVersion === 1 ? false : normalizeFavorite(entry.favorite),
    note: sourceVersion === 1 ? '' : normalizeNote(entry.note ?? entry.integrationNote),
  };

  if (sourceVersion !== 1) {
    const consultationId = optionalString(
      entry.consultationId,
      'Consultation ID',
      JOURNAL_BACKUP_LIMITS.consultationIdChars,
    );
    const spreadPosition = normalizeSpreadPosition(entry.spreadPosition);
    if (consultationId) normalized.consultationId = consultationId;
    if (spreadPosition) normalized.spreadPosition = spreadPosition;
    if (normalizeLegacyTriadFragment(entry.legacyTriadFragment)) {
      normalized.legacyTriadFragment = true;
    }
    if (normalizeLegacyTriadRecovered(entry.legacyTriadRecovered)) {
      normalized.legacyTriadRecovered = true;
    }
  }

  return normalized;
}

function assertSharedGroupField(group, field, consultationId) {
  const expected = group[0]?.[field] ?? null;
  if (group.some((entry) => (entry?.[field] ?? null) !== expected)) {
    throw new JournalBackupError(
      `Consultation ${consultationId} contains inconsistent ${field} values.`,
      'invalid_consultation_group',
    );
  }
}

function validateExplicitConsultationGroups(entries, sourceVersion) {
  if (sourceVersion === 1) return;
  const groups = new Map();

  entries.forEach((entry) => {
    const position = entry.spreadPosition || null;
    const spreadType = normalizeJournalSpreadType(entry.spreadType);
    const isLegacyTriadFragment = entry.legacyTriadFragment === true;
    const isLegacyTriadRecovered = entry.legacyTriadRecovered === true;
    if (isLegacyTriadFragment) {
      if (spreadType !== 'triad' || entry.consultationId || position || isLegacyTriadRecovered) {
        throw new JournalBackupError(
          `Entry ${entry.id} has invalid historical Triad fragment metadata.`,
          'invalid_consultation_group',
        );
      }
      return;
    }
    if (isLegacyTriadRecovered && (
      spreadType !== 'triad'
      || !entry.consultationId
      || !TRIAD_POSITIONS.has(position)
    )) {
      throw new JournalBackupError(
        `Entry ${entry.id} has invalid recovered legacy Triad metadata.`,
        'invalid_consultation_group',
      );
    }
    if (spreadType === 'triad' && !entry.consultationId) {
      throw new JournalBackupError(
        `Entry ${entry.id} has a Triad spread label without a consultation ID.`,
        'invalid_consultation_group',
      );
    }
    if (spreadType === 'triad' && !TRIAD_POSITIONS.has(position)) {
      throw new JournalBackupError(
        `Entry ${entry.id} has a Triad spread label without a thesis, antithesis, or synthesis position.`,
        'invalid_consultation_group',
      );
    }
    if (TRIAD_POSITIONS.has(position) && !entry.consultationId) {
      throw new JournalBackupError(
        `Entry ${entry.id} has a Triad position without a consultation ID.`,
        'invalid_consultation_group',
      );
    }
    if (!entry.consultationId) return;
    const group = groups.get(entry.consultationId) || [];
    group.push(entry);
    groups.set(entry.consultationId, group);
  });

  const fragmentKeys = assignJournalConsultationKeys(entries);
  const fragmentCounts = new Map();
  entries.forEach((entry, index) => {
    if (entry.legacyTriadFragment !== true) return;
    const key = fragmentKeys[index];
    fragmentCounts.set(key, (fragmentCounts.get(key) || 0) + 1);
  });
  if ([...fragmentCounts.values()].some((count) => count >= TRIAD_POSITION_LIST.length)) {
    throw new JournalBackupError(
      'A complete historical Triad must use explicit consultation positions.',
      'invalid_consultation_group',
    );
  }

  groups.forEach((group, consultationId) => {
    const isTriad = group.some((entry) => (
      normalizeJournalSpreadType(entry.spreadType) === 'triad'
      || TRIAD_POSITIONS.has(entry.spreadPosition)
    ));

    if (!isTriad) {
      if (group.length !== 1) {
        throw new JournalBackupError(
          `Single consultation ${consultationId} must contain exactly one entry.`,
          'invalid_consultation_group',
        );
      }
      const [entry] = group;
      if (entry.spreadPosition && entry.spreadPosition !== 'single') {
        throw new JournalBackupError(
          `Single consultation ${consultationId} has an invalid spread position.`,
          'invalid_consultation_group',
        );
      }
      return;
    }

    if (group.length !== 3) {
      throw new JournalBackupError(
        `Triad consultation ${consultationId} must contain exactly three entries.`,
        'invalid_consultation_group',
      );
    }
    if (group.some((entry) => normalizeJournalSpreadType(entry.spreadType) !== 'triad')) {
      throw new JournalBackupError(
        `Triad consultation ${consultationId} contains a non-Triad spread label.`,
        'invalid_consultation_group',
      );
    }

    const positions = group.map((entry) => entry.spreadPosition);
    if (
      positions.some((position) => !TRIAD_POSITIONS.has(position))
      || new Set(positions).size !== TRIAD_POSITIONS.size
    ) {
      throw new JournalBackupError(
        `Triad consultation ${consultationId} must contain thesis, antithesis, and synthesis exactly once.`,
        'invalid_consultation_group',
      );
    }

    const recoveredRows = group.filter((entry) => entry.legacyTriadRecovered === true);
    if (recoveredRows.length !== 0 && recoveredRows.length !== group.length) {
      throw new JournalBackupError(
        `Triad consultation ${consultationId} contains inconsistent recovered legacy metadata.`,
        'invalid_consultation_group',
      );
    }

    for (const field of ['question', 'gematria']) {
      assertSharedGroupField(group, field, consultationId);
    }
    if (recoveredRows.length === 0) {
      assertSharedGroupField(group, 'date', consultationId);
      return;
    }

    const timestampByPosition = new Map(
      group.map((entry) => [entry.spreadPosition, timestamp(entry)]),
    );
    const chronologicalTimestamps = TRIAD_POSITION_LIST.map((position) => timestampByPosition.get(position));
    const hasInvalidChronology = chronologicalTimestamps.some((value, index) => (
      index > 0 && (
        value < chronologicalTimestamps[index - 1]
        || value - chronologicalTimestamps[index - 1] > LEGACY_TRIAD_TOLERANCE_MS
      )
    ));
    if (hasInvalidChronology) {
      throw new JournalBackupError(
        `Recovered legacy Triad ${consultationId} has invalid position chronology.`,
        'invalid_consultation_group',
      );
    }
  });
}

function normalizeEntries(entries, { sourceVersion = JOURNAL_BACKUP_VERSION } = {}) {
  if (!Array.isArray(entries)) throw new JournalBackupError('Backup entries must be an array.');
  if (entries.length > JOURNAL_BACKUP_LIMITS.entries) {
    throw new JournalBackupError(`A backup may contain at most ${JOURNAL_BACKUP_LIMITS.entries} entries.`);
  }

  const ids = new Set();
  const normalizedEntries = entries.map((entry) => {
    const normalized = normalizeJournalEntry(entry, { sourceVersion });
    if (ids.has(normalized.id)) throw new JournalBackupError(`Backup contains duplicate entry ID ${normalized.id}.`);
    ids.add(normalized.id);
    return normalized;
  });
  const upgradedEntries = sourceVersion === 1
    ? upgradeLegacyJournalTriads(normalizedEntries)
    : normalizedEntries;
  validateExplicitConsultationGroups(upgradedEntries, JOURNAL_BACKUP_VERSION);
  return upgradedEntries;
}

function normalizeTotalReadings(value, entries) {
  if (!Number.isInteger(value) || value < 0 || value > JOURNAL_BACKUP_LIMITS.totalReadings) {
    throw new JournalBackupError(`Lifetime reading total must be an integer from 0 to ${JOURNAL_BACKUP_LIMITS.totalReadings.toLocaleString('en-US')}.`);
  }
  return Math.max(value, countJournalConsultations(entries));
}

function normalizeExportedAt(value) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new JournalBackupError('Backup export time is invalid.');
  }
  return new Date(value).toISOString();
}

export function createJournalBackup({ entries, totalReadings, exportedAt = new Date() }) {
  const normalizedEntries = normalizeEntries(
    upgradeLegacyJournalTriads(entries),
    { sourceVersion: JOURNAL_BACKUP_VERSION },
  );
  const exportedAtIso = exportedAt instanceof Date
    ? exportedAt.toISOString()
    : normalizeExportedAt(exportedAt);

  return {
    format: JOURNAL_BACKUP_FORMAT,
    version: JOURNAL_BACKUP_VERSION,
    exportedAt: exportedAtIso,
    totalReadings: normalizeTotalReadings(totalReadings, normalizedEntries),
    entries: normalizedEntries,
  };
}

export function serializeJournalBackup(state) {
  return `${JSON.stringify(createJournalBackup(state), null, 2)}\n`;
}

export function getJournalBackupFilename(exportedAt = new Date()) {
  const date = exportedAt instanceof Date ? exportedAt : new Date(exportedAt);
  if (Number.isNaN(date.getTime())) throw new JournalBackupError('Backup filename date is invalid.');
  return `liber-333-grimoire-${date.toISOString().slice(0, 10)}.json`;
}

export function parseJournalBackup(input) {
  if (typeof input !== 'string') throw new JournalBackupError('Backup file must contain JSON text.');
  if (new TextEncoder().encode(input).byteLength > JOURNAL_BACKUP_LIMITS.fileBytes) {
    throw new JournalBackupError('Backup file is larger than the 2 MB import limit.', 'journal_backup_too_large');
  }

  let parsed;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new JournalBackupError('Backup file is not valid JSON.');
  }

  if (!isPlainObject(parsed)) throw new JournalBackupError('Backup root must be an object.');
  if (parsed.format !== JOURNAL_BACKUP_FORMAT) throw new JournalBackupError('This is not a Liber 333 Grimoire backup.');
  if (!SUPPORTED_JOURNAL_BACKUP_VERSIONS.includes(parsed.version)) {
    throw new JournalBackupError(
      `Unsupported backup version. Expected version 1 or ${JOURNAL_BACKUP_VERSION}.`,
      'unsupported_journal_backup_version',
    );
  }

  const entries = normalizeEntries(parsed.entries, { sourceVersion: parsed.version });
  return {
    format: JOURNAL_BACKUP_FORMAT,
    version: JOURNAL_BACKUP_VERSION,
    sourceVersion: parsed.version,
    exportedAt: normalizeExportedAt(parsed.exportedAt),
    totalReadings: normalizeTotalReadings(parsed.totalReadings, entries),
    entries,
  };
}

function timestamp(entry) {
  const value = Date.parse(entry?.date);
  return Number.isNaN(value) ? 0 : value;
}

function explicitConsultationPosition(entry) {
  if (!entry?.consultationId) return null;
  if (entry.spreadPosition) return entry.spreadPosition;
  return normalizeJournalSpreadType(entry.spreadType) === 'single' ? 'single' : null;
}

function explicitConsultationPositionKey(entry) {
  const position = explicitConsultationPosition(entry);
  return position ? `${entry.consultationId}\u0000${position}` : null;
}

function isMatchingRecoveredLegacyFragment(localEntry, importedEntry) {
  if (
    localEntry?.legacyTriadFragment !== true
    || importedEntry?.legacyTriadRecovered !== true
    || localEntry.id !== importedEntry.id
    || normalizeJournalSpreadType(localEntry.spreadType) !== 'triad'
    || normalizeJournalSpreadType(importedEntry.spreadType) !== 'triad'
  ) return false;

  return [
    'date',
    'question',
    'chapter',
    'gematria',
    'interpretation',
    'planetary',
    'lunar',
  ].every((field) => (localEntry[field] ?? null) === (importedEntry[field] ?? null));
}

function reconcileRecoveredLegacyFragments(currentEntries, importedEntries) {
  const importedById = new Map(importedEntries.map((entry) => [entry.id, entry]));
  const touchedConsultationIds = new Set();
  const entries = currentEntries.map((localEntry) => {
    const importedEntry = importedById.get(localEntry.id);
    if (!isMatchingRecoveredLegacyFragment(localEntry, importedEntry)) return localEntry;

    touchedConsultationIds.add(importedEntry.consultationId);
    return {
      ...importedEntry,
      favorite: localEntry.favorite === true,
      note: localEntry.note || '',
    };
  });
  return { entries, touchedConsultationIds };
}

function validateTouchedExplicitConsultations(entries, consultationIds) {
  consultationIds.forEach((consultationId) => {
    const group = entries.filter((entry) => entry.consultationId === consultationId);
    try {
      validateExplicitConsultationGroups(group, JOURNAL_BACKUP_VERSION);
    } catch (error) {
      if (!(error instanceof JournalBackupError)) throw error;
      throw new JournalBackupError(
        `Imported consultation ${consultationId} conflicts with existing local consultation data. ${error.message}`,
        'consultation_collision',
      );
    }
  });
}

export function mergeJournalBackup({ currentEntries, currentTotalReadings, backup }) {
  if (!Array.isArray(currentEntries)) throw new JournalBackupError('Current journal entries must be an array.');
  if (!isPlainObject(backup) || backup.format !== JOURNAL_BACKUP_FORMAT || backup.version !== JOURNAL_BACKUP_VERSION) {
    throw new JournalBackupError('Import requires a validated Liber 333 backup.');
  }

  const migratedCurrent = migrateJournalEntries(currentEntries);
  const reconciliation = reconcileRecoveredLegacyFragments(migratedCurrent, backup.entries);
  const reconciledCurrent = reconciliation.entries;
  const existingIds = new Set(reconciledCurrent.map((entry) => entry?.id).filter((id) => typeof id === 'string'));
  const existingConsultationPositions = new Set(
    reconciledCurrent.map(explicitConsultationPositionKey).filter(Boolean),
  );
  const importedEntries = backup.entries.filter((entry) => {
    if (existingIds.has(entry.id)) return false;
    const consultationPosition = explicitConsultationPositionKey(entry);
    return !consultationPosition || !existingConsultationPositions.has(consultationPosition);
  });
  const touchedExplicitConsultationIds = new Set(
    importedEntries.map((entry) => entry.consultationId).filter(Boolean),
  );
  reconciliation.touchedConsultationIds.forEach((consultationId) => {
    touchedExplicitConsultationIds.add(consultationId);
  });
  const sortedEntries = [...reconciledCurrent, ...importedEntries]
    .sort((left, right) => timestamp(right) - timestamp(left));
  validateTouchedExplicitConsultations(sortedEntries, touchedExplicitConsultationIds);

  const retention = retainCompleteJournalConsultations(sortedEntries, MAX_JOURNAL_ENTRIES);
  const mergedEntries = migrateJournalEntries(retention.entries);
  const retainedIds = new Set(mergedEntries.map((entry) => entry.id));
  const retainedImportedEntries = importedEntries.filter((entry) => retainedIds.has(entry.id));
  const importedConsultationCount = countNewJournalConsultations(
    reconciledCurrent,
    retainedImportedEntries,
  );

  const totalReadings = Math.max(
    Number.isInteger(currentTotalReadings) ? currentTotalReadings : 0,
    backup.totalReadings,
    countJournalConsultations(mergedEntries),
  );

  return {
    entries: mergedEntries,
    totalReadings,
    importedCount: importedConsultationCount,
    importedConsultationCount,
    importedEntryCount: retainedImportedEntries.length,
    duplicateCount: backup.entries.length - importedEntries.length,
    omittedByCap: retention.omittedEntries,
    omittedConsultationCount: retention.omittedConsultations,
  };
}
