# Typed Oracle Request Boundary

## Purpose

The public Oracle endpoint no longer accepts browser-supplied provider prompts or system instructions. The browser submits a constrained Liber 333 reading request, and the server reconstructs the canonical prompt from repository-controlled data.

This closes the endpoint's former general-purpose proxy behavior while preserving the established Oracle voice and exact Single/Triad prompt wording.

## Request shape

```json
{
  "version": 1,
  "operation": "single",
  "question": "What must pass away?",
  "chapterNumbers": [65],
  "context": {
    "recentReadings": [],
    "recurrenceCount": 0,
    "totalReadings": 1,
    "planetary": {
      "planet": "Mars",
      "timeOfDay": "evening"
    },
    "lunar": {
      "name": "Full Moon"
    }
  },
  "stream": true
}
```

`operation` is limited to `single` or `triad`. Single requests require one canonical chapter number; Triad requests require three unique canonical chapter numbers.

## Server-controlled reconstruction

The server:

1. rejects legacy `prompt` and `systemPrompt` fields;
2. validates the request version and operation;
3. resolves chapter numbers against the canonical 94-record corpus;
4. recomputes English Ordinal Gematria from the question;
5. recomputes notable-number correspondences;
6. canonicalizes recent-reading chapter titles;
7. validates planetary and lunar values against repository data;
8. builds the existing Single or Triad Oracle prompt on the server;
9. forwards only the reconstructed prompt to the configured provider.

The client cannot replace chapter text, Qabalistic attributions, system instructions, or the Oracle's role.

## Request limits

- question: 2,000 characters;
- recent readings: 5;
- each recent question: 500 characters;
- recurrence count: 0–999;
- total reading count: 0–1,000,000;
- known planetary rulers and time-of-day values only;
- known lunar phase names only.

## Preserved behavior

- exact Single and Triad prompt text;
- streaming Server-Sent Events;
- request cancellation and retry;
- private provider reasoning state;
- Anthropic streaming and buffered paths;
- Gemini buffered fallback;
- existing chapter selection and journal context.

## Remaining public-launch controls

Typed requests sharply reduce abuse potential, but they do not replace infrastructure controls. Before broad promotion, configure:

- durable per-IP and per-device rate limiting;
- bot or challenge protection at the edge;
- a daily/monthly provider budget ceiling;
- request and provider-error telemetry without logging private question text;
- an emergency environment switch that disables public Oracle calls while leaving local tools available;
- a stable production origin in `PUBLIC_APP_ORIGIN`.

Do not rely on CORS as authentication. Non-browser clients can forge an Origin header.
