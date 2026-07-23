export const TREE_POS = {
  Kether: { x: 50, y: 7 },
  Chokmah: { x: 79, y: 19 },
  Binah: { x: 21, y: 19 },
  Daath: { x: 50, y: 31 },
  Chesed: { x: 79, y: 43 },
  Geburah: { x: 21, y: 43 },
  Tiphareth: { x: 50, y: 54 },
  Netzach: { x: 79, y: 68 },
  Hod: { x: 21, y: 68 },
  Yesod: { x: 50, y: 80 },
  Malkuth: { x: 50, y: 95 },
};

export const TREE_NODE_ORDER = [
  'Kether',
  'Chokmah',
  'Binah',
  'Daath',
  'Chesed',
  'Geburah',
  'Tiphareth',
  'Netzach',
  'Hod',
  'Yesod',
  'Malkuth',
];

export const VEIL_KEYS = ['Ain', 'Ain Soph', 'Ain Soph Aur'];

export function groupChaptersBySephira(chapters) {
  const groups = {};
  for (const chapter of chapters) {
    const key = chapter.sephira || '—';
    (groups[key] = groups[key] || []).push(chapter);
  }
  return groups;
}

export function deriveTreePaths(groups, positions = TREE_POS) {
  return Object.keys(groups)
    .filter((key) => key.includes('-'))
    .map((key) => {
      const [a, b] = key.split('-');
      if (positions[a] && positions[b]) return { key, a, b };
      return null;
    })
    .filter(Boolean);
}

export function getVeilChapters(groups) {
  return VEIL_KEYS.flatMap((key) => groups[key] || []);
}
