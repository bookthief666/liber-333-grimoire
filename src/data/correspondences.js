// Shared Qabalistic correspondence data extracted without editorial changes.

export const HEBREW_LETTERS = {
  "Aleph":   { letter: "א", value: 1,   meaning: "Ox",        element: "Air",         tarot: "The Fool" },
  "Beth":    { letter: "ב", value: 2,   meaning: "House",     element: "Mercury",     tarot: "The Magus" },
  "Gimel":   { letter: "ג", value: 3,   meaning: "Camel",     element: "Moon",        tarot: "High Priestess" },
  "Daleth":  { letter: "ד", value: 4,   meaning: "Door",      element: "Venus",       tarot: "The Empress" },
  "Hé":      { letter: "ה", value: 5,   meaning: "Window",    element: "Aries",       tarot: "The Star" },
  "Vau":     { letter: "ו", value: 6,   meaning: "Nail",      element: "Taurus",      tarot: "The Hierophant" },
  "Zayin":   { letter: "ז", value: 7,   meaning: "Sword",     element: "Gemini",      tarot: "The Lovers" },
  "Cheth":   { letter: "ח", value: 8,   meaning: "Fence",     element: "Cancer",      tarot: "The Chariot" },
  "Teth":    { letter: "ט", value: 9,   meaning: "Serpent",   element: "Leo",         tarot: "Lust" },
  "Yod":     { letter: "י", value: 10,  meaning: "Hand",      element: "Virgo",       tarot: "The Hermit" },
  "Kaph":    { letter: "כ", value: 20,  meaning: "Palm",      element: "Jupiter",     tarot: "Fortune" },
  "Lamed":   { letter: "ל", value: 30,  meaning: "Ox Goad",   element: "Libra",       tarot: "Adjustment" },
  "Mem":     { letter: "מ", value: 40,  meaning: "Water",     element: "Water",       tarot: "Hanged Man" },
  "Nun":     { letter: "נ", value: 50,  meaning: "Fish",      element: "Scorpio",     tarot: "Death" },
  "Samekh":  { letter: "ס", value: 60,  meaning: "Prop",      element: "Sagittarius", tarot: "Art" },
  "Ayin":    { letter: "ע", value: 70,  meaning: "Eye",       element: "Capricorn",   tarot: "The Devil" },
  "Pé":      { letter: "פ", value: 80,  meaning: "Mouth",     element: "Mars",        tarot: "The Tower" },
  "Tzaddi":  { letter: "צ", value: 90,  meaning: "Fish-hook", element: "Aquarius",    tarot: "The Emperor" },
  "Qoph":    { letter: "ק", value: 100, meaning: "Back of Head", element: "Pisces",   tarot: "The Moon" },
  "Resh":    { letter: "ר", value: 200, meaning: "Head",      element: "Sun",         tarot: "The Sun" },
  "Shin":    { letter: "ש", value: 300, meaning: "Tooth",     element: "Fire",        tarot: "The Aeon" },
  "Tau":     { letter: "ת", value: 400, meaning: "Cross",     element: "Saturn",      tarot: "The Universe" }
};

