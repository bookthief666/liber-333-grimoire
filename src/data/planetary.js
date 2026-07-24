export const PLANETS = Object.freeze({
  Saturn:  Object.freeze({ symbol: '♄', color: '#6b7280', colorLight: '#9ca3af', element: 'Earth/Lead', frequency: 147.85 }),
  Jupiter: Object.freeze({ symbol: '♃', color: '#6366f1', colorLight: '#818cf8', element: 'Air/Tin', frequency: 183.58 }),
  Mars:    Object.freeze({ symbol: '♂', color: '#dc2626', colorLight: '#f87171', element: 'Fire/Iron', frequency: 144.72 }),
  Sol:     Object.freeze({ symbol: '☉', color: '#eab308', colorLight: '#fbbf24', element: 'Fire/Gold', frequency: 126.22 }),
  Venus:   Object.freeze({ symbol: '♀', color: '#10b981', colorLight: '#34d399', element: 'Earth/Copper', frequency: 221.23 }),
  Mercury: Object.freeze({ symbol: '☿', color: '#a855f7', colorLight: '#c084fc', element: 'Air/Mercury', frequency: 141.27 }),
  Luna:    Object.freeze({ symbol: '☽', color: '#94a3b8', colorLight: '#cbd5e1', element: 'Water/Silver', frequency: 210.42 }),
});

export const CHALDEAN_ORDER = Object.freeze(['Saturn', 'Jupiter', 'Mars', 'Sol', 'Venus', 'Mercury', 'Luna']);

export const DAY_RULERS = Object.freeze({
  0: 'Sol',
  1: 'Luna',
  2: 'Mars',
  3: 'Mercury',
  4: 'Jupiter',
  5: 'Venus',
  6: 'Saturn',
});

export const MOON_PHASES = Object.freeze([
  Object.freeze({ name: 'New Moon', emoji: '🌑', waxing: true, index: 0 }),
  Object.freeze({ name: 'Waxing Crescent', emoji: '🌒', waxing: true, index: 1 }),
  Object.freeze({ name: 'First Quarter', emoji: '🌓', waxing: true, index: 2 }),
  Object.freeze({ name: 'Waxing Gibbous', emoji: '🌔', waxing: true, index: 3 }),
  Object.freeze({ name: 'Full Moon', emoji: '🌕', waxing: false, index: 4 }),
  Object.freeze({ name: 'Waning Gibbous', emoji: '🌖', waxing: false, index: 5 }),
  Object.freeze({ name: 'Last Quarter', emoji: '🌗', waxing: false, index: 6 }),
  Object.freeze({ name: 'Waning Crescent', emoji: '🌘', waxing: false, index: 7 }),
]);
