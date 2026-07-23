import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'index.html',
  'public/manifest.webmanifest',
  'public/privacy.html',
  'public/terms.html',
  'public/support.html',
  'public/legal.css',
  'public/offline.html',
  'public/sw.js',
  'public/icons/liber-333-icon.svg',
  'public/icons/liber-333-icon-192.png',
  'public/icons/liber-333-icon-512.png',
];

const failures = [];

for (const relativePath of requiredFiles) {
  try {
    await access(path.join(root, relativePath), constants.R_OK);
  } catch {
    failures.push(`Missing required release file: ${relativePath}`);
  }
}

const readText = async (relativePath) => readFile(path.join(root, relativePath), 'utf8');

const readPngDimensions = async (relativePath) => {
  const buffer = await readFile(path.join(root, relativePath));
  const signature = '89504e470d0a1a0a';
  if (buffer.length < 24 || buffer.subarray(0, 8).toString('hex') !== signature) {
    throw new Error('not a valid PNG file');
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
};

let manifest;
try {
  manifest = JSON.parse(await readText('public/manifest.webmanifest'));
} catch (error) {
  failures.push(`Manifest is not valid JSON: ${error.message}`);
}

if (manifest) {
  const requiredFields = ['id', 'name', 'short_name', 'start_url', 'scope', 'display', 'background_color', 'theme_color'];
  for (const field of requiredFields) {
    if (!manifest[field]) failures.push(`Manifest is missing required field: ${field}`);
  }

  if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
    failures.push('Manifest must define application icons.');
  }

  const requiredIcons = [
    { src: '/icons/liber-333-icon.svg', type: 'image/svg+xml', sizes: 'any' },
    { src: '/icons/liber-333-icon-192.png', type: 'image/png', sizes: '192x192' },
    { src: '/icons/liber-333-icon-512.png', type: 'image/png', sizes: '512x512' },
  ];

  for (const required of requiredIcons) {
    const match = manifest.icons?.find((icon) => icon.src === required.src);
    if (!match) {
      failures.push(`Manifest is missing icon: ${required.src}`);
      continue;
    }
    if (match.type !== required.type) failures.push(`${required.src} must use type ${required.type}.`);
    if (match.sizes !== required.sizes) failures.push(`${required.src} must declare sizes ${required.sizes}.`);
  }

  const maskable512 = manifest.icons?.find((icon) => icon.src === '/icons/liber-333-icon-512.png');
  if (!maskable512?.purpose?.split(/\s+/).includes('maskable')) {
    failures.push('The 512x512 icon must declare maskable purpose.');
  }
}

for (const [relativePath, expected] of [
  ['public/icons/liber-333-icon-192.png', 192],
  ['public/icons/liber-333-icon-512.png', 512],
]) {
  try {
    const dimensions = await readPngDimensions(relativePath);
    if (dimensions.width !== expected || dimensions.height !== expected) {
      failures.push(`${relativePath} must be exactly ${expected}x${expected}; found ${dimensions.width}x${dimensions.height}.`);
    }
  } catch (error) {
    failures.push(`${relativePath}: ${error.message}`);
  }
}

for (const page of ['privacy.html', 'terms.html', 'support.html']) {
  try {
    const html = await readText(path.join('public', page));
    if (!/<meta\s+name=["']viewport["']/i.test(html)) failures.push(`${page} is missing a viewport meta tag.`);
    if (!/<title>[^<]+<\/title>/i.test(html)) failures.push(`${page} is missing a page title.`);
    if (!/href=["']\/["']/.test(html)) failures.push(`${page} must link back to the application root.`);
    if (!/href=["']\/privacy\.html["']|Privacy Policy/i.test(html) && page !== 'privacy.html') {
      failures.push(`${page} must link to the privacy policy.`);
    }
  } catch {
    // Missing files are reported above.
  }
}

try {
  const indexHtml = await readText('index.html');
  if (!/rel=["']manifest["'][^>]+\/manifest\.webmanifest/i.test(indexHtml)) {
    failures.push('index.html must link to /manifest.webmanifest.');
  }
  if (!/rel=["']apple-touch-icon["'][^>]+liber-333-icon-192\.png/i.test(indexHtml)) {
    failures.push('index.html must link the 192x192 PNG as an Apple touch icon.');
  }
} catch {
  // Missing file reported above.
}

try {
  const serviceWorker = await readText('public/sw.js');
  for (const asset of [
    '/offline.html',
    '/privacy.html',
    '/terms.html',
    '/support.html',
    '/icons/liber-333-icon-192.png',
    '/icons/liber-333-icon-512.png',
  ]) {
    if (!serviceWorker.includes(asset)) failures.push(`Service worker shell is missing ${asset}.`);
  }
} catch {
  // Missing file reported above.
}

for (const relativePath of ['api/oracle.js', 'api/oracle-stream.js', 'api/gemini.js']) {
  try {
    const source = await readText(relativePath);
    if (/Access-Control-Allow-Origin['"\s:]+\*/i.test(source)) {
      failures.push(`${relativePath} exposes a wildcard CORS origin.`);
    }
  } catch {
    // Provider routes differ between deployments; validate only files that exist.
  }
}

try {
  const pkg = JSON.parse(await readText('package.json'));
  for (const script of ['test:unit', 'build', 'validate:release', 'check']) {
    if (!pkg.scripts?.[script]) failures.push(`package.json is missing required script: ${script}`);
  }
} catch (error) {
  failures.push(`package.json is not readable JSON: ${error.message}`);
}

if (failures.length) {
  console.error('\nRelease validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('\nRelease validation passed: policies, manifest, service worker, icons, and release scripts are present.');
}
