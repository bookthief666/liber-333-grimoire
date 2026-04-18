// /api/oracle.js — Vercel Serverless Function
// Proxies AI requests so the API key never touches the browser.

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, systemPrompt } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  // Try Anthropic first, fall back to Gemini
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (anthropicKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt || '',
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Anthropic API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.content
        ?.filter(b => b.type === 'text')
        .map(b => b.text)
        .join('\n') || 'The Abyss returns silence.';

      return res.status(200).json({ text });
    } catch (err) {
      console.error('Anthropic error:', err.message);
      // If Gemini key exists, fall through to try it
      if (!geminiKey) {
        return res.status(500).json({ error: err.message });
      }
    }
  }

  if (geminiKey) {
    try {
      const fullPrompt = systemPrompt
        ? `${systemPrompt}\n\n---\n\n${prompt}`
        : prompt;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: { maxOutputTokens: 1000 },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'The Abyss returns silence.';

      return res.status(200).json({ text });
    } catch (err) {
      console.error('Gemini error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(500).json({ error: 'No API key configured. Add ANTHROPIC_API_KEY or GEMINI_API_KEY in Vercel environment variables.' });
}
