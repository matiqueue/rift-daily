/**
 * Server-side USOS installation registry, environment key resolver, and SSRF protection.
 * Consumer Keys and Secrets NEVER leave the server.
 */

export interface KnownUsosInstallation {
  id: string;
  baseUrl: string;
  envSuffix: string;
}

export const KNOWN_INSTALLATIONS: KnownUsosInstallation[] = [
  { id: 'uken', baseUrl: 'https://usosapps.uken.krakow.pl/', envSuffix: 'UKEN' },
  { id: 'agh', baseUrl: 'https://apps.usos.agh.edu.pl/', envSuffix: 'AGH' },
  { id: 'uj', baseUrl: 'https://apps.usos.uj.edu.pl/', envSuffix: 'UJ' },
  { id: 'uek', baseUrl: 'https://appsusos.uek.krakow.pl/', envSuffix: 'UEK' },
  { id: 'urk', baseUrl: 'https://usosapi.ur.krakow.pl/', envSuffix: 'URK' },
  { id: 'upjp2', baseUrl: 'https://usosapi.upjp2.edu.pl/', envSuffix: 'UPJP2' },
  { id: 'awf_krk', baseUrl: 'https://usosapi.awf.krakow.pl/', envSuffix: 'AWF_KRK' },
  { id: 'uw', baseUrl: 'https://usosapps.uw.edu.pl/', envSuffix: 'UW' },
  { id: 'pw', baseUrl: 'https://apps.usos.pw.edu.pl/', envSuffix: 'PW' },
  { id: 'uam', baseUrl: 'https://usosapps.amu.edu.pl/', envSuffix: 'UAM' },
  { id: 'pwr', baseUrl: 'https://apps.usos.pwr.edu.pl/', envSuffix: 'PWR' },
  { id: 'uwr', baseUrl: 'https://usosapps.uni.wroc.pl/', envSuffix: 'UWR' },
  { id: 'pp', baseUrl: 'https://usosapps.put.poznan.pl/', envSuffix: 'PP' },
  { id: 'umk', baseUrl: 'https://usosapps.umk.pl/', envSuffix: 'UMK' },
  { id: 'us', baseUrl: 'https://usosapps.us.edu.pl/', envSuffix: 'US' },
  { id: 'polsl', baseUrl: 'https://usosapps.polsl.pl/', envSuffix: 'POLSL' },
  { id: 'ul', baseUrl: 'https://usosapps.uni.lodz.pl/', envSuffix: 'UL' },
  { id: 'umcs', baseUrl: 'https://apps.umcs.pl/', envSuffix: 'UMCS' },
  { id: 'wum', baseUrl: 'https://usosapps.wum.edu.pl/', envSuffix: 'WUM' },
  { id: 'sggw', baseUrl: 'https://usosapps.sggw.edu.pl/', envSuffix: 'SGGW' },
  { id: 'uksw', baseUrl: 'https://usosapps.uksw.edu.pl/', envSuffix: 'UKSW' },
  { id: 'pb', baseUrl: 'https://usos-apps.uci.pb.edu.pl/', envSuffix: 'PB' },
  { id: 'uwb', baseUrl: 'https://usosapps.uwb.edu.pl/', envSuffix: 'UWB' },
  { id: 'prz', baseUrl: 'https://usosapps.prz.edu.pl/', envSuffix: 'PRZ' },
  { id: 'uew', baseUrl: 'https://usosapps.ue.wroc.pl/', envSuffix: 'UEW' },
];

const BY_ID = new Map(KNOWN_INSTALLATIONS.map((i) => [i.id, i]));
const BY_HOST = new Map(
  KNOWN_INSTALLATIONS.map((i) => [new URL(i.baseUrl).hostname.toLowerCase(), i])
);

export function getEnvConsumerCredentials(
  installationId: string
): { consumerKey: string; consumerSecret: string } | null {
  const known = BY_ID.get(installationId.toLowerCase());
  const suffix = known
    ? known.envSuffix
    : installationId.toUpperCase().replace(/[^A-Z0-9_]/g, '_');

  const consumerKey = process.env[`USOS_KEY_${suffix}`]?.trim();
  const consumerSecret = process.env[`USOS_SECRET_${suffix}`]?.trim();

  if (consumerKey && consumerSecret) {
    return { consumerKey, consumerSecret };
  }
  return null;
}

/**
 * Returns the list of installation IDs that have server-side credentials configured.
 * Never leaks any key or secret values.
 */
export function listConfiguredInstallationIds(): string[] {
  return KNOWN_INSTALLATIONS.filter((inst) => Boolean(getEnvConsumerCredentials(inst.id))).map(
    (inst) => inst.id
  );
}

/**
 * Verifies that a requested USOS baseUrl is a legitimate HTTPS Polish USOS installation
 * (prevents SSRF attacks against internal/arbitrary hosts).
 */
