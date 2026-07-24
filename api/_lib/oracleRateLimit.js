import { createHash } from 'node:crypto';

export const DEFAULT_ORACLE_RATE_LIMITS = Object.freeze({
  shortMax: 8,
  shortSeconds: 10 * 60,
  dailyMax: 40,
  dailySeconds: 24 * 60 * 60,
});

const RATE_LIMIT_SCRIPT = "local current=redis.call('INCR',KEYS[1]); if current==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]); end; local ttl=redis.call('TTL',KEYS[1]); return {current,ttl}";
const defaultMemoryStore = new Map();

function parsePositiveInteger(value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(String(value).trim().toLowerCase());
}

function readHeader(headers, name) {
  if (!headers) return '';
  const direct = headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];
  if (Array.isArray(direct)) return direct[0] || '';
  return typeof direct === 'string' ? direct : '';
}

export function isOraclePublicEnabled(env = process.env) {
  const value = env.ORACLE_PUBLIC_ENABLED;
  if (value === undefined || value === null || value === '') return true;
  return !['0', 'false', 'off', 'disabled', 'no'].includes(String(value).trim().toLowerCase());
}

export function getOracleRateLimitConfig(env = process.env) {
  return {
    shortMax: parsePositiveInteger(env.ORACLE_RATE_LIMIT_SHORT_MAX, DEFAULT_ORACLE_RATE_LIMITS.shortMax, { max: 1000 }),
    shortSeconds: parsePositiveInteger(env.ORACLE_RATE_LIMIT_SHORT_SECONDS, DEFAULT_ORACLE_RATE_LIMITS.shortSeconds, { min: 10, max: 86400 }),
    dailyMax: parsePositiveInteger(env.ORACLE_RATE_LIMIT_DAILY_MAX, DEFAULT_ORACLE_RATE_LIMITS.dailyMax, { max: 10000 }),
    dailySeconds: parsePositiveInteger(env.ORACLE_RATE_LIMIT_DAILY_SECONDS, DEFAULT_ORACLE_RATE_LIMITS.dailySeconds, { min: 60, max: 604800 }),
    requireDurable: parseBoolean(env.ORACLE_REQUIRE_DURABLE_RATE_LIMIT, false),
    redisUrl: typeof env.UPSTASH_REDIS_REST_URL === 'string' ? env.UPSTASH_REDIS_REST_URL.replace(/\/+$/, '') : '',
    redisToken: typeof env.UPSTASH_REDIS_REST_TOKEN === 'string' ? env.UPSTASH_REDIS_REST_TOKEN : '',
    salt: typeof env.ORACLE_RATE_LIMIT_SALT === 'string' ? env.ORACLE_RATE_LIMIT_SALT : '',
  };
}

export function getClientIp(req) {
  const headers = req?.headers || {};
  const forwarded =
    readHeader(headers, 'x-vercel-forwarded-for') ||
    readHeader(headers, 'x-forwarded-for') ||
    readHeader(headers, 'x-real-ip');

  const first = forwarded.split(',')[0]?.trim();
  if (first) return first;
  return req?.socket?.remoteAddress || req?.connection?.remoteAddress || 'unknown';
}

export function hashClientIdentifier(identifier, salt = '') {
  return createHash('sha256')
    .update(`${salt}:${identifier}`)
    .digest('hex')
    .slice(0, 32);
}