export const SEPHIROTH_DATA = {
  "Kether":   { number: 1,  meaning: "Crown",                    color: "#FFFFFF", planet: "Primum Mobile",  godName: "Eheieh",         archangel: "Metatron" },
  "Chokmah":  { number: 2,  meaning: "Wisdom",                   color: "#C0C0C0", planet: "Zodiac/Neptune", godName: "Yah",            archangel: "Ratziel" },
  "Binah":    { number: 3,  meaning: "Understanding",             color: "#1a1a2e", planet: "Saturn",         godName: "YHVH Elohim",   archangel: "Tzaphkiel" },
  "Chesed":   { number: 4,  meaning: "Mercy",                     color: "#1e3a5f", planet: "Jupiter",        godName: "El",             archangel: "Tzadkiel" },
  "Geburah":  { number: 5,  meaning: "Severity",                  color: "#8B0000", planet: "Mars",           godName: "Elohim Gibor",  archangel: "Kamael" },
  "Tiphareth": { number: 6, meaning: "Beauty",                    color: "#DAA520", planet: "Sol",            godName: "YHVH Eloah ve-Daath", archangel: "Raphael" },
  "Netzach":  { number: 7,  meaning: "Victory",                   color: "#228B22", planet: "Venus",          godName: "YHVH Tzabaoth", archangel: "Haniel" },
  "Hod":      { number: 8,  meaning: "Splendor",                  color: "#FF8C00", planet: "Mercury",        godName: "Elohim Tzabaoth", archangel: "Michael" },
  "Yesod":    { number: 9,  meaning: "Foundation",                color: "#9370DB", planet: "Luna",           godName: "Shaddai El Chai", archangel: "Gabriel" },
  "Malkuth":  { number: 10, meaning: "Kingdom",                   color: "#8B4513", planet: "Terra",          godName: "Adonai ha-Aretz", archangel: "Sandalphon" },
  "Daath":    { number: 0,  meaning: "Knowledge (The Abyss)",     color: "#2a0a2a", planet: "Pluto",          godName: "—",              archangel: "—" },
  "Ain":      { number: 0,  meaning: "Nothing",                   color: "#000000", planet: "—",              godName: "—",              archangel: "—" },
  "Ain Soph": { number: 0,  meaning: "The Boundless",             color: "#000000", planet: "—",              godName: "—",              archangel: "—" },
  "Ain Soph Aur": { number: 0, meaning: "Limitless Light",        color: "#0a0a0a", planet: "—",              godName: "—",              archangel: "—" },
  "Kether-Binah":     { number: 0, meaning: "Path: Kether to Binah",     color: "#808080", planet: "Mercury", godName: "—", archangel: "—" },
  "Kether-Tiphareth": { number: 0, meaning: "Path: Kether to Tiphareth", color: "#9370DB", planet: "Moon",    godName: "—", archangel: "—" },
  "Chokmah-Binah":    { number: 0, meaning: "Path: Chokmah to Binah",    color: "#228B22", planet: "Venus",   godName: "—", archangel: "—" },
  "Chokmah-Tiphareth": { number: 0, meaning: "Path: Chokmah to Tiphareth", color: "#8B0000", planet: "Aries", godName: "—", archangel: "—" },
  "Chokmah-Chesed":   { number: 0, meaning: "Path: Chokmah to Chesed",   color: "#8B4513", planet: "Taurus",  godName: "—", archangel: "—" },
  "Binah-Tiphareth":  { number: 0, meaning: "Path: Binah to Tiphareth",  color: "#C0C0C0", planet: "Gemini",  godName: "—", archangel: "—" },
  "Binah-Geburah":    { number: 0, meaning: "Path: Binah to Geburah",    color: "#FF8C00", planet: "Cancer",  godName: "—", archangel: "—" },
  "Chesed-Geburah":   { number: 0, meaning: "Path: Chesed to Geburah",   color: "#DAA520", planet: "Leo",     godName: "—", archangel: "—" },
  "Chesed-Tiphareth": { number: 0, meaning: "Path: Chesed to Tiphareth", color: "#8B4513", planet: "Virgo",   godName: "—", archangel: "—" },
  "Chesed-Netzach":   { number: 0, meaning: "Path: Chesed to Netzach",   color: "#1e3a5f", planet: "Jupiter", godName: "—", archangel: "—" },
  "Geburah-Tiphareth": { number: 0, meaning: "Path: Geburah to Tiphareth", color: "#228B22", planet: "Libra", godName: "—", archangel: "—" },
  "Geburah-Hod":      { number: 0, meaning: "Path: Geburah to Hod",      color: "#1e3a5f", planet: "Water",  godName: "—", archangel: "—" },
  "Tiphareth-Netzach": { number: 0, meaning: "Path: Tiphareth to Netzach", color: "#1e3a5f", planet: "Scorpio", godName: "—", archangel: "—" },
  "Tiphareth-Yesod":  { number: 0, meaning: "Path: Tiphareth to Yesod",  color: "#1e3a5f", planet: "Sagittarius", godName: "—", archangel: "—" },
  "Tiphareth-Hod":    { number: 0, meaning: "Path: Tiphareth to Hod",    color: "#8B4513", planet: "Capricorn", godName: "—", archangel: "—" },
  "Netzach-Hod":      { number: 0, meaning: "Path: Netzach to Hod",      color: "#8B0000", planet: "Mars",   godName: "—", archangel: "—" },
  "Netzach-Yesod":    { number: 0, meaning: "Path: Netzach to Yesod",    color: "#C0C0C0", planet: "Aquarius", godName: "—", archangel: "—" },
  "Netzach-Malkuth":  { number: 0, meaning: "Path: Netzach to Malkuth",  color: "#9370DB", planet: "Pisces", godName: "—", archangel: "—" },
  "Hod-Yesod":        { number: 0, meaning: "Path: Hod to Yesod",        color: "#DAA520", planet: "Sun",    godName: "—", archangel: "—" },
  "Hod-Malkuth":      { number: 0, meaning: "Path: Hod to Malkuth",      color: "#8B0000", planet: "Fire",   godName: "—", archangel: "—" },
  "Yesod-Malkuth":    { number: 0, meaning: "Path: Yesod to Malkuth",    color: "#1a1a2e", planet: "Saturn", godName: "—", archangel: "—" },
  "Kether-Malkuth":   { number: 0, meaning: "Union of Crown and Kingdom", color: "#FFFFFF", planet: "All",    godName: "YHVH + ADNY",   archangel: "—" },
};

export const ELEMENT_SYMBOLS = {
  "Fire":   "🜂",
  "Water":  "🜄",
  "Air":    "🜁",
  "Earth":  "🜃",
  "Spirit": "☉",
  "Void":   "∅",
  "Light":  "☆",
};

export const formatChapterNumber = (num) => {
  if (num === -2) return "?";
  if (num === -1) return "!";
  return String(num);
};

export const getSephiraColor = (sephiraName) => {
  // Try direct match first
  if (SEPHIROTH_DATA[sephiraName]) {
    return SEPHIROTH_DATA[sephiraName].color;
  }
  // Default
  return '#dc2626';
};

export const getSephiraInfo = (sephiraName) => {
  if (SEPHIROTH_DATA[sephiraName]) {
    const s = SEPHIROTH_DATA[sephiraName];
    return {
      name: sephiraName,
      number: s.number,
      meaning: s.meaning,
      color: s.color,
      planet: s.planet,
      godName: s.godName,
      archangel: s.archangel,
    };
  }
  return {
    name: sephiraName,
    meaning: sephiraName,
    color: '#dc2626',
    planet: '—',
    godName: '—',
    archangel: '—',
  };
};
