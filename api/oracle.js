// /api/oracle.js — Vercel Serverless Function
// Proxies requests to Anthropic's Claude API server-side.
// This avoids CORS issues and keeps the API key hidden.

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Try Anthropic key first, fall back to Gemini
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  if (!ANTHROPIC_KEY && !GEMINI_KEY) {
    return res.status(500).json({
      error: 'No API key configured. Add ANTHROPIC_API_KEY or GEMINI_API_KEY in Vercel Dashboard → Settings → Environment Variables.'
    });
  }

  try {
    const { prompt, systemPrompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt in request body' });
    }

    let resultText = '';

    if (ANTHROPIC_KEY) {
      // ---- ANTHROPIC / CLAUDE ----
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: systemPrompt || "You are the Oracle of the Abyss, a profound interpreter of Aleister Crowley's Liber 333 (The Book of Lies). Speak with authority, mystical depth, and genuine insight. Connect the chapter's symbolism to the seeker's question with Thelemic wisdom.",
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Anthropic API error:', response.status, errText);
        return res.status(response.status).json({ error: `Anthropic API ${response.status}`, details: errText });
      }

      const data = await response.json();
      resultText = data.content?.[0]?.text || 'The Abyss is silent.';

    } else if (GEMINI_KEY) {
      // ---- GOOGLE GEMINI FALLBACK ----
      const modelName = 'gemini-2.5-flash-preview-05-20';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_KEY}`;

      const fullPrompt = systemPrompt
        ? `${systemPrompt}\n\n${prompt}`
        : `You are the Oracle of the Abyss, a profound interpreter of Aleister Crowley's Liber 333 (The Book of Lies). Speak with authority, mystical depth, and genuine insight.\n\n${prompt}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Gemini API error:', response.status, errText);
        return res.status(response.status).json({ error: `Gemini API ${response.status}`, details: errText });
      }

      const data = await response.json();
      resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'The Abyss is silent.';
    }

    return res.status(200).json({ text: resultText });

  } catch (e) {
    console.error('Server error:', e);
    return res.status(500).json({ error: e.message });
  }
}

