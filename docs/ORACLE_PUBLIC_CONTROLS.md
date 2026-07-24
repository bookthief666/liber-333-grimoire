# Oracle Public Access Controls

## Objective

The Oracle endpoint now combines three server-side boundaries:

1. a typed Liber 333 reading request rather than arbitrary provider prompts;
2. an emergency public-access switch;
3. short-window and daily per-client allowances.

These controls protect provider credits while leaving Tree, Rites, Gematria, source text, commentary, and the local Grimoire available when the public Oracle is disabled or temporarily limited.

## Production environment

Configure these variables in the Vercel project and redeploy after changing them.

```text
# Emergency access control
ORACLE_PUBLIC_ENABLED=true

# Public allowance
ORACLE_RATE_LIMIT_SHORT_MAX=8
ORACLE_RATE_LIMIT_SHORT_SECONDS=600
ORACLE_RATE_LIMIT_DAILY_MAX=40
ORACLE_RATE_LIMIT_DAILY_SECONDS=86400

# Secret salt used before a client identifier becomes a Redis key
ORACLE_RATE_LIMIT_SALT=<long-random-secret>

# Durable Upstash Redis REST connection
UPSTASH_REDIS_REST_URL=https://<database>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<rest-token>

# Recommended for the production deployment
ORACLE_REQUIRE_DURABLE_RATE_LIMIT=true
```

The numeric values above match the application defaults. They can be reduced for a controlled beta without changing code.

## Emergency switch

Set:

```text
ORACLE_PUBLIC_ENABLED=false
```

and redeploy to stop new public consultations. The endpoint returns a controlled temporary-unavailable response. All local and non-provider features remain usable.

## Durable and fallback modes

### Upstash mode

When both Upstash variables are configured, the endpoint performs two atomic counters through the Redis REST pipeline:

- a short-window counter;
- a daily counter.

Each counter sets its own expiry when first created. Redis keys contain a salted SHA-256 digest, not the raw network address.

### Memory fallback

When durable credentials are absent, or Redis fails and durable mode is not required, the endpoint uses a process-local memory counter. Responses identify this with:

```text
X-Oracle-RateLimit-Mode: memory
X-Oracle-RateLimit-Degraded: true
```

This fallback is useful for development and previews. It is not a reliable production allowance because serverless instances do not share memory and may restart at any time.

### Fail-closed production mode

When:

```text
ORACLE_REQUIRE_DURABLE_RATE_LIMIT=true
```

missing or unavailable Redis configuration causes the Oracle endpoint to return a controlled 503 response rather than sending an unmetered provider request.

## Client identification

The endpoint reads the first available trusted forwarding value in this order:

1. `x-vercel-forwarded-for`;
2. `x-forwarded-for`;
3. `x-real-ip`;
4. the runtime socket address.

Before use as a counter key, the value is combined with `ORACLE_RATE_LIMIT_SALT` and hashed. The implementation never sends the raw address to Redis.

## Response headers

Successful and limited responses may include:

```text
X-Oracle-RateLimit-Mode
X-Oracle-RateLimit-Degraded
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
X-RateLimit-Daily-Limit
X-RateLimit-Daily-Remaining
X-RateLimit-Daily-Reset
Retry-After
X-Oracle-Request-Id
```

These permit support and client diagnostics without exposing provider credentials or internal prompts.

## Privacy-preserving logs

Structured server logs include only operational fields such as:

- request ID;
- request operation (`single` or `triad`);
- provider and model;
- streaming state;
- rate-limit mode;
- completion or failure category.

The logging calls do not include the question, chapter text, recent-reading questions, reconstructed prompts, or raw network address.

## Vercel Bot Protection

Enable Bot Protection for the production project in Vercel's security controls. Use challenge mode for suspicious automated traffic rather than relying on CORS. CORS restricts ordinary browser calls but is not authentication and cannot prevent a custom client from reproducing an allowed request.

Bot protection complements the application counters:

- the edge layer reduces automated traffic before the function runs;
- the function allowance limits valid consultations that reach the provider;
- provider budgets cap financial exposure if both other layers are bypassed.

## Provider budget and monitoring

Before broad promotion:

- configure provider-side spending or usage ceilings where available;
- begin with a conservative daily public allowance;
- alert on sustained 429, 503, and provider 5xx rates;
- monitor request counts without retaining private question content;
- keep the emergency switch documented and accessible to the operator.

## Release verification

For a controlled beta:

1. configure Upstash and all production variables;
2. set `ORACLE_REQUIRE_DURABLE_RATE_LIMIT=true`;
3. redeploy;
4. confirm a consultation response reports `X-Oracle-RateLimit-Mode: upstash`;
5. lower the short limit temporarily in a preview and verify a 429 plus `Retry-After`;
6. switch `ORACLE_PUBLIC_ENABLED=false`, redeploy, and verify local tools still work;
7. restore the switch and production limits, then redeploy again.
