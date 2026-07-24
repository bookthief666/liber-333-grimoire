import { readFile, writeFile } from 'node:fs/promises';

async function replaceExactlyOnce(path, target, replacement) {
  const source = await readFile(path, 'utf8');
  const occurrences = source.split(target).length - 1;
  if (occurrences !== 1) throw new Error(`${path}: expected one target, found ${occurrences}.`);
  await writeFile(path, source.replace(target, replacement));
}

await replaceExactlyOnce(
  new URL('../src/ProductShell.jsx', import.meta.url),
  '          <SegmentedControl label="Motion" value={settings.motion} onChange={(motion) => onPatch({ motion })}',
  '          <SegmentedControl label="Motion" value={settings.motionExplicit ? settings.motion : settings.effectiveMotion} onChange={(motion) => onPatch({ motion })}',
);

await replaceExactlyOnce(
  new URL('../src/features/settings/experienceSettings.js', import.meta.url),
  `    const createGain = function controlledCreateGain(...args) {\n      contexts.add(this);\n      return originalCreateGain.apply(this, args);\n    };`,
  `    const createGain = function controlledCreateGain(...args) {\n      contexts.add(this);\n      const node = originalCreateGain.apply(this, args);\n      if (!getSettings().sound && this?.state !== 'closed') {\n        queueMicrotask(() => this?.suspend?.().catch?.(() => {}));\n      }\n      return node;\n    };`,
);
