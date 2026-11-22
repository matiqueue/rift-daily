import { describe, expect, it } from 'vitest';

import {
  buildSignedOAuthUrl,
  hmacSha1Base64,
  parseQueryString,
  rfc3986Encode,
} from '../api/oauth1';

describe('OAuth 1.0a utilities', () => {
  it('encodes reserved RFC 3986 characters properly', () => {
    expect(rfc3986Encode("a!b'c(d)e*f g")).toBe('a%21b%27c%28d%29e%2Af%20g');
  });

  it('computes deterministic HMAC-SHA1 Base64 digest', () => {
    // Known RFC 2202 / OAuth 1.0a test vector
    const digest = hmacSha1Base64('key', 'The quick brown fox jumps over the lazy dog');
    expect(digest).toBe('3nybhbi3iqa8ino29wqQcBydtNk=');
  });

  it('parses URL-encoded query strings cleanly', () => {
    const parsed = parseQueryString('?oauth_token=abc123&oauth_token_secret=sec%2Bret');
    expect(parsed).toEqual({
      oauth_token: 'abc123',
      oauth_token_secret: 'sec+ret',
    });
  });

  it('generates signed OAuth URLs containing required OAuth 1.0a parameters', () => {
    const url = buildSignedOAuthUrl(
      'GET',
      'https://usosapps.uken.krakow.pl/services/users/user',
      { fields: 'id|first_name' },
      {
        consumerKey: 'ck_test',
        consumerSecret: 'cs_test',
        token: 'tok_test',
        tokenSecret: 'tsec_test',
      }
    );
    const parsed = new URL(url);
    expect(parsed.searchParams.get('oauth_consumer_key')).toBe('ck_test');
    expect(parsed.searchParams.get('oauth_token')).toBe('tok_test');
    expect(parsed.searchParams.get('oauth_signature_method')).toBe('HMAC-SHA1');
    expect(parsed.searchParams.get('oauth_version')).toBe('1.0');
    expect(parsed.searchParams.get('oauth_signature')).toBeTruthy();
    expect(parsed.searchParams.get('fields')).toBe('id|first_name');
  });
});