export async function resolveAndValidateInstallation(
  installationId?: string,
  requestedBaseUrl?: string
): Promise<{ installationId: string; baseUrl: string } | null> {
  if (installationId) {
    const known = BY_ID.get(installationId.toLowerCase());
    if (known) {
      return { installationId: known.id, baseUrl: known.baseUrl };
    }
  }

  if (!requestedBaseUrl) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(requestedBaseUrl);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    return null;
  }

  const host = parsed.hostname.toLowerCase();

  // Reject localhost / raw IP addresses
  if (
    host === 'localhost' ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
    host.includes(':') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return null;
  }

  const knownByHost = BY_HOST.get(host);
  if (knownByHost) {
    return { installationId: knownByHost.id, baseUrl: knownByHost.baseUrl };
  }

  // Verify against the official central USOS installation registry
  try {
    const res = await fetch(
      'https://apps.usos.edu.pl/services/apisrv/installations?fields=base_url',
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const list = (await res.json()) as { base_url?: string }[];
    const match = list.find((entry) => {
      if (!entry.base_url) return false;
      try {
        const entryHost = new URL(
          entry.base_url.replace(/^http:\/\//, 'https://')
        ).hostname.toLowerCase();
        return entryHost === host;
      } catch {
        return false;
      }
    });

    if (match?.base_url) {
      const normalized = match.base_url.replace(/^http:\/\//, 'https://').replace(/\/?$/, '/');
      return {
        installationId: host.replace(/[^a-z0-9]/gi, '_').toLowerCase(),
        baseUrl: normalized,
      };
    }
  } catch (err) {
    console.error('[registry] Failed to verify USOS installation host:', err);
  }

  return null;
}

/**
 * Strict allowlist of read-only USOS API methods permitted through the Rift Daily BFF proxy.
 * Prevents abuse of arbitrary/mutating USOS endpoints even if a session token were compromised.
 */
const ALLOWED_USOS_METHODS = new Set<string>([
  'services/apisrv/installation',
  'services/users/user',
  'services/users/users',
  'services/users/search2',
  'services/progs/student',
  'services/courses/user',
  'services/courses/user_ects_points',
  'services/courses/courses',
  'services/tt/user',
  'services/grades/terms2',
  'services/grades/latest',
  'services/crstests/participant',
  'services/payments/user_payments',
  'services/payments/user_accounts',
  'services/cards/user_cards',
  'services/exams/student_exams',
  'services/surveys/surveys_to_fill2',
  'services/geo/building_index',
  'services/theses/user',
]);

/**
 * Validates that a USOS API method path is explicitly on the read-only allowlist.
 */
export function isValidUsosMethodPath(methodPath: string): boolean {
  if (!methodPath || typeof methodPath !== 'string') return false;
  const trimmed = methodPath.trim().replace(/^\/+/, '');
  if (trimmed.includes('..') || trimmed.includes('?') || trimmed.includes('#')) return false;
  return ALLOWED_USOS_METHODS.has(trimmed);
}

const ALLOWED_OAUTH_CALLBACKS = new Set<string>(['riftdaily://oauth-callback', 'oob']);

export function resolveAllowedCallbackUrl(raw?: string): string | null {
  if (!raw || !raw.trim()) return 'riftdaily://oauth-callback';
  const trimmed = raw.trim();
  return ALLOWED_OAUTH_CALLBACKS.has(trimmed) ? trimmed : null;
}

/**
 * Server-side fallback self-service provisioning for USOS installations
 * that do not yet have pre-configured Vercel environment keys.
 */
export async function autoProvisionConsumerKeyOnServer(
  baseUrl: string
): Promise<{ consumerKey: string; consumerSecret: string } | null> {
  try {
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const devUrl = `${normalizedBase}developers/`;
    const getRes = await fetch(devUrl, { signal: AbortSignal.timeout(6000) });
    const html = await getRes.text();
    const match = html.match(/name=["']csrfmiddlewaretoken["']\s+value=["']([^"']+)["']/);
    const csrf = match ? match[1] : '';

    const formBody = [
      `appname=${encodeURIComponent('Rift Daily')}`,
      `appurl=${encodeURIComponent('https://rift-daily.vercel.app')}`,
      `email=${encodeURIComponent('matiqueue@users.noreply.github.com')}`,
      csrf ? `csrfmiddlewaretoken=${encodeURIComponent(csrf)}` : '',
    ]
      .filter(Boolean)
      .join('&');

    const postRes = await fetch(`${normalizedBase}developers/submit`, {
      method: 'POST',
      headers: {
        Referer: devUrl,
        'X-CSRFToken': csrf,
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: formBody,
      signal: AbortSignal.timeout(6000),
    });

    const json = (await postRes.json()) as {
      status?: string;
      consumer_key?: string;
      consumer_secret?: string;
    };
    if (json?.status === 'success' && json.consumer_key && json.consumer_secret) {
      return {
        consumerKey: String(json.consumer_key),
        consumerSecret: String(json.consumer_secret),
      };
    }
    return null;
  } catch (err) {
    console.error('[registry] autoProvisionConsumerKeyOnServer failed:', err);
    return null;
  }
}
