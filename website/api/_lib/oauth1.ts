import { createHmac, randomBytes } from 'node:crypto';

export interface OAuthCredentials {
  consumerKey: string;
  consumerSecret: string;
  token?: string;
  tokenSecret?: string;
}

/**
 * RFC 3986 Percent-Encoding required by OAuth 1.0a (RFC 5849).
 */
export function rfc3986Encode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
  });
}

/**
 * Generates a cryptographically signed OAuth 1.0a HMAC-SHA1 URL using Node.js `node:crypto`.
 */
export function buildSignedOAuthUrl(
  method: 'GET' | 'POST',
  baseUrl: string,
  params: Record<string, string | number | boolean | undefined>,
  credentials: OAuthCredentials
): string {
  const cleanBaseUrl = baseUrl.split('?')[0];
  const nonce = randomBytes(16).toString('hex');
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const allParams: Record<string, string> = {
    oauth_consumer_key: credentials.consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_version: '1.0',
  };

  if (credentials.token) {
    allParams.oauth_token = credentials.token;
  }

  const ALLOWED_OAUTH_EXTRA_PARAMS = new Set(['oauth_callback', 'oauth_verifier']);

  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const lowerKey = k.toLowerCase();
    // Prevent client-supplied parameters from overriding OAuth protocol fields
    if (lowerKey.startsWith('oauth_') && !ALLOWED_OAUTH_EXTRA_PARAMS.has(lowerKey)) {
      continue;
    }
    allParams[k] = String(v);
  }

  const sortedPairs = Object.keys(allParams)
    .map((k) => [rfc3986Encode(k), rfc3986Encode(allParams[k])] as const)
    .sort((a, b) => {
      if (a[0] === b[0]) return a[1].localeCompare(b[1]);
      return a[0].localeCompare(b[0]);
    });

  const normalizedParamString = sortedPairs.map(([k, v]) => `${k}=${v}`).join('&');

  const signatureBaseString = [
    method.toUpperCase(),
    rfc3986Encode(cleanBaseUrl),
    rfc3986Encode(normalizedParamString),
  ].join('&');

  const signingKey = `${rfc3986Encode(credentials.consumerSecret)}&${rfc3986Encode(
    credentials.tokenSecret || ''
  )}`;

  const signature = createHmac('sha1', signingKey).update(signatureBaseString).digest('base64');
  allParams.oauth_signature = signature;

  const queryString = Object.keys(allParams)
    .map((k) => `${rfc3986Encode(k)}=${rfc3986Encode(allParams[k])}`)
    .join('&');

  return `${cleanBaseUrl}?${queryString}`;
}

export function parseQueryString(query: string): Record<string, string> {
  const out: Record<string, string> = {};
  const trimmed = query.replace(/^[?#]/, '');
  if (!trimmed) return out;
  for (const part of trimmed.split('&')) {
    const [rawK, rawV] = part.split('=');
    if (rawK) {
      out[decodeURIComponent(rawK)] = decodeURIComponent(rawV || '');
    }
  }
  return out;
}
