import { sealSession } from '../../_lib/crypto.js';
import {
  checkRateLimit,
  errorResponse,
  jsonResponse,
  optionsResponse,
  parseJsonBody,
} from '../../_lib/http.js';
import { buildSignedOAuthUrl, parseQueryString } from '../../_lib/oauth1.js';
import {
  autoProvisionConsumerKeyOnServer,
  getEnvConsumerCredentials,
  resolveAllowedCallbackUrl,
  resolveAndValidateInstallation,
} from '../../_lib/registry.js';

const DEFAULT_SCOPES = [
  'studies',
  'grades',
  'crstests',
  'email',
  'personal',
  'photo',
  'payments',
  'student_exams',
  'surveys_filling',
  'cards',
  'slips',
  'adm_documents',
  'offline_access',
].join('|');

interface RequestTokenBody {
  installationId?: string;
  baseUrl?: string;
  callbackUrl?: string;
  scopes?: string;
}

export function OPTIONS(): Response {
  return optionsResponse();
}

export async function POST(request: Request): Promise<Response> {
  const limited = checkRateLimit(request, 'oauth_req', 10);
  if (limited) return limited;

  try {
    const body = await parseJsonBody<RequestTokenBody>(request);
    if (!body) {
      return errorResponse('Nieprawidłowe ciało żądania JSON.', 400, 'INVALID_JSON', request);
    }

    const callbackUrl = resolveAllowedCallbackUrl(body.callbackUrl);
    if (!callbackUrl) {
      return errorResponse(
        'Niedozwolony adres powrotny OAuth (callbackUrl).',
        400,
        'INVALID_CALLBACK',
        request
      );
    }

    const resolved = await resolveAndValidateInstallation(body.installationId, body.baseUrl);
    if (!resolved) {
      return errorResponse(
        'Nieobsługiwany lub nieprawidłowy adres instalacji USOS.',
        400,
        'INVALID_INSTALLATION',
        request
      );
    }

    let envCreds = getEnvConsumerCredentials(resolved.installationId);
    let provisionedKey: string | undefined;
    let provisionedSecret: string | undefined;

    if (!envCreds) {
      const provisioned = await autoProvisionConsumerKeyOnServer(resolved.baseUrl);
      if (!provisioned) {
        return errorResponse(
          `Serwer nie posiada skonfigurowanych kluczy USOS dla tej uczelni (${resolved.installationId}).`,
          422,
          'MISSING_CONSUMER_KEYS',
          request
        );
      }
      envCreds = provisioned;
      provisionedKey = provisioned.consumerKey;
      provisionedSecret = provisioned.consumerSecret;
    }

    // Always enforce server-defined scopes (prevents scope escalation from tampered clients)
    const scopes = DEFAULT_SCOPES;

    const endpoint = `${resolved.baseUrl}services/oauth/request_token`;
    const signedUrl = buildSignedOAuthUrl(
      'GET',
      endpoint,
      {
        oauth_callback: callbackUrl,
        scopes,
      },
      envCreds
    );

    const usosRes = await fetch(signedUrl, { signal: AbortSignal.timeout(12_000) });
    const rawText = await usosRes.text();
    if (!usosRes.ok) {
      console.error(
        `[api/usos/oauth/request-token] USOS error (${usosRes.status}) for ${resolved.installationId}:`,
        rawText.slice(0, 300)
      );
      return errorResponse(
        `Błąd USOS OAuth request_token (${usosRes.status}).`,
        502,
        'USOS_REQUEST_TOKEN_FAILED'
      );
    }

    const parsed = parseQueryString(rawText);
    if (!parsed.oauth_token || !parsed.oauth_token_secret) {
      console.error('[api/usos/oauth/request-token] Malformed USOS response:', rawText.slice(0, 200));
      return errorResponse(
        'Nieprawidłowa odpowiedź z USOS services/oauth/request_token.',
        502,
        'USOS_INVALID_RESPONSE'
      );
    }

    const requestTokenSession = sealSession({
      kind: 'request_token',
      installationId: resolved.installationId,
      baseUrl: resolved.baseUrl,
      oauthToken: parsed.oauth_token,
      oauthTokenSecret: parsed.oauth_token_secret,
      provisionedKey,
      provisionedSecret,
      exp: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    const authorizeUrl = `${resolved.baseUrl}services/oauth/authorize?oauth_token=${encodeURIComponent(
      parsed.oauth_token
    )}&interactivity=confirm_user`;

    return jsonResponse({
      authorizeUrl,
      requestTokenSession,
      installationId: resolved.installationId,
    });
  } catch (err) {
    console.error('[api/usos/oauth/request-token] Unhandled error:', err);
    return errorResponse('Wewnętrzny błąd serwera podczas inicjacji OAuth.', 500, 'INTERNAL_ERROR');
  }
}
