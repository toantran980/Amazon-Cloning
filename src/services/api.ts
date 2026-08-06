const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

let isRefreshing = false;

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

  let res = await fetch(`${BASE}${path}`, fetchOptions);

  if (res.status === 401 && !path.includes('/auth/refresh') && !path.includes('/auth/login')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          if (data.token) {
            localStorage.setItem('token', data.token);
            // Retry original request with new token
            headers['Authorization'] = `Bearer ${data.token}`;
            res = await fetch(`${BASE}${path}`, { ...options, headers, credentials: 'include' });
          }
        } else {
          localStorage.removeItem('token');
          window.dispatchEvent(new Event('auth:logout'));
        }
      } catch {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('auth:logout'));
      } finally {
        isRefreshing = false;
      }
    }
  }

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth:logout'));
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
