import { createReadStream } from 'node:fs';
import { access, readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';

const root = path.resolve('dist');
const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
]);

await access(path.join(root, 'index.html'));

const resolveRequestPath = async (requestUrl) => {
  const url = new URL(requestUrl, 'http://127.0.0.1');
  const decoded = decodeURIComponent(url.pathname);
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const candidate = path.resolve(root, relative);

  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) {
    return null;
  }

  try {
    const info = await stat(candidate);
    if (info.isFile()) return candidate;
  } catch {
    // Fall through to the SPA shell for extensionless routes.
  }

  if (!path.extname(relative)) return path.join(root, 'index.html');
  return null;
};

const server = createServer(async (request, response) => {
  try {
    const filePath = await resolveRequestPath(request.url || '/');
    if (!filePath) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    const contentType = mimeTypes.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream';
    response.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    });
    createReadStream(filePath).pipe(response);
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(error instanceof Error ? error.message : 'Unknown error');
  }
});

await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});

const address = server.address();
if (!address || typeof address === 'string') throw new Error('Could not determine smoke-test server port.');
const origin = `http://127.0.0.1:${address.port}`;
const failures = [];

const expectResource = async (pathname, expectedType, requiredText) => {
  const response = await fetch(`${origin}${pathname}`, { redirect: 'error' });
  if (response.status !== 200) {
    failures.push(`${pathname} returned HTTP ${response.status}.`);
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith(expectedType)) {
    failures.push(`${pathname} returned ${contentType || 'no content type'} instead of ${expectedType}.`);
  }

  if (requiredText) {
    const body = await response.text();
    if (!body.includes(requiredText)) failures.push(`${pathname} is missing required text: ${requiredText}`);
    return body;
  }

  return response;
};

try {
  await expectResource('/', 'text/html', 'Liber CCCXXXIII');
  await expectResource('/privacy.html', 'text/html', 'Privacy Policy');
  await expectResource('/terms.html', 'text/html', 'Terms of Use');
  await expectResource('/support.html', 'text/html', 'Support');
  await expectResource('/offline.html', 'text/html', 'The Grimoire Is Offline');
  await expectResource('/sw.js', 'text/javascript', 'liber-333-shell-v2');
  await expectResource('/icons/liber-333-icon.svg', 'image/svg+xml');
  await expectResource('/icons/liber-333-icon-192.png', 'image/png');
  await expectResource('/icons/liber-333-icon-512.png', 'image/png');

  const manifestResponse = await expectResource('/manifest.webmanifest', 'application/manifest+json');
  if (manifestResponse) {
    const manifest = await manifestResponse.json();
    for (const icon of manifest.icons || []) {
      await expectResource(icon.src, icon.type === 'image/png' ? 'image/png' : 'image/svg+xml');
    }
    for (const shortcut of manifest.shortcuts || []) {
      const response = await fetch(`${origin}${shortcut.url}`, { redirect: 'error' });
      if (response.status !== 200) failures.push(`Manifest shortcut ${shortcut.url} returned HTTP ${response.status}.`);
    }
  }

  const builtIndex = await readFile(path.join(root, 'index.html'), 'utf8');
  if (!builtIndex.includes('/icons/liber-333-icon-192.png')) {
    failures.push('Built index.html is missing the raster application icon.');
  }
  if (!builtIndex.includes('rel="apple-touch-icon"')) {
    failures.push('Built index.html is missing the Apple touch icon.');
  }
} finally {
  await new Promise((resolve) => server.close(resolve));
}

if (failures.length) {
  console.error('\nBuilt release smoke test failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('\nBuilt release smoke test passed: shell, policies, offline page, manifest, shortcuts, service worker, and icons are reachable.');
}
