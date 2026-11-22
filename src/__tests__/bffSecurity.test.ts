import { beforeAll, describe, expect, it } from 'vitest';

import { AccessSessionPayload, sealSession, unsealSession } from '../../website/api/_lib/crypto';
import { sanitizeUpstreamError } from '../../website/api/_lib/http';
import { buildSignedOAuthUrl } from '../../website/api/_lib/oauth1';
import {
  isValidUsosMethodPath,
  resolveAllowedCallbackUrl,
  resolveAndValidateInstallation,
} from '../../website/api/_lib/registry';

beforeAll(() => {
  process.env.SESSION_ENCRYPTION_KEY =
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
});

describe('BFF AES-256-GCM Session Crypto', () => {
  it('seals and unseals valid access sessions', () => {
    const token = sealSession({
      kind: 'access_session',
      installationId: 'uken',
      baseUrl: 'https://usosapps.uken.krakow.pl/',
      accessToken: 'at_123',
      accessTokenSecret: 'ats_456',
      iat: Date.now(),
    });
    expect(token.startsWith('rd_v1.')).toBe(true);
    const decoded = unsealSession<AccessSessionPayload>(token, 'access_session');
    expect(decoded?.installationId).toBe('uken');
    expect(decoded?.accessToken).toBe('at_123');
    expect(decoded?.accessTokenSecret).toBe('ats_456');
  });

  it('rejects tampered tokens and kind mismatches', () => {
    const token = sealSession({
      kind: 'request_token',
      installationId: 'uken',
      baseUrl: 'https://usosapps.uken.krakow.pl/',
      oauthToken: 'rt_1',
      oauthTokenSecret: 'rts_1',
      exp: Date.now() + 60_000,
    });
    expect(unsealSession(token, 'access_session')).toBeNull();
    const tampered = token.slice(0, -4) + 'AAAA';
    expect(unsealSession(tampered, 'request_token')).toBeNull();
  });

  it('rejects expired request_token sessions', () => {
    const expired = sealSession({
      kind: 'request_token',
      installationId: 'uken',
      baseUrl: 'https://usosapps.uken.krakow.pl/',
      oauthToken: 'rt_1',
      oauthTokenSecret: 'rts_1',
      exp: Date.now() - 1_000,
    });
    expect(unsealSession(expired, 'request_token')).toBeNull();
  });
});

describe('BFF Security Guards (SSRF, Allowlists, Parameter Injection)', () => {
  it('blocks localhost, private IPs, and non-HTTPS URLs (SSRF)', async () => {
    expect(await resolveAndValidateInstallation(undefined, 'http://127.0.0.1:8080/')).toBeNull();
    expect(await resolveAndValidateInstallation(undefined, 'https://localhost/')).toBeNull();
    expect(await resolveAndValidateInstallation(undefined, 'https://169.254.169.254/')).toBeNull();
  });

  it('resolves known universities including UKEN and AGH', async () => {
    const uken = await resolveAndValidateInstallation('uken');
    expect(uken?.baseUrl).toBe('https://usosapps.uken.krakow.pl/');
    const agh = await resolveAndValidateInstallation('agh');
    expect(agh?.baseUrl).toBe('https://apps.usos.agh.edu.pl/');
  });

  it('enforces strict read-only USOS method allowlist', () => {
    expect(isValidUsosMethodPath('services/users/user')).toBe(true);
    expect(isValidUsosMethodPath('services/tt/user')).toBe(true);
    expect(isValidUsosMethodPath('services/oauth/revoke_token')).toBe(false);
    expect(isValidUsosMethodPath('services/users/../admin')).toBe(false);
    expect(isValidUsosMethodPath('developers/submit')).toBe(false);
  });

  it('blocks open redirect callbackUrl values', () => {
    expect(resolveAllowedCallbackUrl('riftdaily://oauth-callback')).toBe(
      'riftdaily://oauth-callback'
    );
    expect(resolveAllowedCallbackUrl('oob')).toBe('oob');
    expect(resolveAllowedCallbackUrl('https://evil.example/steal')).toBeNull();
  });

  it('prevents client params from overriding OAuth protocol fields', () => {
    const url = buildSignedOAuthUrl(
      'GET',
      'https://usosapps.uken.krakow.pl/services/users/user',
      {
        fields: 'id',
        oauth_consumer_key: 'INJECTED',
        oauth_token: 'INJECTED_TOKEN',
      },
      {
        consumerKey: 'real_key',
        consumerSecret: 'real_secret',
        token: 'real_token',
        tokenSecret: 'real_token_secret',
      }
    );
    const parsed = new URL(url);
    expect(parsed.searchParams.get('oauth_consumer_key')).toBe('real_key');
    expect(parsed.searchParams.get('oauth_token')).toBe('real_token');
  });

  it('redacts OAuth tokens and URLs from upstream error messages', () => {
    const cleaned = sanitizeUpstreamError(
      'Failed oauth_token=secret123 at https://usosapps.uken.krakow.pl/services/tt/user'
    );
    expect(cleaned).not.toContain('secret123');
    expect(cleaned).not.toContain('usosapps.uken.krakow.pl');
  });
});
