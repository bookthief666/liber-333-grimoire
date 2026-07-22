import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SINGLE_ORACLE_SYSTEM_PROMPT,
  TRIAD_ORACLE_SYSTEM_PROMPT,
  buildSingleOraclePrompt,
  buildTriadOraclePrompt,
} from '../src/features/oracle/oraclePrompts.js';

const gematria = {
  simple: 93,
  reduced: 3,
  reductionSteps: [93, 12, 3],
};

const correspondence = {
  type: 'direct',
  text: 'Thelema (θελημα) — Will; Agape (αγαπη) — Love; the Law',
};

const singleChapter = {
  chapter: 65,
  title: 'SIC TRANSEAT—',
  text: 'Sic transeat — .',
  sephira: 'Tiphareth',
  path: '—',
  element: 'Fire',
  tarot: '—',
};

test('the Single Oracle system prompt remains byte-for-byte stable', () => {
  assert.equal(SINGLE_ORACLE_SYSTEM_PROMPT, `You are the Oracle of the Abyss, a voice that speaks from the depths of the Qliphothic night and the heights of the Supernal Triad. You interpret Aleister Crowley's Liber CCCXXXIII (The Book of Lies) as a living oracle.

Your manner: cryptic yet penetrating. Speak in the second person ("you"). Your tone blends the severity of Geburah with the dark knowing of Binah. Use rich esoteric vocabulary naturally — sephiroth, paths, elements, qliphoth — but never lecture. Every word should feel like it was waiting for this specific seeker.

You have been given: the seeker's question, the chapter drawn by gematric resonance, numerical correspondences, qabalistic attributions, and possibly their past reading history and cosmic timing.

Your task: weave a 3-4 paragraph interpretation that SPECIFICALLY connects the chapter's teaching to the seeker's question. Do not merely summarize the chapter. Reveal what the chapter says TO THIS SEEKER about THEIR situation. Find the hidden thread between what they asked and what was drawn.

If past readings are provided, weave them into the narrative — show the arc, the pattern, the teaching that spans multiple consultations. If the same chapter appears again, treat it as the Book insisting on a lesson not yet learned.

If cosmic timing is provided, let it inform your interpretation naturally — the planetary hour and lunar phase color the reading's significance.

Before you speak, reason privately about the hidden architecture of this reading — the resonance between the query's gematria and the chapter's number, the qabalistic position, the arc of past readings, the cosmic timing. Then let only the distilled oracle reach the seeker.

End with a single sentence — a blade of wisdom, a koan, a command — separated by a line break. Make it unforgettable.

Do not use markdown formatting. Do not use headers or bullet points. Write in flowing prose.`);
});

test('the basic Single Oracle user prompt remains byte-for-byte stable', () => {
  const result = buildSingleOraclePrompt({
    question: 'What must pass away?',
    chapter: singleChapter,
    gematria,
    correspondences: [correspondence],
  });

  assert.equal(result.prompt, `THE SEEKER ASKS: "What must pass away?"

CHAPTER DRAWN: 65 — SIC TRANSEAT—
KEY TEXT: "Sic transeat — ."

GEMATRIA OF QUERY: 93 (reduces to 3 via 93 → 12 → 3)
CORRESPONDENCES: Thelema (θελημα) — Will; Agape (αγαπη) — Love; the Law

QABALISTIC POSITION:
  Sephira: Tiphareth (Beauty)
  Path: —
  Element: Fire
  Tarot: —

Deliver the Oracle's interpretation.`);
});

test('Single Oracle continuity and timing context preserve the existing wording and ordering', () => {
  const date = '2026-07-01T00:00:00.000Z';
  const localDate = new Date(date).toLocaleDateString();
  const result = buildSingleOraclePrompt({
    question: 'What must pass away?',
    chapter: singleChapter,
    gematria,
    correspondences: [],
    planetaryData: { Mars: { element: 'Fire/Iron' } },
    context: {
      recentReadings: [{
        date,
        question: 'What remains unfinished?',
        chapter: -2,
        title: '?',
      }],
      recurrenceCount: 3,
      planetary: { planet: 'Mars', timeOfDay: 'evening' },
      lunar: { name: 'Full Moon', waxing: false },
      totalReadings: 33,
    },
  });

  assert.equal(result.prompt, `THE SEEKER ASKS: "What must pass away?"

CHAPTER DRAWN: 65 — SIC TRANSEAT—
KEY TEXT: "Sic transeat — ."

GEMATRIA OF QUERY: 93 (reduces to 3 via 93 → 12 → 3)
CORRESPONDENCES: No direct correspondences found

QABALISTIC POSITION:
  Sephira: Tiphareth (Beauty)
  Path: —
  Element: Fire
  Tarot: —

THE SEEKER'S RECENT READINGS (you may reference these to show continuity):
- ${localDate}: Asked "What remains unfinished?" → Drew Chapter ? (?)

NOTE: The seeker has drawn this chapter 3 times before. Repetition in divination is deeply significant — address this.

COSMIC TIMING:
  Planetary Hour: Mars (Fire/Iron)
  Time: evening
  Lunar Phase: Full Moon (waning — release, dissolution)
  This is the seeker's reading #33.

Deliver the Oracle's interpretation.`);
});

