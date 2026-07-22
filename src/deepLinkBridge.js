const MODE_LABELS = {
  oracle: 'ORACLE',
  ritual: 'RITES',
  tree: 'TREE',
  gematria: 'GEMATRIA',
  grimoire: 'GRIMOIRE',
};

function normalizeText(value = '') {
  return value
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toUpperCase();
}

function findButton(label) {
  const target = normalizeText(label);
  return Array.from(document.querySelectorAll('button')).find((button) => {
    const text = normalizeText(button.textContent || '');
    return text === target || (target === 'GRIMOIRE' && text.startsWith('GRIMOIRE'));
  });
}

export function applyInitialDeepLink() {
  const url = new URL(window.location.href);
  const mode = url.searchParams.get('mode');
  const validMode = mode && MODE_LABELS[mode] ? mode : null;

  if (!validMode) return;

  window.setTimeout(() => {
    findButton(MODE_LABELS[validMode])?.click();
  }, 180);

  url.searchParams.delete('mode');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}
