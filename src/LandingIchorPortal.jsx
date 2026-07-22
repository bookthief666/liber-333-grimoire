import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import IchorOrb from './IchorOrb.jsx';

const LANDING_TITLE = 'THE BOOK OF LIES';
const LEGACY_CLASS = 'liber-legacy-menu-sigil';
const HOST_CLASS = 'liber-ichor-host';

function normalizeText(value = '') {
  return value.replace(/\s+/g, ' ').trim().toUpperCase();
}

function locateLandingCenterpiece() {
  const heading = Array.from(document.querySelectorAll('h1')).find(
    (candidate) => normalizeText(candidate.textContent) === LANDING_TITLE,
  );
  if (!heading) return null;

  const landing = heading.parentElement;
  if (!landing) return null;

  const legacy = Array.from(landing.children).find(
    (child) =>
      child instanceof HTMLElement &&
      child.classList.contains('mb-6') &&
      child.classList.contains('relative') &&
      child.classList.contains('inline-flex'),
  );

  return legacy instanceof HTMLElement ? { landing, legacy } : null;
}

export default function LandingIchorPortal() {
  const [host, setHost] = useState(null);

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return undefined;

    let currentHost = null;
    let currentLegacy = null;

    const detach = () => {
      currentLegacy?.classList.remove(LEGACY_CLASS);
      currentHost?.remove();
      currentLegacy = null;
      currentHost = null;
      setHost(null);
    };

    const sync = () => {
      const target = locateLandingCenterpiece();
      if (!target) {
        if (currentHost || currentLegacy) detach();
        return;
      }

      if (target.legacy === currentLegacy && currentHost?.isConnected) return;

      detach();
      currentLegacy = target.legacy;
      currentLegacy.classList.add(LEGACY_CLASS);

      currentHost = document.createElement('div');
      currentHost.className = HOST_CLASS;
      currentLegacy.insertAdjacentElement('afterend', currentHost);
      setHost(currentHost);
    };

    const observer = new MutationObserver(sync);
    observer.observe(root, { childList: true, subtree: true });
    sync();

    return () => {
      observer.disconnect();
      detach();
    };
  }, []);

  return host ? createPortal(<IchorOrb />, host) : null;
}
