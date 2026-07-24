import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyOracleAccessHeaders,
  checkOracleAccess,
  getClientIp,
  getOracleRateLimitConfig,
  hashClientIdentifier,
  isOraclePublicEnabled,
} from '../api/_lib/oracleRateLimit.js';

const requestFrom = (ip) => ({
  headers: { 'x-vercel-forwarded-for': ip },
  socket: { remoteAddress: '127.0.0.1' },
});

test('the emergency Oracle switch defaults on and accepts explicit off values', () => {
  assert.equal(isOraclePublicEnabled({}), true);
  assert.equal(isOraclePublicEnabled({ ORACLE_PUBLIC_ENABLED: 'true' }), true);
  assert.equal(isOraclePublicEnabled({ ORACLE_PUBLIC_ENABLED: 'false' }), false);
  assert.equal(isOraclePublicEnabled({ ORACLE_PUBLIC_ENABLED: '0' }), false);
  assert.equal(isOraclePublicEnabled({ ORACLE_PUBLIC_ENABLED: 'off' }), false);
});

test('Vercel forwarded IP headers take precedence and the first address is used', () => {
  assert.equal(getClientIp({
    headers: {
      'x-vercel-forwarded-for': '203.0.113.10, 198.51.100.2',
      'x-forwarded-for': '192.0.2.5',
      'x-real-ip': '192.0.2.6',
    },
  }), '203.0.113.10');

  assert.equal(getClientIp({ headers: {}, socket: { remoteAddress: '127.0.0.1' } }), '127.0.0.1');
});

test('client identifiers are stable hashes rather than raw IP addresses', () => {
  const first = hashClientIdentifier('203.0.113.10', 'test-salt');
  const second = hashClientIdentifier('203.0.113.10', 'test-salt');
  assert.equal(first, second);
  assert.equal(first.length, 32);
  assert.doesNotMatch(first, /203\.0\.113\.10/);
});

test('configuration is bounded and uses documented defaults', () => {
  const config = getOracleRateLimitConfig({
    ORACLE_RATE_LIMIT_SHORT_MAX: '0',
    ORACLE_RATE_LIMIT_SHORT_SECONDS: '2',
    ORACLE_RATE_LIMIT_DAILY_MAX: '999999',
    ORACLE_RATE_LIMIT_DAILY_SECONDS: '9999999',
  });

  assert.equal(config.shortMax, 1);
  assert.equal(config.shortSeconds, 10);
  assert.equal(config.dailyMax, 10000);
  assert.equal(config.dailySeconds, 604800);
});

test('memory fallback enforces the short window and resets after expiry', async () => {
  const env = {
    ORACLE_RATE_LIMIT_SHORT_MAX: '2',
    ORACLE_RATE_LIMIT_SHORT_SECONDS: '60',
    ORACLE_RATE_LIMIT_DAILY_MAX: '10',
    ORACLE_RATE_LIMIT_DAILY_SECONDS: '3600',
  };
  const memoryStore = new Map();
  const req = requestFrom('203.0.113.10');
  const now = 1_000_000;

  const first = await checkOracleAccess({ req, env, now, memoryStore });
  const second = await checkOracleAccess({ req, env, now: now + 1000, memoryStore });
  const third = await checkOracleAccess({ req, env, now: now + 2000, memoryStore });
  const afterReset = await checkOracleAccess({ req, env, now: now + 61_000, memoryStore });

  assert.equal(first.allowed, true);
  assert.equal(first.mode, 'memory');
  assert.equal(first.degraded, true);
  assert.equal(first.short.remaining, 1);
  assert.equal(second.allowed, true);
  assert.equal(second.short.remaining, 0);
  assert.equal(third.allowed, false);
  assert.equal(third.status, 429);
  assert.equal(third.code, 'oracle_rate_limited');
  assert.ok(third.retryAfter > 0);
  assert.equal(afterReset.allowed, true);
  assert.equal(afterReset.short.remaining, 1);
});

