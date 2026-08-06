import { countJournalConsultations } from './consultationSemantics.js';
import {
  getEntryChapterRecords,
  normalizeSpreadType,
} from './grimoireWorkbench.js';

export const GRIMOIRE_MARKDOWN_FORMAT = 'liber-333-grimoire-markdown';
export const GRIMOIRE_MARKDOWN_VERSION = 1;
export const countGrimoireConsultations = countJournalConsultations;

function normalizeText(value) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\r\n?/g, '\n').trim();
}

function quoteMarkdown(value) {
  const text = normalizeText(value);
  if (!text) return '> —';
  return text.split('\n').map((line) => `> ${line || ' '}`).join('\n');
}

function formatDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toISOString();
}

function humanSpread(entry) {
  if (entry?.legacyTriadFragment === true) return 'Historical Triad fragment';
  return normalizeSpreadType(entry?.spreadType) === 'triad' ? 'Triad' : 'Single';
}

function formatChapter(record) {
  const title = normalizeText(record?.title);
  return title ? `Chapter ${record.chapter} — ${title}` : `Chapter ${record.chapter}`;
}

function appendOptionalSection(lines, heading, value) {
  const text = normalizeText(value);
  if (!text) return;
  lines.push('', `#### ${heading}`, '', quoteMarkdown(text));
}

function entryMarkdown(entry, index) {
  const chapters = getEntryChapterRecords(entry);
  const lines = [
    `## ${index + 1}. ${formatDate(entry?.date)}`,
    '',
    `- **Spread:** ${humanSpread(entry)}`,
    `- **Favorite:** ${entry?.favorite === true ? 'Yes' : 'No'}`,
  ];

  if (Number.isFinite(Number(entry?.gematria))) lines.push(`- **Gematria:** ${Math.trunc(Number(entry.gematria))}`);
  if (normalizeText(entry?.planetary)) lines.push(`- **Planetary context:** ${normalizeText(entry.planetary)}`);
  if (normalizeText(entry?.lunar)) lines.push(`- **Lunar context:** ${normalizeText(entry.lunar)}`);

  lines.push('', '### Question', '', quoteMarkdown(entry?.question));
  lines.push('', '### Source selection', '');
  if (chapters.length) chapters.forEach((record) => lines.push(`- ${formatChapter(record)}`));
  else lines.push('- No chapter metadata was stored with this consultation.');

  const sourceText = entry?.sourceText ?? chapters.map((record) => record.sourceText).filter(Boolean).join('\n\n');
  const commentary = entry?.fixedCommentary ?? entry?.commentary
    ?? chapters.map((record) => record.commentary).filter(Boolean).join('\n\n');
  const oracleInterpretation = entry?.oracleInterpretation ?? entry?.interpretation
    ?? chapters.map((record) => record.interpretation).filter(Boolean).join('\n\n');
  const note = entry?.note ?? entry?.integrationNote;

  appendOptionalSection(lines, 'Source text', sourceText);
  appendOptionalSection(lines, 'Fixed editorial commentary', commentary);
  appendOptionalSection(lines, 'Oracle interpretation', oracleInterpretation);
  appendOptionalSection(lines, 'Private integration note', note);

  return lines.join('\n');
}

export function serializeGrimoireMarkdown({
  entries,
  totalReadings = null,
  exportedAt = new Date(),
  title = 'Liber CCCXXXIII — Grimoire Workbench',
  filterDescription = null,
} = {}) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const consultationCount = countJournalConsultations(safeEntries);
  const lines = [
    `# ${normalizeText(title) || 'Liber CCCXXXIII — Grimoire Workbench'}`,
    '',
    `- **Format:** ${GRIMOIRE_MARKDOWN_FORMAT}`,
    `- **Version:** ${GRIMOIRE_MARKDOWN_VERSION}`,
    `- **Generated:** ${formatDate(exportedAt)}`,
    `- **Exported consultations:** ${consultationCount}`,
  ];

  if (safeEntries.length !== consultationCount) {
    lines.push(`- **Exported entries:** ${safeEntries.length}`);
  }
  if (Number.isInteger(totalReadings) && totalReadings >= 0) {
    lines.push(`- **Lifetime reading total:** ${Math.max(totalReadings, consultationCount)}`);
  }
  if (normalizeText(filterDescription)) lines.push(`- **Selection:** ${normalizeText(filterDescription)}`);

  lines.push(
    '',
    '> This document is a human-readable local export. The versioned JSON backup remains the canonical machine-restorable format.',
    '',
    '---',
  );

  if (!safeEntries.length) {
    lines.push('', '_No consultations matched this export._', '');
    return lines.join('\n');
  }

  safeEntries.forEach((entry, index) => {
    lines.push('', entryMarkdown(entry, index), '', '---');
  });

  return `${lines.join('\n').replace(/\n{4,}/g, '\n\n\n').trim()}\n`;
}

export function getGrimoireMarkdownFilename(exportedAt = new Date(), { filtered = false } = {}) {
  const date = exportedAt instanceof Date ? exportedAt : new Date(exportedAt);
  if (Number.isNaN(date.getTime())) throw new TypeError('Markdown export date is invalid.');
  const suffix = filtered ? '-filtered' : '';
  return `liber-333-grimoire${suffix}-${date.toISOString().slice(0, 10)}.md`;
}
