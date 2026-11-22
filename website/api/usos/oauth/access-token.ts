import {
  RequestTokenSessionPayload,
  sealSession,
  unsealSession,
} from '../../_lib/crypto.js';
import {
  checkRateLimit,
  errorResponse,
  jsonResponse,
  optionsResponse,
  parseJsonBody,
} from '../../_lib/http.js';
import { buildSignedOAuthUrl, parseQueryString } from '../../_lib/oauth1.js';
import { getEnvConsumerCredentials } from '../../_lib/registry.js';

interface AccessTokenBody {
  requestTokenSession?: string;
  oauthVerifier?: string;
}

export function OPTIONS(): Response {
  return optionsResponse();
}

export async function POST(request: Request): Promise<Response> {
  const limited = checkRateLimit(request, 'oauth_acc', 10);
  if (limited) return limited;

  try {
    const body = await parseJsonBody<AccessTokenBody>(request);
    if (!body?.requestTokenSession || !body?.oauthVerifier) {
      return errorResponse(
        'Wymagane są pola requestTokenSession oraz oauthVerifier.',
        400,
        'MISSING_FIELDS'
      );
    }

    const reqPayload = unsealSession<RequestTokenSessionPayload>(
      body.requestTokenSession,
      'request_token'
    );
    if (!reqPayload) {
      return errorResponse(
        'Sesja logowania wygasła lub jest nieprawidłowa. Rozpocznij logowanie ponownie.',
        401,
        'INVALID_REQUEST_SESSION'
      );
    }

    const creds =
      getEnvConsumerCredentials(reqPayload.installationId) ||
      (reqPayload.provisionedKey && reqPayload.provisionedSecret
        ? {
            consumerKey: reqPayload.provisionedKey,
            consumerSecret: reqPayload.provisionedSecret,
          }
        : null);

    if (!creds) {
      return errorResponse(
        'Brak kluczy USOS po stronie serwera dla tej sesji.',
        500,
        'MISSING_SERVER_KEYS'
      );
    }

    const endpoint = `${reqPayload.baseUrl}services/oauth/access_token`;
    const signedUrl = buildSignedOAuthUrl(
      'GET',
      endpoint,
      {
        oauth_verifier: body.oauthVerifier.trim(),
      },
      {
        consumerKey: creds.consumerKey,
        consumerSecret: creds.consumerSecret,
        token: reqPayload.oauthToken,
        tokenSecret: reqPayload.oauthTokenSecret,
      }
    );

    const usosRes = await fetch(signedUrl, { signal: AbortSignal.timeout(12_000) });
    const rawText = await usosRes.text();
    if (!usosRes.ok) {
      console.error(
        `[api/usos/oauth/access-token] USOS error (${usosRes.status}) for ${reqPayload.installationId}:`,
        rawText.slice(0, 300)
      );
      return errorResponse(
        `Nieprawidłowy kod PIN lub błąd USOS access_token (${usosRes.status}).`,
        401,
        'USOS_ACCESS_TOKEN_FAILED'
      );
    }

    const parsed = parseQueryString(rawText);
    if (!parsed.oauth_token || !parsed.oauth_token_secret) {
      console.error('[api/usos/oauth/access-token] Malformed USOS response:', rawText.slice(0, 200));
      return errorResponse(
        'Nieprawidłowa odpowiedź z USOS services/oauth/access_token.',
        502,
        'USOS_INVALID_RESPONSE'
      );
    }

    const sessionToken = sealSession({
      kind: 'access_session',
      installationId: reqPayload.installationId,
      baseUrl: reqPayload.baseUrl,
      accessToken: parsed.oauth_token,
      accessTokenSecret: parsed.oauth_token_secret,
      provisionedKey: reqPayload.provisionedKey,
      provisionedSecret: reqPayload.provisionedSecret,
      iat: Date.now(),
    });

    return jsonResponse({
      sessionToken,
      installationId: reqPayload.installationId,
    });
  } catch (err) {
    console.error('[api/usos/oauth/access-token] Unhandled error:', err);
    return errorResponse(
      'Wewnętrzny błąd serwera podczas finalizacji logowania.',
      500,
      'INTERNAL_ERROR'
    );
  }
}
