import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'public/manifest.webmanifest',
  'public/privacy.html',
  'public/terms.html',
  'public/support.html',
  'public/offline.html',
  'public/sw.js',
  'public/icons/liber-333-icon.svg',
];

const failures = [];
const warnings = [];

for (const relativePath of requiredFiles) {
  try {
    await access(path.join(root, relativePath), constants.R_OK);
  } catch {
    failures.push(`Missing required release file: ${relativePath}`);
  }
}

let manifest;
try {
  manifest = JSON.parse(await readFile(path.join(root, 'public/manifest.webmanifest'), 'utf8'));
} catch (error) {
  failures.push(`Manifest is not valid JSON: ${error.message}`);
}

if (manifest) {
  const requiredFields = ['id', 'name', 'short_name', 'start_url', 'scope', 'display', 'background_color', 'theme_color'];
  for (const field of requiredFields) {
    if (!manifest[field]) failures.push(`Manifest is missing required field: ${field}`);
  }

  if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
    failures.push('Manifest must define at least one application icon.');
  }

  const hasRaster192 = manifest.icons?.some((icon) => icon.type === 'image/png' && /(^|\s)192x192(\s|$)/.test(icon.sizes || ''));
  const hasRaster512 = manifest.icons?.some((icon) => icon.type === 'image/png' && /(^|\s)512x512(\s|$)/.test(icon.sizes || ''));
  if (!hasRaster192 || !hasRaster512) {
    warnings.push('Add production PNG icons at 192x192 and 512x512 before store submission and final PWA promotion.');
  }
}

for (const page of ['privacy.html', 'terms.html', 'support.html']) {
  try {
    const html = await readFile(path.join(root, 'public', page), 'utf8');
    if (!/<meta\s+name=["']viewport["']/i.test(html)) failures.push(`${page} is missing a viewport meta tag.`);
    if (!/<title>[^<]+<\/title>/i.test(html)) failures.push(`${page} is missing a page title.`);
    if (!/href=["']\/["']/.test(html)) failures.push(`${page} must link back to the application root.`);
  } catch {
    // Missing files are already reported above.
  }
}

try {
  const sourceFiles = [
    'api/oracle.js',
    'api/oracle-stream.js',
    'api/gemini.js',
  ];
  for (const relativePath of sourceFiles) {
    try {
      const source = await readFile(path.join(root, relativePath), 'utf8');
      if (/Access-Control-Allow-Origin['"\s:]+\*/i.test(source)) {
        failures.push(`${relativePath} exposes a wildcard CORS origin.`);
      }
    } catch {
      // Provider routes differ between deployments; validate only files that exist.
    }
  }
} catch (error) {
  warnings.push(`Could not complete endpoint policy scan: ${error.message}`);
}

if (warnings.length) {
  console.warn('\nRelease warnings:');
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (failures.length) {
  console.error('\nRelease validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('\nRelease validation passed.');
}
