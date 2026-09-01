import { getToken } from '../storage/secureStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
}

let unauthorizedHandler: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void): () => void {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null;
  };
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Network request failed');
  }

  const text = await response.text();
  let json: { success?: boolean; data?: unknown; message?: string; error?: string } = {};
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      throw new ApiError(response.status, 'Unexpected response from server');
    }
  }

  if (!response.ok || json.success === false) {
    if (auth && response.status === 401) unauthorizedHandler?.();
    throw new ApiError(response.status, json.message ?? json.error ?? 'Request failed');
  }

  return json.data as T;
}
