# Cosmic Timing Extraction

This milestone moves the current planetary-hour and lunar-phase subsystem out of the single-file application while preserving its existing approximations and display records.

## Extracted module

`src/features/cosmic/cosmicTiming.js`

It contains:

- the seven planetary display and audio records;
- Chaldean planetary order;
- weekday rulers;
- eight lunar display records;
- `calculatePlanetaryTime(date)`;
- `calculateLunarPhase(date)`;
- `usePlanetaryTime()`;
- `useLunarPhase()`.

## Preserved behavior

- the planetary day begins at a fixed local 6:00 AM;
- planetary hours remain fixed 60-minute divisions;
- pre-dawn times wrap to hours 18 through 23 of the prior planetary day;
- night remains defined as before 6:00 AM or at/after 6:00 PM;
- time-of-day labels retain the existing boundaries;
- planetary information refreshes every 60 seconds;
- lunar phase is calculated once per component mount;
- Conway's existing lunar approximation is preserved exactly.

This extraction does not claim astronomical sunrise-based planetary hours or high-precision lunar ephemerides. It protects the application’s current behavior so a later accuracy upgrade can be deliberate, versioned, and separately reviewed.

## Regression command

`npm run test:cosmic`
