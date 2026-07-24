import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('../src/liber333.jsx', import.meta.url);
const source = await readFile(path, 'utf8');
const target = '    const duration = 7000;';
const replacement = '    const duration = window.__LIBER333_EXPERIENCE__?.ceremonyDuration?.(7000) ?? 7000;';

const occurrences = source.split(target).length - 1;
if (occurrences !== 1) {
  throw new Error(`Expected exactly one protected ritual-duration target, found ${occurrences}.`);
}

const updated = source.replace(target, replacement);
if (updated === source) throw new Error('The protected ritual-duration integration was not applied.');
await writeFile(path, updated);
