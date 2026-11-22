import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const TOKEN_PREFIX = 'rd_v1';
const MAX_ACCESS_SESSION_AGE_MS = 180 * 24 * 60 * 60 * 1000; // 180 days

function getEncryptionKey(): Buffer {
  const raw = process.env.SESSION_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error('Server misconfigured: SESSION_ENCRYPTION_KEY is missing.');
  }
  // Support either 64-char hex key or arbitrary high-entropy passphrase hashed to 32 bytes
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  return createHash('sha256').update(raw, 'utf8').digest();
}

export interface RequestTokenSessionPayload {
  kind: 'request_token';
  installationId: string;
  baseUrl: string;
  oauthToken: string;
  oauthTokenSecret: string;
  /** Only populated when dynamically provisioned for an installation without env keys */
  provisionedKey?: string;
  provisionedSecret?: string;
  exp: number;
}

export interface AccessSessionPayload {
  kind: 'access_session';
  installationId: string;
  baseUrl: string;
  accessToken: string;
  accessTokenSecret: string;
  /** Only populated when dynamically provisioned for an installation without env keys */
  provisionedKey?: string;
  provisionedSecret?: string;
  iat: number;
}

export type EncryptedSessionPayload = RequestTokenSessionPayload | AccessSessionPayload;

/**
 * Encrypts a session payload using AES-256-GCM into an opaque, tamper-proof token:
 * `rd_v1.<iv_b64url>.<authTag_b64url>.<ciphertext_b64url>`
 */
export function sealSession(payload: EncryptedSessionPayload): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    TOKEN_PREFIX,
    iv.toString('base64url'),
    authTag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

/**
 * Decrypts and authenticates an opaque session token. Returns null if tampered or invalid.
 */
export function unsealSession<T extends EncryptedSessionPayload>(
  token: string,
  expectedKind: T['kind']
): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 4 || parts[0] !== TOKEN_PREFIX) {
      return null;
    }
    const key = getEncryptionKey();
    const iv = Buffer.from(parts[1], 'base64url');
    const authTag = Buffer.from(parts[2], 'base64url');
    const ciphertext = Buffer.from(parts[3], 'base64url');

    if (iv.length !== 12 || authTag.length !== 16) {
      return null;
    }

    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const parsed = JSON.parse(decrypted.toString('utf8')) as EncryptedSessionPayload;

    if (parsed.kind !== expectedKind) {
      return null;
    }

    if (parsed.kind === 'request_token' && Date.now() > parsed.exp) {
      return null;
    }

    if (
      parsed.kind === 'access_session' &&
      (!parsed.iat || Date.now() - parsed.iat > MAX_ACCESS_SESSION_AGE_MS)
    ) {
      return null;
    }

    return parsed as T;
  } catch {
    return null;
  }
}