test('the daily allowance applies independently from the short window', async () => {
  const env = {
    ORACLE_RATE_LIMIT_SHORT_MAX: '10',
    ORACLE_RATE_LIMIT_SHORT_SECONDS: '60',
    ORACLE_RATE_LIMIT_DAILY_MAX: '2',
    ORACLE_RATE_LIMIT_DAILY_SECONDS: '3600',
  };
  const memoryStore = new Map();
  const req = requestFrom('203.0.113.11');

  assert.equal((await checkOracleAccess({ req, env, now: 0, memoryStore })).allowed, true);
  assert.equal((await checkOracleAccess({ req, env, now: 61_000, memoryStore })).allowed, true);
  const denied = await checkOracleAccess({ req, env, now: 122_000, memoryStore });

  assert.equal(denied.allowed, false);
  assert.equal(denied.daily.remaining, 0);
  assert.ok(denied.retryAfter > 0);
});

test('configured Upstash REST counters are used without transmitting the raw IP', async () => {
  let capturedUrl;
  let capturedOptions;
  const fetchImpl = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return {
      ok: true,
      status: 200,
      json: async () => [
        { result: [1, 600] },
        { result: [1, 86400] },
      ],
    };
  };

  const access = await checkOracleAccess({
    req: requestFrom('203.0.113.12'),
    env: {
      UPSTASH_REDIS_REST_URL: 'https://example.upstash.io/',
      UPSTASH_REDIS_REST_TOKEN: 'secret-token',
      ORACLE_RATE_LIMIT_SALT: 'secret-salt',
    },
    fetchImpl,
    now: 5_000,
    memoryStore: new Map(),
  });

  assert.equal(access.allowed, true);
  assert.equal(access.mode, 'upstash');
  assert.equal(access.degraded, false);
  assert.equal(capturedUrl, 'https://example.upstash.io/pipeline');
  assert.equal(capturedOptions.headers.Authorization, 'Bearer secret-token');
  assert.doesNotMatch(capturedOptions.body, /203\.0\.113\.12/);
  assert.match(capturedOptions.body, /liber333:oracle:short:/);
  assert.match(capturedOptions.body, /liber333:oracle:daily:/);
});

test('durable mode fails closed when credentials are missing or the store fails', async () => {
  const missing = await checkOracleAccess({
    req: requestFrom('203.0.113.13'),
    env: { ORACLE_REQUIRE_DURABLE_RATE_LIMIT: 'true' },
    memoryStore: new Map(),
  });

  assert.equal(missing.allowed, false);
  assert.equal(missing.status, 503);
  assert.equal(missing.code, 'oracle_rate_limit_unavailable');

  const failed = await checkOracleAccess({
    req: requestFrom('203.0.113.13'),
    env: {
      ORACLE_REQUIRE_DURABLE_RATE_LIMIT: 'true',
      UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'secret-token',
    },
    fetchImpl: async () => ({ ok: false, status: 503 }),
    memoryStore: new Map(),
  });

  assert.equal(failed.allowed, false);
  assert.equal(failed.mode, 'unavailable');
});

test('a durable-store failure falls back to labeled memory limits when allowed', async () => {
  const access = await checkOracleAccess({
    req: requestFrom('203.0.113.14'),
    env: {
      UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'secret-token',
    },
    fetchImpl: async () => ({ ok: false, status: 500 }),
    memoryStore: new Map(),
  });

  assert.equal(access.allowed, true);
  assert.equal(access.mode, 'memory');
  assert.equal(access.degraded, true);
  assert.match(access.internalError, /HTTP 500/);
});

test('rate-limit response headers expose mode, remaining allowance, resets, and retry time', () => {
  const headers = new Map();
  const res = { setHeader: (name, value) => headers.set(name, value) };

  applyOracleAccessHeaders(res, {
    mode: 'upstash',
    degraded: false,
    retryAfter: 30,
    short: { limit: 8, remaining: 0, resetAt: 120_000 },
    daily: { limit: 40, remaining: 12, resetAt: 3_600_000 },
  });

  assert.equal(headers.get('X-Oracle-RateLimit-Mode'), 'upstash');
  assert.equal(headers.get('X-RateLimit-Limit'), '8');
  assert.equal(headers.get('X-RateLimit-Remaining'), '0');
  assert.equal(headers.get('X-RateLimit-Reset'), '120');
  assert.equal(headers.get('X-RateLimit-Daily-Remaining'), '12');
  assert.equal(headers.get('Retry-After'), '30');
});
