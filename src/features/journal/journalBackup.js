import { LIBER_333 } from '../../data/liber333.js';
import { MAX_JOURNAL_ENTRIES } from './journalStorage.js';

export const JOURNAL_BACKUP_FORMAT = 'liber-333-grimoire-backup';
export const JOURNAL_BACKUP_VERSION = 1;

export const JOURNAL_BACKUP_LIMITS = Object.freeze({
  fileBytes: 2 * 1024 * 1024,
  entries: MAX_JOURNAL_ENTRIES,
  idChars: 128,
  questionChars: 4000,
  interpretationChars: 50000,
  labelChars: 100,
  totalReadings: 10_000_000,
});

const CHAPTER_BY_NUMBER = new Map(LIBER_333.map((chapter) => [chapter.chapter, chapter]));

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
  if (normalized.length > maxChars) throw new JournalBackupError(`${label} exceeds ${maxChars.toLocaleString()} characters.`);
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

export function normalizeJournalEntry(entry) {
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
  };

  return normalized;
}

function normalizeEntries(entries) {
  if (!Array.isArray(entries)) throw new JournalBackupError('Backup entries must be an array.');
  if (entries.length > JOURNAL_BACKUP_LIMITS.entries) {
    throw new JournalBackupError(`A backup may contain at most ${JOURNAL_BACKUP_LIMITS.entries} entries.`);
  }

  const ids = new Set();
  return entries.map((entry) => {
    const normalized = normalizeJournalEntry(entry);
    if (ids.has(normalized.id)) throw new JournalBackupError(`Backup contains duplicate entry ID ${normalized.id}.`);
    ids.add(normalized.id);
    return normalized;
  });
}

function normalizeTotalReadings(value, entryCount) {
  if (!Number.isInteger(value) || value < 0 || value > JOURNAL_BACKUP_LIMITS.totalReadings) {
    throw new JournalBackupError(`Lifetime reading total must be an integer from 0 to ${JOURNAL_BACKUP_LIMITS.totalReadings.toLocaleString()}.`);
  }
  return Math.max(value, entryCount);
}

function normalizeExportedAt(value) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new JournalBackupError('Backup export time is invalid.');
  }
  return new Date(value).toISOString();
}

export function createJournalBackup({ entries, totalReadings, exportedAt = new Date() }) {
  const normalizedEntries = normalizeEntries(entries);
  const exportedAtIso = exportedAt instanceof Date
    ? exportedAt.toISOString()
    : normalizeExportedAt(exportedAt);

  return {
    format: JOURNAL_BACKUP_FORMAT,
    version: JOURNAL_BACKUP_VERSION,
    exportedAt: exportedAtIso,
    totalReadings: normalizeTotalReadings(totalReadings, normalizedEntries.length),
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
  if (parsed.version !== JOURNAL_BACKUP_VERSION) {
    throw new JournalBackupError(`Unsupported backup version. Expected version ${JOURNAL_BACKUP_VERSION}.`, 'unsupported_journal_backup_version');
  }

  const entries = normalizeEntries(parsed.entries);
  return {
    format: JOURNAL_BACKUP_FORMAT,
    version: JOURNAL_BACKUP_VERSION,
    exportedAt: normalizeExportedAt(parsed.exportedAt),
    totalReadings: normalizeTotalReadings(parsed.totalReadings, entries.length),
    entries,
  };
}

function timestamp(entry) {
  const value = Date.parse(entry?.date);
  return Number.isNaN(value) ? 0 : value;
}

export function mergeJournalBackup({ currentEntries, currentTotalReadings, backup }) {
  if (!Array.isArray(currentEntries)) throw new JournalBackupError('Current journal entries must be an array.');
  if (!isPlainObject(backup) || backup.format !== JOURNAL_BACKUP_FORMAT || backup.version !== JOURNAL_BACKUP_VERSION) {
    throw new JournalBackupError('Import requires a validated Liber 333 backup.');
  }

  const existingIds = new Set(currentEntries.map((entry) => entry?.id).filter((id) => typeof id === 'string'));
  const importedEntries = backup.entries.filter((entry) => !existingIds.has(entry.id));
  const mergedEntries = [...currentEntries, ...importedEntries]
    .sort((left, right) => timestamp(right) - timestamp(left))
    .slice(0, MAX_JOURNAL_ENTRIES);

  const totalReadings = Math.max(
    Number.isInteger(currentTotalReadings) ? currentTotalReadings : 0,
    backup.totalReadings,
    mergedEntries.length,
  );

  return {
    entries: mergedEntries,
    totalReadings,
    importedCount: importedEntries.length,
    duplicateCount: backup.entries.length - importedEntries.length,
    omittedByCap: Math.max(0, currentEntries.length + importedEntries.length - mergedEntries.length),
  };
}
