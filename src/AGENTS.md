# AGENTS.md — Liber 333 Digital Grimoire

## Project overview
A live digital oracle for Aleister Crowley's Liber 333 (The Book of Lies). Live at liber-333.vercel.app. Vite + React 18 + Tailwind CSS, deployed on Vercel.

## Architecture
- EVERYTHING is in `src/liber333.jsx` (~2,930 lines). Do NOT split into multiple files.
- `src/api.js` — fetchOracleInterpretation helper
- `src/main.jsx` — entry point
- `src/index.css` — Tailwind directives only
- `api/oracle.js` — Vercel serverless function
- `index.html` — root HTML with Google Fonts and CSS keyframes

## Commands
- Build: `npm run build`
- Dev: `npm run dev`

## Do
- Use Tailwind classes for all styling
- Use Cinzel/Cinzel Decorative for display text, JetBrains Mono for body
- Use the accentColor variable for dynamic theming
- Keep dark occult aesthetic: black bg, glass-morphism, generous negative space
- Run `npm run build` after changes

## Don't
- Do NOT split liber333.jsx into multiple files
- Do NOT add new npm dependencies
- Do NOT change the LIBER_333 chapter data array
- Do NOT change the Oracle system prompt
- Do NOT change the fetchOracleInterpretation pattern
- Do NOT use light backgrounds, pastel colors, or generic fonts
- Do NOT remove any existing features

