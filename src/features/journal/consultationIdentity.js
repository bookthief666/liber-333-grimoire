const TRIAD_POSITIONS = new Set(['thesis', 'antithesis', 'synthesis']);
export const LEGACY_TRIAD_TOLERANCE_MS = 120_000;

function normalizeIdentityText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function explicitText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function entryTimestamp(entry) {
  const value = Date.parse(entry?.date);
  return Number.isNaN(value) ? null : value;
}

export function normalizeJournalSpreadType(value) {
  const normalized = String(value ?? '').trim().toLocaleLowerCase('en-US');
  const isTriad = normalized === 'spread'
    || normalized.includes('triad')
    || normalized.includes('three-card')
    || normalized.includes('three card')
    || (
      normalized.includes('thesis')
      && normalized.includes('antithesis')
      && normalized.includes('synthesis')
    );
  return isTriad ? 'triad' : 'single';
}

export function normalizeJournalSpreadPosition(value) {
  const normalized = String(value ?? '').trim().toLocaleLowerCase('en-US');
  if (normalized === 'single' || TRIAD_POSITIONS.has(normalized)) return normalized;
  return null;
}

export function getLegacyTriadSignature(entry) {
  return [
    normalizeIdentityText(entry?.question),
    normalizeIdentityText(entry?.gematria),
    normalizeIdentityText(entry?.planetary),
    normalizeIdentityText(entry?.lunar),
  ].join(':');
}

export function getJournalConsultationKey(entry) {
  const consultationId = explicitText(entry?.consultationId);
  if (consultationId) return `consultation:${consultationId}`;
  const legacyTriadFragmentId = entry?.legacyTriadFragment === true
    ? explicitText(entry?.legacyTriadFragmentId)
    : null;
  if (legacyTriadFragmentId) return `legacy-triad-fragment:${legacyTriadFragmentId}`;

  const id = explicitText(entry?.id);
  if (normalizeJournalSpreadType(entry?.spreadType) !== 'triad') {
    const timestamp = entryTimestamp(entry) ?? 0;
    return `entry:${id || `${normalizeIdentityText(entry?.question)}:${timestamp}`}`;
  }

  const timestamp = entryTimestamp(entry);
  return [
    'legacy-triad-row',
    getLegacyTriadSignature(entry),
    timestamp ?? 'unknown-time',
    id || 'unknown-entry',
  ].join(':');
}

export function assignJournalConsultationKeys(
  entries,
  {
    legacyToleranceMs = LEGACY_TRIAD_TOLERANCE_MS,
    respectLegacyFragmentIds = true,
  } = {},
) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const keys = [];
  let activeLegacyGroup = null;
  let legacyOrdinal = 0;

  safeEntries.forEach((entry, index) => {
    const consultationId = explicitText(entry?.consultationId);
    const legacyTriadFragmentId = respectLegacyFragmentIds
      && entry?.legacyTriadFragment === true
      ? explicitText(entry?.legacyTriadFragmentId)
      : null;
    if (!consultationId && legacyTriadFragmentId) {
      activeLegacyGroup = null;
      keys[index] = `legacy-triad-fragment:${legacyTriadFragmentId}`;
      return;
    }
    const isLegacyTriad = !consultationId
      && normalizeJournalSpreadType(entry?.spreadType) === 'triad';

    if (!isLegacyTriad) {
      activeLegacyGroup = null;
      keys[index] = getJournalConsultationKey(entry);
      return;
    }

    const signature = getLegacyTriadSignature(entry);
    const timestamp = entryTimestamp(entry);
    const canJoin = Boolean(
      activeLegacyGroup
      && activeLegacyGroup.signature === signature
      && activeLegacyGroup.count < 3
      && timestamp !== null
      && activeLegacyGroup.lastTimestamp !== null
      && Math.abs(timestamp - activeLegacyGroup.lastTimestamp) <= legacyToleranceMs
    );

    if (canJoin) {
      activeLegacyGroup.count += 1;
      activeLegacyGroup.lastTimestamp = timestamp;
      keys[index] = activeLegacyGroup.key;
      return;
    }

    legacyOrdinal += 1;
    const key = [
      'legacy-triad',
      signature,
      timestamp ?? 'unknown-time',
      legacyOrdinal,
    ].join(':');
    activeLegacyGroup = {
      key,
      signature,
      count: 1,
      lastTimestamp: timestamp,
    };
    keys[index] = key;
  });

  return keys;
}
