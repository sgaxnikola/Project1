export type ApiError = { message?: string };

const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as ApiError;
    return data?.message || res.statusText || 'Request failed';
  } catch {
    return res.statusText || 'Request failed';
  }
}

export async function apiRequest<T>(
  path: string,
  opts: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, headers, ...rest } = opts;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  });

  if (!res.ok) {
    const msg = await readErrorMessage(res);
    throw new Error(msg);
  }

  // 204
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

export function apiUrl() {
  return BASE_URL;
}
