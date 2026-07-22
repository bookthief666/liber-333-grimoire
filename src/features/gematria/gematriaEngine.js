import { ENGLISH_QABALAH, NOTABLE_NUMBERS } from './gematriaData.js';

export const GEMATRIA_METHOD = Object.freeze({
  id: 'english-ordinal-a1z26',
  label: 'English Ordinal (A=1–Z=26)',
  countedCharacters: 'Latin letters A through Z',
});

export const calculateGematria = (text) => {
  const clean = text.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length === 0) return { simple: 0, reduced: 0, raw: 0 };
  
  let simple = 0;
  for (const ch of clean) {
    simple += ENGLISH_QABALAH[ch] || 0;
  }
  
  // Theosophic reduction (reduce to single digit)
  let reduced = simple;
  let reductionSteps = [simple];
  while (reduced > 9) {
    reduced = String(reduced).split('').reduce((a, b) => a + parseInt(b), 0);
    reductionSteps.push(reduced);
  }
  
  return {
    simple,           // Full sum (e.g. 93)
    reduced,          // Single digit (e.g. 3)
    raw: clean.length, // Number of letters
    reductionSteps,   // [93, 12, 3] — for display
  };
};

export const findCorrespondences = (value) => {
  if (value === 0) return [];
  const matches = [];
  
  // Direct match
  if (NOTABLE_NUMBERS[value]) {
    matches.push({ type: 'direct', text: NOTABLE_NUMBERS[value] });
  }
  
  // Perfect square check
  const sqrt = Math.sqrt(value);
  if (Number.isInteger(sqrt) && sqrt > 1) {
    matches.push({ type: 'square', text: `${sqrt}² — the ${sqrt}-fold principle squared` });
  }
  
  // Factor analysis (interesting factors only)
  for (const [num, meaning] of Object.entries(NOTABLE_NUMBERS)) {
    const n = parseInt(num);
    if (n > 1 && n < value && n <= 100 && value % n === 0) {
      const other = value / n;
      if (other !== 1 && other !== value) {
        const shortMeaning = meaning.split(';')[0].split('—')[0].trim();
        matches.push({ type: 'factor', text: `${value} = ${n} × ${other} (${shortMeaning})` });
      }
    }
  }
  
  // Proximity check (±1 from notable numbers)
  if (NOTABLE_NUMBERS[value - 1]) {
    const nearby = NOTABLE_NUMBERS[value - 1].split(';')[0].split('—')[0].trim();
    matches.push({ type: 'proximity', text: `One beyond ${value - 1} (${nearby})` });
  }
  if (NOTABLE_NUMBERS[value + 1]) {
    const nearby = NOTABLE_NUMBERS[value + 1].split(';')[0].split('—')[0].trim();
    matches.push({ type: 'proximity', text: `One before ${value + 1} (${nearby})` });
  }
  
  // Limit results and prioritize: direct > square > factor > proximity
  const priority = { direct: 0, square: 1, factor: 2, proximity: 3 };
  matches.sort((a, b) => priority[a.type] - priority[b.type]);
  
  return matches.slice(0, 8);
};

export const stringToHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};
