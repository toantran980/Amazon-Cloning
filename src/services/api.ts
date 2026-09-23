const BASE = '/api';

const REQUEST_TIMEOUT_MS = 15 * 1000;

function getToken(): string | null {
  return localStorage.getItem('token');
}

// All in-flight requests are tracked so a logout can abort them immediately
// instead of letting them finish against a session that no longer exists.
const inflight = new Set<AbortController>();

function clearSession(): void {
  inflight.forEach((controller) => controller.abort());
  inflight.clear();
  localStorage.removeItem('token');
  window.dispatchEvent(new Event('auth:logout'));
}

// Shared in-flight refresh so concurrent 401s await the same promise instead of
// racing each other and force-logging the user out.
let refreshPromise: Promise<string | null> | null = null;

function shouldAttemptRefresh(path: string): boolean {
  return (
    !path.includes('/auth/refresh') &&
    !path.includes('/auth/login') &&
    !path.includes('/auth/logout')
  );
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.token) return null;
        localStorage.setItem('token', data.token);
        return data.token as string;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

// Wraps fetch with per-request timeout + abort-on-logout. A caller-provided
// signal is merged in via AbortSignal.any (modern browsers + Node 20+).
function fetchWithLifecycle(input: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  inflight.add(controller);

  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const externalSignal = init.signal;
  const signal = externalSignal && typeof AbortSignal.any === 'function'
    ? AbortSignal.any([controller.signal, externalSignal])
    : controller.signal;

  return fetch(input, { ...init, signal }).finally(() => {
    clearTimeout(timeout);
    inflight.delete(controller);
  });
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Include HttpOnly cookies for refresh token rotation
  };

  let res = await fetchWithLifecycle(`${BASE}${path}`, fetchOptions);

  if (res.status === 401 && shouldAttemptRefresh(path)) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Retry original request with the fresh token.
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetchWithLifecycle(`${BASE}${path}`, { ...options, headers, credentials: 'include' });
    }
  }

  if (res.status === 401) {
    clearSession();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};