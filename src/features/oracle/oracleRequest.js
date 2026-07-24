import { LIBER_333 } from '../../data/liber333.js';
import { MOON_PHASES, PLANETS } from '../../data/planetary.js';
import { calculateGematria, findCorrespondences } from '../gematria/gematriaEngine.js';
import { buildSingleOraclePrompt, buildTriadOraclePrompt } from './oraclePrompts.js';

export const ORACLE_REQUEST_VERSION = 1;

export const ORACLE_OPERATIONS = Object.freeze({
  single: 'single',
  triad: 'triad',
});

export const ORACLE_REQUEST_LIMITS = Object.freeze({
  questionChars: 2000,
  recentReadings: 5,
  recentQuestionChars: 500,
  recurrenceCount: 999,
  totalReadings: 1_000_000,
});

const TIME_OF_DAY_VALUES = new Set(['deep night', 'morning', 'midday', 'afternoon', 'evening']);
const CHAPTER_BY_NUMBER = new Map(LIBER_333.map((chapter) => [chapter.chapter, chapter]));
const MOON_PHASE_BY_NAME = new Map(MOON_PHASES.map((phase) => [phase.name, phase]));

const isPlainObject = (value) => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const invalid = (error, code = 'invalid_oracle_request') => ({ ok: false, code, error });

function serializeContext(context = {}) {
  const serialized = {};

  if (Array.isArray(context.recentReadings) && context.recentReadings.length > 0) {
    serialized.recentReadings = context.recentReadings
      .slice(0, ORACLE_REQUEST_LIMITS.recentReadings)
      .map((reading) => ({
        date: reading?.date,
        question: reading?.question,
        chapter: reading?.chapter,
      }));
  }

  if (Number.isInteger(context.recurrenceCount)) serialized.recurrenceCount = context.recurrenceCount;
  if (Number.isInteger(context.totalReadings)) serialized.totalReadings = context.totalReadings;

  if (context.planetary?.planet || context.planetary?.timeOfDay) {
    serialized.planetary = {
      planet: context.planetary.planet,
      timeOfDay: context.planetary.timeOfDay,
    };
  }

  if (context.lunar?.name) serialized.lunar = { name: context.lunar.name };

  return serialized;
}

function createRequest({ operation, question, chapters, context = {}, stream = true }) {
  return {
    version: ORACLE_REQUEST_VERSION,
    operation,
    question,
    chapterNumbers: chapters.map((chapter) => chapter.chapter),
    context: serializeContext(context),
    stream: stream === true,
  };
}

export function createSingleOracleRequest({ question, chapter, context = {}, stream = true }) {
  return createRequest({
    operation: ORACLE_OPERATIONS.single,
    question,
    chapters: [chapter],
    context,
    stream,
  });
}

export function createTriadOracleRequest({ question, chapters, context = {}, stream = true }) {
  return createRequest({
    operation: ORACLE_OPERATIONS.triad,
    question,
    chapters,
    context,
    stream,
  });
}

function validateRecentReadings(value) {
  if (value === undefined) return { ok: true, value: [] };
  if (!Array.isArray(value)) return invalid('Recent readings must be an array.');
  if (value.length > ORACLE_REQUEST_LIMITS.recentReadings) {
    return invalid(`Recent readings may contain at most ${ORACLE_REQUEST_LIMITS.recentReadings} entries.`);
  }

  const readings = [];
  for (const reading of value) {
    if (!isPlainObject(reading)) return invalid('Each recent reading must be an object.');

    const question = typeof reading.question === 'string' ? reading.question.trim() : '';
    if (!question) return invalid('Each recent reading must include a question.');
    if (question.length > ORACLE_REQUEST_LIMITS.recentQuestionChars) {
      return invalid(`A recent reading question exceeds ${ORACLE_REQUEST_LIMITS.recentQuestionChars} characters.`);
    }

    if (!Number.isInteger(reading.chapter) || !CHAPTER_BY_NUMBER.has(reading.chapter)) {
      return invalid('A recent reading references an unknown chapter.');
    }

    const date = typeof reading.date === 'string' ? reading.date : '';
    if (!date || Number.isNaN(Date.parse(date))) return invalid('A recent reading has an invalid date.');

    const chapter = CHAPTER_BY_NUMBER.get(reading.chapter);
    readings.push({
      date,
      question,
      chapter: chapter.chapter,
      title: chapter.title,
    });
  }

  return { ok: true, value: readings };
}