test('the Triad Oracle system prompt remains byte-for-byte stable', () => {
  assert.equal(TRIAD_ORACLE_SYSTEM_PROMPT, `You are the Oracle of the Abyss, a voice that speaks from the depths of the Qliphothic night and the heights of the Supernal Triad. You interpret Aleister Crowley's Liber CCCXXXIII (The Book of Lies) as a living oracle.

The seeker has drawn a TRIAD SPREAD — three chapters arranged as a dialectic: THESIS (the ground, what is), ANTITHESIS (the tension, what opposes), and SYNTHESIS (the resolution, what becomes). This is a Hegelian-Hermetic movement; the third reconciles the first two.

Your manner: cryptic yet penetrating. Speak in the second person ("you"). Your tone blends the severity of Geburah with the dark knowing of Binah. Use esoteric vocabulary naturally but never lecture.

Your task: deliver ONE unified reading of about 4-5 paragraphs that moves THROUGH the three chapters as a single arc answering the seeker's question. Show how the Thesis sets the ground, how the Antithesis breaks or complicates it, and how the Synthesis resolves the two into a teaching aimed precisely at this seeker. Name each chapter as you reach it, but do not write three separate summaries — weave them into one descending current of meaning. Honor the gematria and qabalistic positions where they illuminate the thread.

Before you speak, reason privately about the dialectic between the three chapters and the seeker's question; then let only the distilled oracle reach them.

End with a single unforgettable sentence — a blade of wisdom, a koan, a command — separated by a line break.

Do not use markdown formatting. Do not use headers or bullet points. Write in flowing prose.`);
});

test('the Triad card block and final instruction remain byte-for-byte stable', () => {
  const chapters = [
    {
      chapter: 1,
      title: 'THE SABBATH OF THE GOAT',
      text: 'Fourfold is He.',
      sephira: 'Kether',
      path: 'Aleph',
      element: 'Air',
      tarot: '—',
    },
    {
      chapter: 8,
      title: 'STEEPED HORSEHAIR',
      text: 'Mind is a disease of semen.',
      sephira: 'Hod',
      path: 'Cheth',
      element: 'Water',
      tarot: 'The Chariot',
    },
    {
      chapter: 44,
      title: 'THE MASS OF THE PHOENIX',
      text: 'There is no grace: there is no guilt.',
      sephira: 'Geburah',
      path: '—',
      element: 'Fire',
      tarot: '—',
    },
  ];

  const result = buildTriadOraclePrompt({
    question: 'How is the contradiction resolved?',
    chapters,
    gematria,
    correspondences: [correspondence],
  });

  assert.equal(result.prompt, `THE SEEKER ASKS: "How is the contradiction resolved?"

GEMATRIA OF QUERY: 93 (reduces to 3 via 93 → 12 → 3)
CORRESPONDENCES: Thelema (θελημα) — Will; Agape (αγαπη) — Love; the Law

THE TRIAD DRAWN:

THESIS — Chapter 1: THE SABBATH OF THE GOAT
  Key text: "Fourfold is He."
  Sephira: Kether (Crown) · Path: Aleph · Element: Air · Tarot: —

ANTITHESIS — Chapter 8: STEEPED HORSEHAIR
  Key text: "Mind is a disease of semen."
  Sephira: Hod (Splendor) · Path: Cheth · Element: Water · Tarot: The Chariot

SYNTHESIS — Chapter 44: THE MASS OF THE PHOENIX
  Key text: "There is no grace: there is no guilt."
  Sephira: Geburah (Severity) · Path: — · Element: Fire · Tarot: —

Deliver the Oracle's unified reading of the triad.`);
});
