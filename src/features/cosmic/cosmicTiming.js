import { useEffect, useMemo, useState } from 'react';

export const PLANETS = {
  Saturn:  { symbol: '♄', color: '#6b7280', colorLight: '#9ca3af', element: 'Earth/Lead', frequency: 147.85 },
  Jupiter: { symbol: '♃', color: '#6366f1', colorLight: '#818cf8', element: 'Air/Tin', frequency: 183.58 },
  Mars:    { symbol: '♂', color: '#dc2626', colorLight: '#f87171', element: 'Fire/Iron', frequency: 144.72 },
  Sol:     { symbol: '☉', color: '#eab308', colorLight: '#fbbf24', element: 'Fire/Gold', frequency: 126.22 },
  Venus:   { symbol: '♀', color: '#10b981', colorLight: '#34d399', element: 'Earth/Copper', frequency: 221.23 },
  Mercury: { symbol: '☿', color: '#a855f7', colorLight: '#c084fc', element: 'Air/Mercury', frequency: 141.27 },
  Luna:    { symbol: '☽', color: '#94a3b8', colorLight: '#cbd5e1', element: 'Water/Silver', frequency: 210.42 },
};

export const CHALDEAN_ORDER = ['Saturn', 'Jupiter', 'Mars', 'Sol', 'Venus', 'Mercury', 'Luna'];
export const DAY_RULERS = { 0: 'Sol', 1: 'Luna', 2: 'Mars', 3: 'Mercury', 4: 'Jupiter', 5: 'Venus', 6: 'Saturn' };

export const MOON_PHASES = [
  { name: 'New Moon', emoji: '🌑', waxing: true, index: 0 },
  { name: 'Waxing Crescent', emoji: '🌒', waxing: true, index: 1 },
  { name: 'First Quarter', emoji: '🌓', waxing: true, index: 2 },
  { name: 'Waxing Gibbous', emoji: '🌔', waxing: true, index: 3 },
  { name: 'Full Moon', emoji: '🌕', waxing: false, index: 4 },
  { name: 'Waning Gibbous', emoji: '🌖', waxing: false, index: 5 },
  { name: 'Last Quarter', emoji: '🌗', waxing: false, index: 6 },
  { name: 'Waning Crescent', emoji: '🌘', waxing: false, index: 7 },
];

export function calculatePlanetaryTime(now) {
  const dayRuler = DAY_RULERS[now.getDay()];
  const dayStart = new Date(now);
  dayStart.setHours(6, 0, 0, 0);
  const hoursSinceSunrise = (now - dayStart) / 3600000;
  const planetaryHourIndex = Math.floor(((hoursSinceSunrise % 24) + 24) % 24);
  const rulerIdx = CHALDEAN_ORDER.indexOf(dayRuler);
  const currentPlanet = CHALDEAN_ORDER[(rulerIdx + planetaryHourIndex) % 7];
  const planetData = PLANETS[currentPlanet];
  const isNight = now.getHours() < 6 || now.getHours() >= 18;

  return {
    planet: currentPlanet,
    ...planetData,
    dayRuler,
    hourIndex: planetaryHourIndex,
    isNight,
    timeOfDay: now.getHours() < 6 ? 'deep night' : now.getHours() < 10 ? 'morning' :
               now.getHours() < 14 ? 'midday' : now.getHours() < 18 ? 'afternoon' :
               now.getHours() < 22 ? 'evening' : 'deep night',
  };
}

export function usePlanetaryTime() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const calc = () => setInfo(calculatePlanetaryTime(new Date()));
    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, []);

  return info;
}

export function calculateLunarPhase(now) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  // Conway's lunar phase approximation, preserved from the original app.
  let r = year % 100;
  r %= 19;
  if (r > 9) r -= 19;
  r = ((r * 11) % 30) + month + day;
  if (month < 3) r += 2;
  r -= (year < 2000) ? 4 : 8.3;
  r = Math.floor(((r % 30) + 30) % 30);
  const phaseIdx = Math.floor(r / 3.75) % 8;
  return MOON_PHASES[phaseIdx];
}

export function useLunarPhase() {
  return useMemo(() => calculateLunarPhase(new Date()), []);
}
