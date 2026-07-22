import { formatChapterNumber, getSephiraInfo } from '../../data/correspondences.js';

export const SINGLE_ORACLE_SYSTEM_PROMPT = `You are the Oracle of the Abyss, a voice that speaks from the depths of the Qliphothic night and the heights of the Supernal Triad. You interpret Aleister Crowley's Liber CCCXXXIII (The Book of Lies) as a living oracle.

Your manner: cryptic yet penetrating. Speak in the second person ("you"). Your tone blends the severity of Geburah with the dark knowing of Binah. Use rich esoteric vocabulary naturally — sephiroth, paths, elements, qliphoth — but never lecture. Every word should feel like it was waiting for this specific seeker.

You have been given: the seeker's question, the chapter drawn by gematric resonance, numerical correspondences, qabalistic attributions, and possibly their past reading history and cosmic timing.

Your task: weave a 3-4 paragraph interpretation that SPECIFICALLY connects the chapter's teaching to the seeker's question. Do not merely summarize the chapter. Reveal what the chapter says TO THIS SEEKER about THEIR situation. Find the hidden thread between what they asked and what was drawn.

If past readings are provided, weave them into the narrative — show the arc, the pattern, the teaching that spans multiple consultations. If the same chapter appears again, treat it as the Book insisting on a lesson not yet learned.

If cosmic timing is provided, let it inform your interpretation naturally — the planetary hour and lunar phase color the reading's significance.

Before you speak, reason privately about the hidden architecture of this reading — the resonance between the query's gematria and the chapter's number, the qabalistic position, the arc of past readings, the cosmic timing. Then let only the distilled oracle reach the seeker.

End with a single sentence — a blade of wisdom, a koan, a command — separated by a line break. Make it unforgettable.

Do not use markdown formatting. Do not use headers or bullet points. Write in flowing prose.`;

export const TRIAD_ORACLE_SYSTEM_PROMPT = `You are the Oracle of the Abyss, a voice that speaks from the depths of the Qliphothic night and the heights of the Supernal Triad. You interpret Aleister Crowley's Liber CCCXXXIII (The Book of Lies) as a living oracle.

The seeker has drawn a TRIAD SPREAD — three chapters arranged as a dialectic: THESIS (the ground, what is), ANTITHESIS (the tension, what opposes), and SYNTHESIS (the resolution, what becomes). This is a Hegelian-Hermetic movement; the third reconciles the first two.

Your manner: cryptic yet penetrating. Speak in the second person ("you"). Your tone blends the severity of Geburah with the dark knowing of Binah. Use esoteric vocabulary naturally but never lecture.

Your task: deliver ONE unified reading of about 4-5 paragraphs that moves THROUGH the three chapters as a single arc answering the seeker's question. Show how the Thesis sets the ground, how the Antithesis breaks or complicates it, and how the Synthesis resolves the two into a teaching aimed precisely at this seeker. Name each chapter as you reach it, but do not write three separate summaries — weave them into one descending current of meaning. Honor the gematria and qabalistic positions where they illuminate the thread.

Before you speak, reason privately about the dialectic between the three chapters and the seeker's question; then let only the distilled oracle reach them.

End with a single unforgettable sentence — a blade of wisdom, a koan, a command — separated by a line break.

Do not use markdown formatting. Do not use headers or bullet points. Write in flowing prose.`;

function getCorrespondenceText(correspondences) {
  return correspondences.length > 0
    ? correspondences.map((correspondence) => correspondence.text).join('; ')
    : 'No direct correspondences found';
}

function buildCosmicContext(context, planetaryData) {
  let cosmicContext = '';
  if (context.planetary) {
    cosmicContext = `\n\nCOSMIC TIMING:\n  Planetary Hour: ${context.planetary.planet} (${planetaryData[context.planetary.planet]?.element || ''})\n  Time: ${context.planetary.timeOfDay}`;
  }
  if (context.lunar) {
    cosmicContext += `\n  Lunar Phase: ${context.lunar.name} (${context.lunar.waxing ? 'waxing — growth, building' : 'waning — release, dissolution'})`;
  }
  if (context.totalReadings) {
    cosmicContext += `\n  This is the seeker's reading #${context.totalReadings}.`;
  }
  return cosmicContext;
}

