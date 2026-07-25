import {
  JOURNAL_NOTE_LIMIT,
  normalizeJournalNote,
  patchJournalEntryMetadata,
} from './journalSchema.js';

export const GRIMOIRE_NOTE_LIMIT = JOURNAL_NOTE_LIMIT;

export const DEFAULT_GRIMOIRE_FILTERS = Object.freeze({
  query: '',
  spread: 'all',
  favoritesOnly: false,
  chapter: null,
  from: null,
  to: null,
  sort: 'newest',
});

const SPREAD_FILTERS = new Set(['all', 'single', 'triad']);
const SORT_ORDERS = new Set(['newest', 'oldest']);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function normalizeChapterNumber(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

function normalizeDateBoundary(value, { endOfDay = false } = {}) {
  if (value === undefined || value === null || value === '') return null;
  const text = String(value).trim();
  if (!text) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const suffix = endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z';
    const timestamp = Date.parse(`${text}${suffix}`);
    return Number.isNaN(timestamp) ? null : timestamp;
  }

  const timestamp = Date.parse(text);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function normalizeSpreadType(value) {
  return String(value ?? '').toLocaleLowerCase('en-US').includes('triad') ? 'triad' : 'single';
}

export function normalizeGrimoireNote(value) {
  return normalizeJournalNote(value, { strict: true });
}

export function normalizeGrimoireFilters(filters = {}) {
  const spread = SPREAD_FILTERS.has(filters.spread) ? filters.spread : DEFAULT_GRIMOIRE_FILTERS.spread;
  const sort = SORT_ORDERS.has(filters.sort) ? filters.sort : DEFAULT_GRIMOIRE_FILTERS.sort;
  return {
    query: typeof filters.query === 'string' ? filters.query : '',
    spread,
    favoritesOnly: filters.favoritesOnly === true,
    chapter: normalizeChapterNumber(filters.chapter),
    from: filters.from || null,
    to: filters.to || null,
    sort,
  };
}

function chapterRecord(value, fallbackTitle = null) {
  if (Number.isInteger(value)) return { chapter: value, title: fallbackTitle };
  if (!isPlainObject(value)) return null;
  const chapter = normalizeChapterNumber(value.chapter ?? value.number);
  if (chapter === null) return null;
  return {
    chapter,
    title: typeof value.title === 'string' && value.title.trim() ? value.title.trim() : fallbackTitle,
    sourceText: typeof value.sourceText === 'string' ? value.sourceText : value.text,
    commentary: value.fixedCommentary ?? value.commentary ?? null,
    interpretation: value.oracleInterpretation ?? value.interpretation ?? null,
  };
}

export function getEntryChapterRecords(entry) {
  if (!isPlainObject(entry)) return [];
  const records = [];
  const append = (value, fallbackTitle = null) => {
    const record = chapterRecord(value, fallbackTitle);
    if (record) records.push(record);
  };

  append(entry.chapter, typeof entry.title === 'string' ? entry.title : null);
  for (const key of ['chapters', 'triad', 'selectedChapters']) {
    if (Array.isArray(entry[key])) entry[key].forEach((value) => append(value));
  }

  const seen = new Set();
  return records.filter((record) => {
    const key = `${record.chapter}:${record.title || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getEntryChapterNumbers(entry) {
  return [...new Set(getEntryChapterRecords(entry).map((record) => record.chapter))];
}

function buildSearchDocument(entry) {
  const directFields = [
    entry?.question,
    entry?.title,
    entry?.interpretation,
    entry?.oracleInterpretation,
    entry?.note,
    entry?.integrationNote,
    entry?.commentary,
    entry?.fixedCommentary,
    entry?.sourceText,
    entry?.planetary,
    entry?.lunar,
    entry?.spreadType,
    entry?.gematria,
  ];

  const chapterFields = getEntryChapterRecords(entry).flatMap((record) => [
    record.chapter,
    `chapter ${record.chapter}`,
    record.title,
    record.sourceText,
    record.commentary,
    record.interpretation,
  ]);

  return normalizeText([...directFields, ...chapterFields].filter((value) => value !== null && value !== undefined).join(' '));
}

export function entryMatchesGrimoireFilters(entry, filters = DEFAULT_GRIMOIRE_FILTERS) {
  if (!isPlainObject(entry)) return false;
  const normalized = normalizeGrimoireFilters(filters);

  if (normalized.spread !== 'all' && normalizeSpreadType(entry.spreadType) !== normalized.spread) return false;
  if (normalized.favoritesOnly && entry.favorite !== true) return false;
  if (normalized.chapter !== null && !getEntryChapterNumbers(entry).includes(normalized.chapter)) return false;

  const timestamp = Date.parse(entry.date);
  const from = normalizeDateBoundary(normalized.from);
  const to = normalizeDateBoundary(normalized.to, { endOfDay: true });
  if (from !== null && (Number.isNaN(timestamp) || timestamp < from)) return false;
  if (to !== null && (Number.isNaN(timestamp) || timestamp > to)) return false;

  const query = normalizeText(normalized.query);
  if (query) {
    const document = buildSearchDocument(entry);
    const terms = query.split(' ').filter(Boolean);
    if (!terms.every((term) => document.includes(term))) return false;
  }

  return true;
}

function timestamp(entry) {
  const value = Date.parse(entry?.date);
  return Number.isNaN(value) ? 0 : value;
}

export function applyGrimoireFilters(entries, filters = DEFAULT_GRIMOIRE_FILTERS) {
  if (!Array.isArray(entries)) return [];
  const normalized = normalizeGrimoireFilters(filters);
  const direction = normalized.sort === 'oldest' ? 1 : -1;
  return entries
    .filter((entry) => entryMatchesGrimoireFilters(entry, normalized))
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => {
      const difference = (timestamp(left.entry) - timestamp(right.entry)) * direction;
      return difference || left.index - right.index;
    })
    .map(({ entry }) => entry);
}

export function updateGrimoireEntryMetadata(entries, id, patch = {}) {
  if (!Array.isArray(entries)) return [];
  if (typeof id !== 'string' || !id) return [...entries];

  let found = false;
  const updated = entries.map((entry) => {
    if (entry?.id !== id) return entry;
    found = true;
    return patchJournalEntryMetadata(entry, patch) || entry;
  });

  return found ? updated : [...entries];
}

export function buildGrimoireRecurrence(entries) {
  if (!Array.isArray(entries)) return [];
  const summary = new Map();

  entries.forEach((entry) => {
    const records = getEntryChapterRecords(entry);
    const consultationChapters = new Set();

    records.forEach((record) => {
      const current = summary.get(record.chapter) || {
        chapter: record.chapter,
        title: record.title || null,
        appearances: 0,
        consultations: 0,
        favoriteConsultations: 0,
        latestDate: null,
        entryIds: [],
      };

      current.appearances += 1;
      if (!current.title && record.title) current.title = record.title;
      if (typeof entry?.id === 'string' && !current.entryIds.includes(entry.id)) current.entryIds.push(entry.id);

      const entryTimestamp = timestamp(entry);
      if (entryTimestamp > timestamp({ date: current.latestDate })) current.latestDate = entry.date;

      if (!consultationChapters.has(record.chapter)) {
        consultationChapters.add(record.chapter);
        current.consultations += 1;
        if (entry?.favorite === true) current.favoriteConsultations += 1;
      }

      summary.set(record.chapter, current);
    });
  });

  return [...summary.values()].sort((left, right) => (
    right.appearances - left.appearances
    || right.consultations - left.consultations
    || timestamp({ date: right.latestDate }) - timestamp({ date: left.latestDate })
    || left.chapter - right.chapter
  ));
}
