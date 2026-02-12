// /src/api.js — Oracle API helper
// All AI calls go through /api/oracle (Vercel serverless function)
// instead of calling Anthropic/Gemini directly from the browser.

export async function fetchOracleInterpretation({ prompt, systemPrompt }) {
  try {
    const response = await fetch('/api/oracle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemPrompt })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(err.error || err.details || `API returned ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (e) {
    console.error('Oracle fetch error:', e);
    throw e;
  }
}

