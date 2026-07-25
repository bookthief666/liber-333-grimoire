export const JOURNAL_ENTRY_SCHEMA_VERSION = 2;
export const JOURNAL_NOTE_LIMIT = 12_000;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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
  return {
    ...entry,
    schemaVersion: JOURNAL_ENTRY_SCHEMA_VERSION,
    favorite: entry.favorite === true,
    note: normalizeJournalNote(entry.note ?? entry.integrationNote),
  };
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