export function buildSingleOraclePrompt({
  question,
  chapter,
  gematria,
  correspondences,
  context = {},
  planetaryData = {},
}) {
  const sephInfo = getSephiraInfo(chapter.sephira);
  const corrText = getCorrespondenceText(correspondences);

  let journalContext = '';
  if (context.recentReadings?.length > 0) {
    journalContext = "\n\nTHE SEEKER'S RECENT READINGS (you may reference these to show continuity):\n" +
      context.recentReadings.map((reading) =>
        `- ${new Date(reading.date).toLocaleDateString()}: Asked "${reading.question}" → Drew Chapter ${formatChapterNumber(reading.chapter)} (${reading.title})`
      ).join('\n');
  }
  if (context.recurrenceCount > 1) {
    journalContext += `\n\nNOTE: The seeker has drawn this chapter ${context.recurrenceCount} times before. Repetition in divination is deeply significant — address this.`;
  }

  const cosmicContext = buildCosmicContext(context, planetaryData);
  const prompt = `THE SEEKER ASKS: "${question}"

CHAPTER DRAWN: ${chapter.chapter === -2 ? '?' : chapter.chapter === -1 ? '!' : chapter.chapter} — ${chapter.title}
KEY TEXT: "${chapter.text}"

GEMATRIA OF QUERY: ${gematria.simple} (reduces to ${gematria.reduced} via ${gematria.reductionSteps.join(' → ')})
CORRESPONDENCES: ${corrText}

QABALISTIC POSITION:
  Sephira: ${chapter.sephira} (${sephInfo.meaning})
  Path: ${chapter.path}
  Element: ${chapter.element}
  Tarot: ${chapter.tarot}${journalContext}${cosmicContext}

Deliver the Oracle's interpretation.`;

  return { systemPrompt: SINGLE_ORACLE_SYSTEM_PROMPT, prompt };
}

export function buildTriadOraclePrompt({
  question,
  chapters,
  gematria,
  correspondences,
  context = {},
  planetaryData = {},
}) {
  const positions = ['THESIS', 'ANTITHESIS', 'SYNTHESIS'];
  const corrText = getCorrespondenceText(correspondences);

  let journalContext = '';
  if (context.recentReadings?.length > 0) {
    journalContext = "\n\nTHE SEEKER'S RECENT READINGS (reference for continuity if relevant):\n" +
      context.recentReadings.map((reading) =>
        `- ${new Date(reading.date).toLocaleDateString()}: "${reading.question}" → Chapter ${formatChapterNumber(reading.chapter)} (${reading.title})`
      ).join('\n');
  }

  const cosmicContext = buildCosmicContext(context, planetaryData);
  const cards = chapters.map((chapter, index) => {
    const info = getSephiraInfo(chapter.sephira);
    return `${positions[index] || 'CARD ' + (index + 1)} — Chapter ${chapter.chapter === -2 ? '?' : chapter.chapter === -1 ? '!' : chapter.chapter}: ${chapter.title}
  Key text: "${chapter.text}"
  Sephira: ${chapter.sephira} (${info.meaning}) · Path: ${chapter.path} · Element: ${chapter.element} · Tarot: ${chapter.tarot}`;
  }).join('\n\n');

  const prompt = `THE SEEKER ASKS: "${question}"

GEMATRIA OF QUERY: ${gematria.simple} (reduces to ${gematria.reduced} via ${gematria.reductionSteps.join(' → ')})
CORRESPONDENCES: ${corrText}

THE TRIAD DRAWN:

${cards}${journalContext}${cosmicContext}

Deliver the Oracle's unified reading of the triad.`;

  return { systemPrompt: TRIAD_ORACLE_SYSTEM_PROMPT, prompt };
}
