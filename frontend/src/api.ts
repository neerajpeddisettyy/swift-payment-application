/** Provides authenticated HTTP calls and token management for the backend API. */
import type { AuthResponse, LedgerTx, TransferResult, UserLookup, Wallet } from './types';

const TOKEN_KEY = 'swift.token';
let token: string | null = localStorage.getItem(TOKEN_KEY);

export function getToken(): string | null {
  return token;
}

export function setToken(value: string | null): void {
  token = value;
  if (value) {
    localStorage.setItem(TOKEN_KEY, value);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function handleUnauthorized(status: number): void {
  // Expired / invalid token -> tell the App to show the login screen again.
  if (status === 401 && token) {
    setToken(null);
    window.dispatchEvent(new Event('swift:unauthorized'));
  }
}

async function errorFrom(res: Response): Promise<ApiError> {
  let message = res.statusText || 'Request failed';
  try {
    const body = await res.json();
    if (body && typeof body.message === 'string') message = body.message;
  } catch {
    /* body was not JSON - keep the default message */
  }
  return new ApiError(res.status, message);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`/api${path}`, { ...init, headers });
  if (!res.ok) {
    handleUnauthorized(res.status);
    throw await errorFrom(res);
  }
  return (await res.json()) as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (fullName: string, email: string, handle: string, password: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, handle, password }),
    }),

  wallet: () => request<Wallet>('/wallets/me'),

  setFrozen: (frozen: boolean) =>
    request<Wallet>('/wallets/card/freeze', {
      method: 'PATCH',
      body: JSON.stringify({ frozen }),
    }),

  setLimit: (limit: number) =>
    request<Wallet>('/wallets/card/limit', {
      method: 'PATCH',
      body: JSON.stringify({ limit }),
    }),

  ledger: () => request<LedgerTx[]>('/transactions?limit=200'),

  lookup: (handle: string) =>
    request<UserLookup>(`/users/lookup?handle=${encodeURIComponent(handle)}`),

  /**
   * Sends money. The server answers 200 (success) or 422 (rejected, e.g. card frozen).
   * Both carry a TransferResult body, so we return it for both and only throw on real errors.
   */
  transfer: async (
    idempotencyKey: string,
    body: { receiverHandle: string; amount: number; note?: string },
  ): Promise<TransferResult> => {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    });
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch('/api/transfers', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (res.ok || res.status === 422) {
      return (await res.json()) as TransferResult;
    }
    handleUnauthorized(res.status);
    throw await errorFrom(res);
  },
};
