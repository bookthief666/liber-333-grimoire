import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRIMOIRE_MARKDOWN_FORMAT,
  GRIMOIRE_MARKDOWN_VERSION,
  getGrimoireMarkdownFilename,
  serializeGrimoireMarkdown,
} from '../src/features/journal/journalMarkdown.js';

const exportedAt = new Date('2026-07-25T05:00:00.000Z');

const entries = [{
  id: 'entry-1',
  date: '2026-07-24T23:30:00.000Z',
  question: 'How should I proceed?\nWithout repeating the old pattern?',
  spreadType: 'Thesis/Antithesis/Synthesis',
  favorite: true,
  gematria: 333,
  planetary: 'Mercury hour',
  lunar: 'First Quarter',
  chapters: [
    { chapter: 7, title: 'THE DINOSAURS', sourceText: 'Source seven.' },
    { chapter: 33, title: 'BAAPHOMET', commentary: 'Fixed commentary thirty-three.' },
    { chapter: 3, title: 'THE OYSTER', interpretation: 'Oracle layer three.' },
  ],
  note: 'Take one action.\nReview it tomorrow.',
}];

test('serializes a readable provenance-labeled local export', () => {
  const markdown = serializeGrimoireMarkdown({
    entries,
    totalReadings: 44,
    exportedAt,
    filterDescription: 'Favorites · Triad',
  });

  assert.match(markdown, /# Liber CCCXXXIII — Grimoire Workbench/);
  assert.ok(markdown.includes(`**Format:** ${GRIMOIRE_MARKDOWN_FORMAT}`));
  assert.ok(markdown.includes(`**Version:** ${GRIMOIRE_MARKDOWN_VERSION}`));
  assert.match(markdown, /\*\*Lifetime reading total:\*\* 44/);
  assert.match(markdown, /\*\*Selection:\*\* Favorites · Triad/);
  assert.match(markdown, /\*\*Spread:\*\* Triad/);
  assert.match(markdown, /\*\*Favorite:\*\* Yes/);
  assert.match(markdown, /Chapter 7 — THE DINOSAURS/);
  assert.match(markdown, /Chapter 33 — BAAPHOMET/);
  assert.match(markdown, /Chapter 3 — THE OYSTER/);
  assert.match(markdown, /#### Source text/);
  assert.match(markdown, /> Source seven\./);
  assert.match(markdown, /#### Fixed editorial commentary/);
  assert.match(markdown, /> Fixed commentary thirty-three\./);
  assert.match(markdown, /#### Oracle interpretation/);
  assert.match(markdown, /> Oracle layer three\./);
  assert.match(markdown, /#### Private integration note/);
  assert.match(markdown, /> Take one action\.\n> Review it tomorrow\./);
  assert.match(markdown, /> How should I proceed\?\n> Without repeating the old pattern\?/);
  assert.equal(markdown.endsWith('\n'), true);
});

test('hydrates canonical source text and fixed commentary for ordinary saved entries', () => {
  const markdown = serializeGrimoireMarkdown({
    entries: [{
      id: 'ordinary',
      date: '2026-07-24T23:30:00.000Z',
      question: 'What is generated through death?',
      chapter: 1,
      title: 'THE SABBATH OF THE GOAT',
      spreadType: 'single',
      favorite: false,
    }],
    exportedAt,
  });
  assert.match(markdown, /Cast the Seed into the Field of Night/);
  assert.match(markdown, /Chapter 1 = Kether/);
});

test('labels incomplete historical Triads without claiming missing positions', () => {
  const markdown = serializeGrimoireMarkdown({
    entries: [{
      ...entries[0],
      id: 'historical-fragment',
      legacyTriadFragment: true,
    }],
    exportedAt,
  });
  assert.match(markdown, /\*\*Spread:\*\* Historical Triad fragment/);
});

test('exports an explicit empty-state document', () => {
  const markdown = serializeGrimoireMarkdown({ entries: [], exportedAt });
  assert.match(markdown, /\*\*Exported consultations:\*\* 0/);
  assert.match(markdown, /No consultations matched this export/);
});

test('creates stable full and filtered Markdown filenames', () => {
  assert.equal(getGrimoireMarkdownFilename(exportedAt), 'liber-333-grimoire-2026-07-25.md');
  assert.equal(
    getGrimoireMarkdownFilename(exportedAt, { filtered: true }),
    'liber-333-grimoire-filtered-2026-07-25.md',
  );
  assert.throws(() => getGrimoireMarkdownFilename('not-a-date'), TypeError);
});
