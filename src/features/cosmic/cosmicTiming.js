import { useEffect, useMemo, useState } from 'react';
import { CHALDEAN_ORDER, DAY_RULERS, MOON_PHASES, PLANETS } from '../../data/planetary.js';

export { CHALDEAN_ORDER, DAY_RULERS, MOON_PHASES, PLANETS } from '../../data/planetary.js';

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