function validateContext(value) {
  if (value === undefined) return { ok: true, value: {} };
  if (!isPlainObject(value)) return invalid('Reading context must be an object.');

  const recent = validateRecentReadings(value.recentReadings);
  if (!recent.ok) return recent;

  const context = {};
  if (recent.value.length > 0) context.recentReadings = recent.value;

  if (value.recurrenceCount !== undefined) {
    if (!Number.isInteger(value.recurrenceCount) || value.recurrenceCount < 0 || value.recurrenceCount > ORACLE_REQUEST_LIMITS.recurrenceCount) {
      return invalid(`Recurrence count must be an integer from 0 to ${ORACLE_REQUEST_LIMITS.recurrenceCount}.`);
    }
    context.recurrenceCount = value.recurrenceCount;
  }

  if (value.totalReadings !== undefined) {
    if (!Number.isInteger(value.totalReadings) || value.totalReadings < 0 || value.totalReadings > ORACLE_REQUEST_LIMITS.totalReadings) {
      return invalid(`Total readings must be an integer from 0 to ${ORACLE_REQUEST_LIMITS.totalReadings}.`);
    }
    context.totalReadings = value.totalReadings;
  }

  if (value.planetary !== undefined) {
    if (!isPlainObject(value.planetary)) return invalid('Planetary context must be an object.');
    const planet = value.planetary.planet;
    const timeOfDay = value.planetary.timeOfDay;
    if (typeof planet !== 'string' || !PLANETS[planet]) return invalid('Planetary context references an unknown planet.');
    if (typeof timeOfDay !== 'string' || !TIME_OF_DAY_VALUES.has(timeOfDay)) return invalid('Planetary context has an unknown time-of-day value.');
    context.planetary = { planet, timeOfDay };
  }

  if (value.lunar !== undefined) {
    if (!isPlainObject(value.lunar)) return invalid('Lunar context must be an object.');
    const phase = MOON_PHASE_BY_NAME.get(value.lunar.name);
    if (!phase) return invalid('Lunar context references an unknown phase.');
    context.lunar = { name: phase.name, waxing: phase.waxing };
  }

  return { ok: true, value: context };
}

export function validateOracleRequest(body) {
  if (!isPlainObject(body)) return invalid('Request body must be a JSON object.');
  if ('prompt' in body || 'systemPrompt' in body) {
    return invalid('Legacy prompt payloads are not accepted.', 'legacy_prompt_payload');
  }
  if (body.version !== ORACLE_REQUEST_VERSION) {
    return invalid(`Unsupported Oracle request version. Expected ${ORACLE_REQUEST_VERSION}.`, 'unsupported_version');
  }

  const operation = body.operation;
  if (operation !== ORACLE_OPERATIONS.single && operation !== ORACLE_OPERATIONS.triad) {
    return invalid('Oracle operation must be single or triad.');
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question) return invalid('Missing question.');
  if (question.length > ORACLE_REQUEST_LIMITS.questionChars) {
    return invalid(`Question exceeds the ${ORACLE_REQUEST_LIMITS.questionChars.toLocaleString()} character limit.`);
  }

  const chapterNumbers = body.chapterNumbers;
  const expectedCount = operation === ORACLE_OPERATIONS.triad ? 3 : 1;
  if (!Array.isArray(chapterNumbers) || chapterNumbers.length !== expectedCount) {
    return invalid(`${operation === ORACLE_OPERATIONS.triad ? 'Triad' : 'Single'} requests require exactly ${expectedCount} chapter number${expectedCount === 1 ? '' : 's'}.`);
  }
  if (chapterNumbers.some((number) => !Number.isInteger(number) || !CHAPTER_BY_NUMBER.has(number))) {
    return invalid('Request references an unknown chapter.');
  }
  if (new Set(chapterNumbers).size !== chapterNumbers.length) {
    return invalid('Triad chapter numbers must be unique.');
  }

  const contextResult = validateContext(body.context);
  if (!contextResult.ok) return contextResult;

  return {
    ok: true,
    request: {
      version: ORACLE_REQUEST_VERSION,
      operation,
      question,
      chapterNumbers: [...chapterNumbers],
      chapters: chapterNumbers.map((number) => CHAPTER_BY_NUMBER.get(number)),
      context: contextResult.value,
      stream: body.stream === true,
    },
  };
}

export function buildOraclePromptFromRequest(request) {
  const gematria = calculateGematria(request.question);
  const correspondences = findCorrespondences(gematria.simple);
  const shared = {
    question: request.question,
    gematria,
    correspondences,
    context: request.context,
    planetaryData: PLANETS,
  };

  const prompts = request.operation === ORACLE_OPERATIONS.triad
    ? buildTriadOraclePrompt({ ...shared, chapters: request.chapters })
    : buildSingleOraclePrompt({ ...shared, chapter: request.chapters[0] });

  return {
    ...prompts,
    gematria,
    correspondences,
    chapters: request.chapters,
  };
}
