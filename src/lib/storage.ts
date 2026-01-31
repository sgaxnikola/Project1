export const STORAGE_KEYS = {
  user: 'auth_user',
  token: 'auth_token',
  // OpenAI API key stays client-side only
  openaiApiKey: 'openai_api_key',
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export function readJson<T>(key: StorageKey, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: StorageKey, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / privacy errors
  }
}

export function readString(key: StorageKey, fallback: string | null = null): string | null {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeString(key: StorageKey, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function removeKey(key: StorageKey): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
