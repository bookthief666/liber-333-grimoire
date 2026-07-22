import { stringToHash } from '../gematria/gematriaEngine.js';

export function getReadingChapterIndexes({ chapterCount, gematria, question, spreadType }) {
  if (spreadType !== 'spread') {
    return [gematria.simple % chapterCount];
  }

  // Thesis: full English Ordinal value.
  const idx1 = gematria.simple % chapterCount;
  // Antithesis: theosophically reduced value.
  const idx2 = gematria.reduced % chapterCount;
  // Synthesis: deterministic string hash.
  const idx3 = stringToHash(question) % chapterCount;

  // Preserve the existing forward-wrapping duplicate avoidance.
  const used = new Set([idx1]);
  let i2 = idx2;
  while (used.has(i2)) i2 = (i2 + 1) % chapterCount;
  used.add(i2);

  let i3 = idx3;
  while (used.has(i3)) i3 = (i3 + 1) % chapterCount;

  return [idx1, i2, i3];
}

export function selectReadingChapters({ chapters, gematria, question, spreadType }) {
  return getReadingChapterIndexes({
    chapterCount: chapters.length,
    gematria,
    question,
    spreadType,
  }).map((index) => chapters[index]);
}
