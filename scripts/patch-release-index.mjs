import fs from 'node:fs';

const path = 'index.html';
let html = fs.readFileSync(path, 'utf8');

const svgIcon = '    <link rel="icon" href="/icons/liber-333-icon.svg" type="image/svg+xml" />';
const pngIcon = '    <link rel="icon" href="/icons/liber-333-icon-192.png" type="image/png" sizes="192x192" />';
const appleIcon = '    <link rel="apple-touch-icon" href="/icons/liber-333-icon-192.png" />';

if (!html.includes(appleIcon)) {
  if (!html.includes(svgIcon)) {
    throw new Error('Could not find the SVG icon link in index.html');
  }
  html = html.replace(svgIcon, [svgIcon, pngIcon, appleIcon].join('\n'));
  fs.writeFileSync(path, html);
  console.log('Added raster favicon and Apple touch icon metadata.');
} else {
  console.log('Release icon metadata is already current.');
}
