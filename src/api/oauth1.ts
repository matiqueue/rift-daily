/**
 * Pure TypeScript implementation of OAuth 1.0a (RFC 5849) HMAC-SHA1 signing
 * specifically designed for USOS API (`services/oauth/request_token`, `authorize`, `access_token`, and signed REST calls).
 * Runs natively in React Native / Expo without Node.js `crypto` polyfill issues.
 */

export interface OAuthCredentials {
  consumerKey: string;
  consumerSecret: string;
  token?: string;
  tokenSecret?: string;
}

/**
 * RFC 3986 Percent-Encoding required by OAuth 1.0a
 */
export function rfc3986Encode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
  });
}

/**
 * Pure JS/TS SHA-1 and HMAC-SHA1 (RFC 2104 / FIPS 180-4) for OAuth 1.0a signature generation
 */
function sha1Bytes(msgBytes: number[]): number[] {
  function rotl(n: number, s: number): number {
    return (n << s) | (n >>> (32 - s));
  }

  const ml = msgBytes.length * 8;
  const withOne = [...msgBytes, 0x80];
  while ((withOne.length * 8) % 512 !== 448) {
    withOne.push(0);
  }

  const hi = Math.floor(ml / 0x100000000);
  const lo = ml >>> 0;
  for (let i = 3; i >= 0; i--) withOne.push((hi >>> (i * 8)) & 0xff);
  for (let i = 3; i >= 0; i--) withOne.push((lo >>> (i * 8)) & 0xff);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  const w = new Array<number>(80);

  for (let i = 0; i < withOne.length; i += 64) {
    for (let j = 0; j < 16; j++) {
      const idx = i + j * 4;
      w[j] =
        ((withOne[idx] << 24) |
          (withOne[idx + 1] << 16) |
          (withOne[idx + 2] << 8) |
          withOne[idx + 3]) >>>
        0;
    }
    for (let j = 16; j < 80; j++) {
      w[j] = rotl(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let j = 0; j < 80; j++) {
      let f = 0;
      let k = 0;
      if (j < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (j < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (j < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = (rotl(a, 5) + f + e + k + w[j]) >>> 0;
      e = d;
      d = c;
      c = rotl(b, 30) >>> 0;
      b = a;
      a = temp;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  const out: number[] = [];
  for (const h of [h0, h1, h2, h3, h4]) {
    out.push((h >>> 24) & 0xff, (h >>> 16) & 0xff, (h >>> 8) & 0xff, h & 0xff);
  }
  return out;
}

function utf8ToBytes(str: string): number[] {
  const encoded = unescape(encodeURIComponent(str));
  const bytes: number[] = [];
  for (let i = 0; i < encoded.length; i++) {
    bytes.push(encoded.charCodeAt(i));
  }
  return bytes;
}

function bytesToBase64(bytes: number[]): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;

    const triplet = (b1 << 16) | (b2 << 8) | b3;
    result += chars[(triplet >>> 18) & 0x3f];
    result += chars[(triplet >>> 12) & 0x3f];
    result += i + 1 < bytes.length ? chars[(triplet >>> 6) & 0x3f] : '=';
    result += i + 2 < bytes.length ? chars[triplet & 0x3f] : '=';
  }
  return result;
}

export function hmacSha1Base64(keyStr: string, messageStr: string): string {
  const blockSize = 64;
  let keyBytes = utf8ToBytes(keyStr);
  if (keyBytes.length > blockSize) {
    keyBytes = sha1Bytes(keyBytes);
  }
  while (keyBytes.length < blockSize) {
    keyBytes.push(0);
  }

  const oKeyPad = keyBytes.map((b) => b ^ 0x5c);
  const iKeyPad = keyBytes.map((b) => b ^ 0x36);

  const innerHash = sha1Bytes([...iKeyPad, ...utf8ToBytes(messageStr)]);
  const outerHash = sha1Bytes([...oKeyPad, ...innerHash]);
  return bytesToBase64(outerHash);
}

/**
 * Generates a signed OAuth 1.0a URL for USOS API requests
 */
export function buildSignedOAuthUrl(
  method: 'GET' | 'POST',
  baseUrl: string,
  params: Record<string, string | number | boolean | undefined>,
  credentials: OAuthCredentials
): string {
  const cleanBaseUrl = baseUrl.split('?')[0];
  const nonce =
    Math.random().toString(36).substring(2, 12) +
    Math.random().toString(36).substring(2, 12);
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

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      allParams[k] = String(v);
    }
  });

  // Sort lexicographically by encoded key & value per RFC 5849 Section 3.4.1.3.2
  const sortedPairs = Object.keys(allParams)
    .map((k) => [rfc3986Encode(k), rfc3986Encode(allParams[k])] as const)
    .sort((a, b) => {
      if (a[0] === b[0]) return a[1].localeCompare(b[1]);
      return a[0].localeCompare(b[0]);
    });

  const normalizedParamString = sortedPairs
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const signatureBaseString = [
    method.toUpperCase(),
    rfc3986Encode(cleanBaseUrl),
    rfc3986Encode(normalizedParamString),
  ].join('&');

  const signingKey = `${rfc3986Encode(credentials.consumerSecret)}&${rfc3986Encode(
    credentials.tokenSecret || ''
  )}`;

  const signature = hmacSha1Base64(signingKey, signatureBaseString);
  allParams.oauth_signature = signature;

  const queryString = Object.keys(allParams)
    .map((k) => `${rfc3986Encode(k)}=${rfc3986Encode(allParams[k])}`)
    .join('&');

  return `${cleanBaseUrl}?${queryString}`;
}

/**
 * Parses URL-encoded OAuth token responses (e.g., `oauth_token=xxx&oauth_token_secret=yyy`)
 */
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
