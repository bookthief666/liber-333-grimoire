# Liber 333 Digital Grimoire — Deployment Guide

## File Structure (what your repo should look like)

```
liber-333-grimoire/
├── api/
│   └── oracle.js          ← NEW: Serverless proxy for AI calls
├── src/
│   ├── main.jsx           ← Entry point (renders Liber333)
│   ├── api.js             ← NEW: Helper to call /api/oracle
│   └── liber333.jsx       ← Your main app (MODIFIED — see below)
├── index.html             ← Root HTML
├── package.json           ← Dependencies
├── vite.config.js         ← Vite + React + Tailwind config
├── vercel.json            ← Vercel routing config
└── README.md
```

## CRITICAL: What to change in liber333.jsx

Your app currently calls the AI API directly from the browser like this:

```js
// ❌ OLD CODE (broken in production — CORS + exposed key)
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'sk-ant-...',    // <-- exposed in browser!
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({ ... })
});
```

Replace ALL direct API calls with this pattern:

```js
// ✅ NEW CODE (goes through your serverless proxy)
import { fetchOracleInterpretation } from './api.js';

// Then wherever you call the AI:
const oracleText = await fetchOracleInterpretation({
  prompt: `Chapter ${chapter.chapter}: "${chapter.title}"\n\n${chapter.text}\n\nThe seeker asks: "${question}"\n\nInterpret this chapter...`,
  systemPrompt: "You are the Oracle of the Abyss..."
});
```

### Step-by-step changes to liber333.jsx:

1. **DELETE** any line like `const ANTHROPIC_KEY = "sk-ant-..."` or `const apiKey = "..."` 
   — the key now lives in Vercel's environment variables

2. **ADD** this import at the top:
   ```js
   import { fetchOracleInterpretation } from './api.js';
   ```

3. **FIND** the function that calls the AI (look for `fetch('https://api.anthropic.com` 
   or `fetch('https://generativelanguage.googleapis.com`).

4. **REPLACE** that entire fetch block with:
   ```js
   const oracleText = await fetchOracleInterpretation({
     prompt: yourPromptString,
     systemPrompt: yourSystemPrompt  // optional
   });
   // oracleText is now a string with the AI's response
   ```

## Setup: Vercel Environment Variables

1. Go to https://vercel.com → your project → **Settings** → **Environment Variables**
2. Add ONE of these (Anthropic preferred, Gemini as fallback):
   - `ANTHROPIC_API_KEY` = `sk-ant-api03-...` (your Anthropic key)
   - `GEMINI_API_KEY` = `AIza...` (your Google AI key)
3. Click **Save**
4. **Redeploy** the project (Deployments tab → three dots → Redeploy)

## Uploading to GitHub

Since you upload files directly on GitHub:

1. **Delete** these old root-level files (they'll be replaced):
   - `main.jsx` (moving to `src/main.jsx`)
   - `liber333.jsx` (moving to `src/liber333.jsx`)
   
2. **Create** these new files/folders by clicking "Add file → Create new file":
   - `api/oracle.js` (type `api/oracle.js` in the name field — GitHub creates the folder)
   - `src/main.jsx`
   - `src/api.js`
   - `src/liber333.jsx` (your modified version)

3. **Update** these existing files:
   - `index.html`
   - `package.json`
   - `vite.config.js`

4. **Create** new: `vercel.json`

## Why this fixes the "Failed to fetch" error

- **Before**: Browser → Google/Anthropic API (blocked by CORS in production)
- **After**: Browser → `/api/oracle` (your own domain, no CORS) → Vercel serverless function → Google/Anthropic API → back to browser

The API key never touches the browser. The serverless function runs on Vercel's servers.
