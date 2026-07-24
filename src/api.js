// /src/api.js — Oracle API helper
// Provider calls go through /api/oracle so credentials and prompt construction
// remain on the server rather than in the browser request body.

// ── Buffered request (single response) ──────────────────────────────
export async function fetchOracleInterpretation({ request, signal }) {
  try {
    const response = await fetch('/api/oracle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, stream: false }),
      signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(err.error || err.details || `API returned ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    console.error('Oracle fetch error:', error);
    throw error;
  }
}

// ── Streaming request (Server-Sent Events) ──────────────────────────
// Calls onToken(textChunk) as the Oracle speaks and onThinking(active)
// when the configured provider enters or leaves its private reasoning.
// Falls back to the buffered endpoint if the browser/runtime cannot read
// a streaming response body.
export async function streamOracleInterpretation({
  request,
  signal,
  onToken,
  onThinking,
}) {
  let response;
  try {
    response = await fetch('/api/oracle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, stream: true }),
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    return fetchOracleInterpretation({ request, signal });
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error || err.details || `API returned ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/event-stream') || !response.body) {
    const data = await response.json().catch(() => null);
    const text = data?.text || 'The Abyss returns silence.';
    if (onToken) onToken(text);
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  const handleEvent = (block) => {
    const lines = block.split('\n');
    let event = 'message';
    let dataStr = '';
    for (const line of lines) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
    }
    if (!dataStr) return;

    let payload;
    try { payload = JSON.parse(dataStr); } catch { return; }

    if (event === 'token' && payload.text) {
      full += payload.text;
      if (onToken) onToken(payload.text);
    } else if (event === 'thinking') {
      if (onThinking) onThinking(!!payload.active);
    } else if (event === 'error') {
      throw new Error(payload.error || 'Oracle stream error');
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() || '';
    for (const block of blocks) handleEvent(block);
  }
  if (buffer.trim()) handleEvent(buffer);

  return full || 'The Abyss returns silence.';
}
