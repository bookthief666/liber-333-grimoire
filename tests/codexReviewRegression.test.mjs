import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  countGrimoireConsultations,
  serializeGrimoireMarkdown,
} from '../src/features/journal/journalMarkdown.js';

test('date-only Workbench filters use local calendar-day boundaries', () => {
  const moduleUrl = new URL('../src/features/journal/grimoireWorkbench.js', import.meta.url).href;
  const script = `
    import { entryMatchesGrimoireFilters } from ${JSON.stringify(moduleUrl)};
    const results = {
      lateLocalDayIncluded: entryMatchesGrimoireFilters(
        { date: '2026-07-21T06:30:00.000Z' },
        { to: '2026-07-20' },
      ),
      nextLocalDayExcluded: entryMatchesGrimoireFilters(
        { date: '2026-07-21T07:00:00.000Z' },
        { to: '2026-07-20' },
      ),
      localDayStartIncluded: entryMatchesGrimoireFilters(
        { date: '2026-07-20T07:00:00.000Z' },
        { from: '2026-07-20' },
      ),
      previousLocalDayExcluded: entryMatchesGrimoireFilters(
        { date: '2026-07-20T06:59:59.999Z' },
        { from: '2026-07-20' },
      ),
    };
    process.stdout.write(JSON.stringify(results));
  `;

  const output = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
    encoding: 'utf8',
    env: { ...process.env, TZ: 'America/Los_Angeles' },
  });

  assert.deepEqual(JSON.parse(output), {
    lateLocalDayIncluded: true,
    nextLocalDayExcluded: false,
    localDayStartIncluded: true,
    previousLocalDayExcluded: false,
  });
});

test('Markdown metadata counts grouped Triads as consultations, not entries', () => {
  const triadBase = {
    consultationId: 'triad-1',
    date: '2026-07-20T18:00:00.000Z',
    question: 'How do these three positions resolve?',
    spreadType: 'triad',
  };
  const entries = [
    { ...triadBase, id: 'triad-thesis', chapter: 1, title: 'THE SABBATH OF THE GOAT', spreadPosition: 'thesis' },
    { ...triadBase, id: 'triad-antithesis', chapter: 2, title: 'THE CRY OF THE HAWK', spreadPosition: 'antithesis' },
    { ...triadBase, id: 'triad-synthesis', chapter: 3, title: 'THE OYSTER', spreadPosition: 'synthesis' },
    {
      id: 'single-1',
      date: '2026-07-21T18:00:00.000Z',
      question: 'What is the next act?',
      chapter: 7,
      title: 'THE DINOSAURS',
      spreadType: 'single',
    },
  ];

  assert.equal(countGrimoireConsultations(entries), 2);
  const markdown = serializeGrimoireMarkdown({
    entries,
    exportedAt: new Date('2026-07-22T00:00:00.000Z'),
  });
  assert.match(markdown, /\*\*Exported consultations:\*\* 2/);
  assert.match(markdown, /\*\*Exported entries:\*\* 4/);
});
