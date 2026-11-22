import { jsonResponse, optionsResponse } from '../_lib/http.js';
import { listConfiguredInstallationIds } from '../_lib/registry.js';

export function OPTIONS(): Response {
  return optionsResponse();
}

export async function GET(): Promise<Response> {
  try {
    const configuredInstallations = listConfiguredInstallationIds();
    const encryptionReady = Boolean(process.env.SESSION_ENCRYPTION_KEY?.trim());

    return jsonResponse({
      ok: encryptionReady,
      service: 'rift-daily-usos-bff',
      version: '1.0.0',
      configuredInstallations,
      encryptionReady,
    });
  } catch (err) {
    console.error('[api/usos/health] Error:', err);
    return jsonResponse({ ok: false, error: 'Healthcheck failed' }, 500);
  }
}
