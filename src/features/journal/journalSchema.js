export const JOURNAL_ENTRY_SCHEMA_VERSION = 2;
export const JOURNAL_NOTE_LIMIT = 12_000;
export const JOURNAL_CONSULTATION_ID_LIMIT = 128;

const SPREAD_POSITIONS = new Set(['single', 'thesis', 'antithesis', 'synthesis']);

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

  return next;
}

export function migrateJournalEntries(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map(migrateJournalEntry).filter(Boolean);
}

export function patchJournalEntryMetadata(entry, patch = {}) {
  const migrated = migrateJournalEntry(entry);
  if (!migrated) return null;
  const next = { ...migrated };
  if (Object.prototype.hasOwnProperty.call(patch, 'favorite')) next.favorite = patch.favorite === true;
  if (Object.prototype.hasOwnProperty.call(patch, 'note')) next.note = normalizeJournalNote(patch.note, { strict: true });
  return next;
}
