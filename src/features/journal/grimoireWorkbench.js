import { LIBER_333 } from '../../data/liber333.js';
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
const CHAPTER_BY_NUMBER = new Map(LIBER_333.map((chapter) => [chapter.chapter, chapter]));

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function explicitText(value) {
  return typeof value === 'string' && value.trim() ? value : null;
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
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isInteger(number) && CHAPTER_BY_NUMBER.has(number) ? number : null;
}

function normalizeDateBoundary(value, { endOfDay = false } = {}) {
  if (value === undefined || value === null || value === '') return null;
  const text = String(value).trim();
  if (!text) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split('-').map(Number);
    const boundary = new Date(0);
    boundary.setFullYear(year, month - 1, day);
    boundary.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);

    if (
      boundary.getFullYear() !== year
      || boundary.getMonth() !== month - 1
      || boundary.getDate() !== day
    ) return null;

    return boundary.getTime();
  }

  const timestamp = Date.parse(text);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function normalizeSpreadType(value) {
  const normalized = String(value ?? '').trim().toLocaleLowerCase('en-US');
  const isTriad = normalized === 'spread'
    || normalized.includes('triad')
    || normalized.includes('three-card')
    || normalized.includes('three card')
    || (
      normalized.includes('thesis')
      && normalized.includes('antithesis')
      && normalized.includes('synthesis')
    );
  return isTriad ? 'triad' : 'single';
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
  const source = Number.isInteger(value) ? { chapter: value } : value;
  if (!isPlainObject(source)) return null;
  const chapter = normalizeChapterNumber(source.chapter ?? source.number);
  if (chapter === null) return null;

  const canonical = CHAPTER_BY_NUMBER.get(chapter) || {};
  const explicit = {
    title: explicitText(source.title) || explicitText(fallbackTitle),
    sourceText: explicitText(source.sourceText ?? source.text),
    commentary: explicitText(source.fixedCommentary ?? source.commentary),
    interpretation: explicitText(source.oracleInterpretation ?? source.interpretation),
  };

  return {
    chapter,
    title: explicit.title || explicitText(canonical.title),
    sourceText: explicit.sourceText || explicitText(canonical.text),
    commentary: explicit.commentary || explicitText(canonical.commentary),
    interpretation: explicit.interpretation,
    _explicit: {
      title: Boolean(explicit.title),
      sourceText: Boolean(explicit.sourceText),
      commentary: Boolean(explicit.commentary),
      interpretation: Boolean(explicit.interpretation),
    },
  };
}

function mergeChapterRecords(current, incoming) {
  if (!current) return incoming;
  const merged = {
    ...current,
    _explicit: { ...current._explicit },
  };
  for (const field of ['title', 'sourceText', 'commentary', 'interpretation']) {
    if (incoming._explicit?.[field]) {
      merged[field] = incoming[field];
      merged._explicit[field] = true;
    } else if (!merged[field] && incoming[field]) {
      merged[field] = incoming[field];
    }
  }
  return merged;
}

export function getEntryChapterRecords(entry) {
  if (!isPlainObject(entry)) return [];
  const byChapter = new Map();
  const append = (value, fallbackTitle = null) => {
    const record = chapterRecord(value, fallbackTitle);
    if (!record) return;
    byChapter.set(record.chapter, mergeChapterRecords(byChapter.get(record.chapter), record));
  };

  append({
    chapter: entry.chapter,
    title: entry.title,
    sourceText: entry.sourceText,
    fixedCommentary: entry.fixedCommentary,
    commentary: entry.commentary,
    oracleInterpretation: entry.oracleInterpretation,
    interpretation: entry.interpretation,
  });

  for (const key of ['chapters', 'triad', 'selectedChapters']) {
    if (Array.isArray(entry[key])) entry[key].forEach((value) => append(value));
  }

  return [...byChapter.values()].map(({ _explicit, ...record }) => record);
}

export function getEntryChapterNumbers(entry) {
  return getEntryChapterRecords(entry).map((record) => record.chapter);
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
    entry?.spreadPosition,
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

  const entryTimestamp = Date.parse(entry.date);
  const from = normalizeDateBoundary(normalized.from);
  const to = normalizeDateBoundary(normalized.to, { endOfDay: true });
  if (from !== null && (Number.isNaN(entryTimestamp) || entryTimestamp < from)) return false;
  if (to !== null && (Number.isNaN(entryTimestamp) || entryTimestamp > to)) return false;

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

export function getGrimoireConsultationKey(entry) {
  const explicit = explicitText(entry?.consultationId);
  if (explicit) return `consultation:${explicit}`;

  if (normalizeSpreadType(entry?.spreadType) === 'triad') {
    const parsed = Date.parse(entry?.date);
    const minute = Number.isNaN(parsed) ? 'unknown-time' : new Date(parsed).toISOString().slice(0, 16);
    return [
      'legacy-triad',
      normalizeText(entry?.question),
      minute,
      normalizeText(entry?.gematria),
    ].join(':');
  }

  const id = explicitText(entry?.id);
  return `entry:${id || `${normalizeText(entry?.question)}:${timestamp(entry)}`}`;
}

export function buildGrimoireRecurrence(entries) {
  if (!Array.isArray(entries)) return [];
  const summary = new Map();

  entries.forEach((entry) => {
    const records = getEntryChapterRecords(entry);
    const consultationKey = getGrimoireConsultationKey(entry);

    records.forEach((record) => {
      const current = summary.get(record.chapter) || {
        chapter: record.chapter,
        title: record.title || null,
        appearances: 0,
        consultations: 0,
        favoriteConsultations: 0,
        latestDate: null,
        entryIds: [],
        consultationKeys: new Set(),
        favoriteKeys: new Set(),
      };

      current.appearances += 1;
      if (!current.title && record.title) current.title = record.title;
      if (typeof entry?.id === 'string' && !current.entryIds.includes(entry.id)) current.entryIds.push(entry.id);

      const entryTimestamp = timestamp(entry);
      if (entryTimestamp > timestamp({ date: current.latestDate })) current.latestDate = entry.date;

      if (!current.consultationKeys.has(consultationKey)) {
        current.consultationKeys.add(consultationKey);
        current.consultations += 1;
      }
      if (entry?.favorite === true && !current.favoriteKeys.has(consultationKey)) {
        current.favoriteKeys.add(consultationKey);
        current.favoriteConsultations += 1;
      }

      summary.set(record.chapter, current);
    });
  });

  return [...summary.values()]
    .map(({ consultationKeys, favoriteKeys, ...item }) => item)
    .sort((left, right) => (
      right.appearances - left.appearances
      || right.consultations - left.consultations
      || timestamp({ date: right.latestDate }) - timestamp({ date: left.latestDate })
      || left.chapter - right.chapter
    ));
}
