/**
 * Central Rift Daily Backend-for-Frontend (BFF) configuration.
 * All USOS OAuth 1.0a Consumer Keys and Secrets live exclusively on the Vercel backend
 * and are NEVER bundled into the mobile app binary.
 */

const DEFAULT_BACKEND_URL = 'https://rift-daily.vercel.app';

export function getBackendBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_BACKEND_URL?.trim();
  const base = raw && raw.startsWith('http') ? raw : DEFAULT_BACKEND_URL;
  return base.replace(/\/+$/, '');
}

export interface BackendHealthStatus {
  ok: boolean;
  service: string;
  version: string;
  configuredInstallations: string[];
  encryptionReady: boolean;
}

export async function fetchBackendHealth(): Promise<BackendHealthStatus> {
  const res = await fetch(`${getBackendBaseUrl()}/api/usos/health`);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || `Backend healthcheck failed (${res.status})`);
  }
  return json as BackendHealthStatus;
}
