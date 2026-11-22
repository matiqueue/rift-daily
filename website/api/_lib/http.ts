/**
 * Shared HTTP response, security headers, body size guard, and per-IP rate limiting
 * for Rift Daily Vercel Functions.
 */

const ALLOWED_WEB_ORIGIN = 'https://rift-daily.vercel.app';
const MAX_BODY_BYTES = 16 * 1024; // 16 KB hard limit

export function buildSecurityHeaders(request?: Request): Record<string, string> {
  const origin = request?.headers.get('origin') || '';
  const allowOrigin = origin === ALLOWED_WEB_ORIGIN ? ALLOWED_WEB_ORIGIN : ALLOWED_WEB_ORIGIN;

  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    Pragma: 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

export function jsonResponse(body: unknown, status = 200, request?: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...buildSecurityHeaders(request),
    },
  });
}

export function errorResponse(
  message: string,
  status = 400,
  code?: string,
  request?: Request
): Response {
  return jsonResponse(
    {
      error: message,
      ...(code ? { code } : {}),
    },
    status,
    request
  );
}

export function optionsResponse(request?: Request): Response {
  return new Response(null, {
    status: 204,
    headers: buildSecurityHeaders(request),
  });
}

export async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    const contentLength = Number(request.headers.get('content-length') || '0');
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return null;
    }
    const text = await request.text();
    if (!text || Buffer.byteLength(text, 'utf8') > MAX_BODY_BYTES) {
      return null;
    }
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!auth) return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Strips any potential OAuth tokens/signatures/secrets from upstream error snippets.
 */
export function sanitizeUpstreamError(raw: string): string {
  return raw
    .replace(/oauth_[a-z_]+=[^&\s"']+/gi, 'oauth_redacted')
    .replace(/https?:\/\/[^\s"']+/gi, '[url]')
    .slice(0, 160)
    .trim();
}

/**
 * Lightweight per-instance sliding-window rate limiter to dampen burst abuse/DoS.
 * (Paired with Vercel Firewall / WAF at the edge.)
 */
const rateWindows = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  request: Request,
  bucket: string,
  maxPerMinute: number,
  customKey?: string
): Response | null {
  const forwarded = request.headers.get('x-forwarded-for') || '';
  const ip = forwarded.split(',')[0]?.trim() || 'unknown';
  const key = `${bucket}:${customKey || ip}`;
  const now = Date.now();
  const windowMs = 60_000;

  // Periodic cleanup to keep memory bounded
  if (rateWindows.size > 2000) {
    for (const [k, entry] of rateWindows.entries()) {
      if (entry.resetAt <= now) rateWindows.delete(k);
    }
  }

  const current = rateWindows.get(key);
  if (!current || current.resetAt <= now) {
    rateWindows.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  current.count += 1;
  if (current.count > maxPerMinute) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return new Response(
      JSON.stringify({
        error: 'Zbyt wiele żądań. Spróbuj ponownie za chwilę.',
        code: 'RATE_LIMITED',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Retry-After': String(retryAfter),
          ...buildSecurityHeaders(request),
        },
      }
    );
  }

  return null;
}
