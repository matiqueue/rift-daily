import { createHash } from 'node:crypto';

import { AccessSessionPayload, unsealSession } from '../_lib/crypto.js';
import {
  buildSecurityHeaders,
  checkRateLimit,
  errorResponse,
  extractBearerToken,
  jsonResponse,
  optionsResponse,
  parseJsonBody,
  sanitizeUpstreamError,
} from '../_lib/http.js';
import { buildSignedOAuthUrl } from '../_lib/oauth1.js';
import { getEnvConsumerCredentials, isValidUsosMethodPath } from '../_lib/registry.js';

interface SingleCallRequest {
  method?: string;
  params?: Record<string, string | number | boolean | undefined>;
}

const MAX_PARAMS_COUNT = 24;
const MAX_PARAM_VALUE_LEN = 2048;
const CACHE_TTL_MS = 60_000; // 60s short-term deduplication shield protecting university USOS servers
const MAX_CACHE_ENTRIES = 500;

const responseCache = new Map<string, { data: unknown; expiresAt: number }>();

function hashKey(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 32);
}

export function OPTIONS(request: Request): Response {
  return optionsResponse(request);
}

export async function POST(request: Request): Promise<Response> {
  const ipLimited = checkRateLimit(request, 'usos_call_ip', 90);
  if (ipLimited) return ipLimited;

  try {
    const bearer = extractBearerToken(request);
    if (!bearer) {
      return errorResponse('Brak nagłówka autoryzacji Bearer.', 401, 'UNAUTHORIZED', request);
    }

    const sessionHash = hashKey(bearer);
    const sessionLimited = checkRateLimit(request, 'usos_call_sess', 60, sessionHash);
    if (sessionLimited) return sessionLimited;

    const session = unsealSession<AccessSessionPayload>(bearer, 'access_session');
    if (!session) {
      return errorResponse(
        'Token sesji jest nieprawidłowy lub wygasł. Zaloguj się ponownie.',
        401,
        'INVALID_SESSION',
        request
      );
    }

    const body = await parseJsonBody<SingleCallRequest>(request);
    if (!body?.method || !isValidUsosMethodPath(body.method)) {
      return errorResponse(
        'Niedozwolona lub nieprawidłowa ścieżka metody USOS API.',
        403,
        'METHOD_NOT_ALLOWED',
        request
      );
    }

    const safeParams: Record<string, string | number | boolean | undefined> = {};
    if (body.params && typeof body.params === 'object' && !Array.isArray(body.params)) {
      const entries = Object.entries(body.params);
      if (entries.length > MAX_PARAMS_COUNT) {
        return errorResponse('Zbyt wiele parametrów zapytania.', 400, 'TOO_MANY_PARAMS', request);
      }
      for (const [k, v] of entries) {
        if (v === undefined || v === null) continue;
        if (k.toLowerCase().startsWith('oauth_')) {
          return errorResponse(
            'Niedozwolony parametr protokołu OAuth.',
            400,
            'FORBIDDEN_PARAM',
            request
          );
        }
        const strVal = String(v);
        if (strVal.length > MAX_PARAM_VALUE_LEN) {
          return errorResponse('Przekroczono maksymalną długość parametru.', 400, 'PARAM_TOO_LONG', request);
        }
        safeParams[k] = v;
      }
    }

    const creds =
      getEnvConsumerCredentials(session.installationId) ||
      (session.provisionedKey && session.provisionedSecret
        ? {
            consumerKey: session.provisionedKey,
            consumerSecret: session.provisionedSecret,
          }
        : null);

    if (!creds) {
      return errorResponse(
        `Brak kluczy USOS na serwerze dla uczelni ${session.installationId}.`,
        500,
        'MISSING_SERVER_KEYS',
        request
      );
    }

    const cleanMethod = body.method.trim().replace(/^\/+/, '');
    const sortedParamsKey = Object.keys(safeParams)
      .sort()
      .map((k) => `${k}=${safeParams[k]}`)
      .join('&');
    const cacheKey = hashKey(`${sessionHash}:${cleanMethod}:${sortedParamsKey}`);
    const now = Date.now();

    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return new Response(JSON.stringify({ data: cached.data }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Rift-Cache': 'HIT',
          ...buildSecurityHeaders(request),
        },
      });
    }

    const endpoint = `${session.baseUrl}${cleanMethod}`;
    const signedUrl = buildSignedOAuthUrl('GET', endpoint, safeParams, {
      consumerKey: creds.consumerKey,
      consumerSecret: creds.consumerSecret,
      token: session.accessToken,
      tokenSecret: session.accessTokenSecret,
    });

    const usosRes = await fetch(signedUrl, { signal: AbortSignal.timeout(15_000) });
    const rawText = await usosRes.text();

    if (!usosRes.ok) {
      console.error(
        `[api/usos/call] USOS ${cleanMethod} failed (${usosRes.status}) for ${session.installationId}:`,
        sanitizeUpstreamError(rawText)
      );
      return errorResponse(
        `USOS API ${cleanMethod} (${usosRes.status}): ${sanitizeUpstreamError(rawText)}`,
        usosRes.status === 401 ? 401 : 502,
        'USOS_UPSTREAM_ERROR',
        request
      );
    }

    let data: unknown;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }

    if (responseCache.size >= MAX_CACHE_ENTRIES) {
      for (const [k, entry] of responseCache.entries()) {
        if (entry.expiresAt <= now) responseCache.delete(k);
      }
      if (responseCache.size >= MAX_CACHE_ENTRIES) {
        const firstKey = responseCache.keys().next().value;
        if (firstKey) responseCache.delete(firstKey);
      }
    }
    responseCache.set(cacheKey, { data, expiresAt: now + CACHE_TTL_MS });

    return jsonResponse({ data }, 200, request);
  } catch (err) {
    console.error('[api/usos/call] Unhandled error:', err);
    return errorResponse('Wewnętrzny błąd serwera proxy USOS.', 500, 'INTERNAL_ERROR', request);
  }
}
