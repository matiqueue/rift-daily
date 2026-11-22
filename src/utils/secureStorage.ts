import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Hardware-backed Keychain (iOS) / Keystore (Android) storage wrapper.
 * - Uses `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` so tokens stay encrypted on-device
 *   while remaining readable during iOS background refresh tasks.
 * - Sanitizes keys strictly to `[A-Za-z0-9._-]` as required by `expo-secure-store`.
 */

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export function sanitizeSecureKey(rawKey: string): string {
  const sanitized = String(rawKey || '')
    .trim()
    .replace(/[^A-Za-z0-9._-]/g, '_');
  if (!sanitized) {
    throw new Error('Secure storage key cannot be empty.');
  }
  return sanitized;
}

export async function secureGetItem(key: string): Promise<string | null> {
  const safeKey = sanitizeSecureKey(key);
  try {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(safeKey) : null;
    }
    return await SecureStore.getItemAsync(safeKey, SECURE_STORE_OPTIONS);
  } catch {
    return null;
  }
}

export async function secureSetItem(key: string, value: string): Promise<void> {
  const safeKey = sanitizeSecureKey(key);
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(safeKey, value);
      }
      return;
    }
    await SecureStore.setItemAsync(safeKey, value, SECURE_STORE_OPTIONS);
  } catch {
    // Ignore secure store errors in restricted environments
  }
}

export async function secureDeleteItem(key: string): Promise<void> {
  const safeKey = sanitizeSecureKey(key);
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(safeKey);
      }
      return;
    }
    await SecureStore.deleteItemAsync(safeKey, SECURE_STORE_OPTIONS);
  } catch {
    // Ignore
  }
}

export async function secureClearKeys(keys: string[]): Promise<void> {
  await Promise.all(keys.map((k) => secureDeleteItem(k)));
}