function cleanupMemoryStore(store, now) {
  if (store.size < 5000) return;
  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

function incrementMemoryBucket(store, key, windowSeconds, now) {
  const existing = store.get(key);
  const bucket = !existing || existing.resetAt <= now
    ? { count: 0, resetAt: now + windowSeconds * 1000 }
    : existing;

  bucket.count += 1;
  store.set(key, bucket);

  return {
    count: bucket.count,
    ttl: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

function buildDecision({ short, daily, config, mode, degraded = false, now }) {
  const shortExceeded = short.count > config.shortMax;
  const dailyExceeded = daily.count > config.dailyMax;
  const exceeded = shortExceeded ? short : dailyExceeded ? daily : null;

  return {
    allowed: !exceeded,
    status: exceeded ? 429 : 200,
    code: exceeded ? 'oracle_rate_limited' : 'ok',
    mode,
    degraded,
    retryAfter: exceeded ? exceeded.ttl : 0,
    short: {
      limit: config.shortMax,
      remaining: Math.max(0, config.shortMax - short.count),
      resetAt: now + short.ttl * 1000,
      windowSeconds: config.shortSeconds,
    },
    daily: {
      limit: config.dailyMax,
      remaining: Math.max(0, config.dailyMax - daily.count),
      resetAt: now + daily.ttl * 1000,
      windowSeconds: config.dailySeconds,
    },
  };
}

function checkMemoryLimit({ clientHash, config, now, memoryStore }) {
  cleanupMemoryStore(memoryStore, now);
  const short = incrementMemoryBucket(memoryStore, `short:${clientHash}`, config.shortSeconds, now);
  const daily = incrementMemoryBucket(memoryStore, `daily:${clientHash}`, config.dailySeconds, now);
  return buildDecision({ short, daily, config, mode: 'memory', degraded: true, now });
}

async function checkUpstashLimit({ clientHash, config, now, fetchImpl }) {
  const body = [
    ['EVAL', RATE_LIMIT_SCRIPT, 1, `liber333:oracle:short:${clientHash}`, config.shortSeconds],
    ['EVAL', RATE_LIMIT_SCRIPT, 1, `liber333:oracle:daily:${clientHash}`, config.dailySeconds],
  ];

  const response = await fetchImpl(`${config.redisUrl}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.redisToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Rate-limit store returned HTTP ${response.status}.`);
  }

  const result = await response.json();
  if (!Array.isArray(result) || result.length !== 2) {
    throw new Error('Rate-limit store returned an invalid pipeline response.');
  }

  const parseBucket = (entry) => {
    if (entry?.error) throw new Error(entry.error);
    const [count, ttl] = Array.isArray(entry?.result) ? entry.result : [];
    if (!Number.isFinite(Number(count)) || !Number.isFinite(Number(ttl))) {
      throw new Error('Rate-limit store returned an invalid counter result.');
    }
    return { count: Number(count), ttl: Math.max(1, Number(ttl)) };
  };

  return buildDecision({
    short: parseBucket(result[0]),
    daily: parseBucket(result[1]),
    config,
    mode: 'upstash',
    now,
  });
}

export async function checkOracleAccess({
  req,
  env = process.env,
  fetchImpl = globalThis.fetch,
  now = Date.now(),
  memoryStore = defaultMemoryStore,
} = {}) {
  if (!isOraclePublicEnabled(env)) {
    return {
      allowed: false,
      status: 503,
      code: 'oracle_disabled',
      mode: 'disabled',
      degraded: false,
      retryAfter: 0,
      short: null,
      daily: null,
    };
  }

  const config = getOracleRateLimitConfig(env);
  const clientIp = getClientIp(req);
  const clientHash = hashClientIdentifier(clientIp, config.salt);
  const durableConfigured = Boolean(config.redisUrl && config.redisToken);

  if (durableConfigured) {
    try {
      return await checkUpstashLimit({ clientHash, config, now, fetchImpl });
    } catch (error) {
      if (config.requireDurable) {
        return {
          allowed: false,
          status: 503,
          code: 'oracle_rate_limit_unavailable',
          mode: 'unavailable',
          degraded: false,
          retryAfter: 60,
          short: null,
          daily: null,
          internalError: error.message,
        };
      }

      const fallback = checkMemoryLimit({ clientHash, config, now, memoryStore });
      return { ...fallback, internalError: error.message };
    }
  }

  if (config.requireDurable) {
    return {
      allowed: false,
      status: 503,
      code: 'oracle_rate_limit_unavailable',
      mode: 'unavailable',
      degraded: false,
      retryAfter: 60,
      short: null,
      daily: null,
      internalError: 'Durable rate limiting is required but Upstash credentials are missing.',
    };
  }

  return checkMemoryLimit({ clientHash, config, now, memoryStore });
}

export function applyOracleAccessHeaders(res, access) {
  res.setHeader('X-Oracle-RateLimit-Mode', access.mode);
  if (access.degraded) res.setHeader('X-Oracle-RateLimit-Degraded', 'true');

  if (access.short) {
    res.setHeader('X-RateLimit-Limit', String(access.short.limit));
    res.setHeader('X-RateLimit-Remaining', String(access.short.remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(access.short.resetAt / 1000)));
    res.setHeader('X-RateLimit-Daily-Limit', String(access.daily.limit));
    res.setHeader('X-RateLimit-Daily-Remaining', String(access.daily.remaining));
    res.setHeader('X-RateLimit-Daily-Reset', String(Math.ceil(access.daily.resetAt / 1000)));
  }

  if (access.retryAfter > 0) res.setHeader('Retry-After', String(access.retryAfter));
}
