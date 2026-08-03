/**
 * Centralized API client for Chovique frontend.
 * Connects to a FastAPI backend. Base URL is configured via VITE_API_URL env var.
 *
 * Auth Strategy:
 *  - The backend sets httpOnly cookies (access_token, refresh_token) on login/register.
 *  - All requests use credentials: 'include' so cookies are sent automatically.
 *  - NO JWT stored in localStorage. NO Bearer token header injection.
 *  - 401 → redirect to /login (session expired or not authenticated).
 */

export const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000/api/v1';

/** Build default headers — JSON only, no auth header (cookies handle auth) */
const buildHeaders = (isFormData = false): HeadersInit => {
  if (isFormData) return {};
  return { 'Content-Type': 'application/json' };
};

/** Handle 401 Unauthorized globally — skip redirect for session rehydration (/users/me) or public pages */
const handleUnauthorized = (path?: string): void => {
  if (path && path.includes('/users/me')) {
    return;
  }
  const { pathname } = window.location;
  const publicPages = ['/', '/shop', '/our-story', '/contact', '/product', '/cart', '/wishlist', '/login', '/register', '/forgot-password', '/reset-password', '/verify-otp'];
  const isPublicPage = publicPages.some((p) => pathname === p || (p !== '/' && pathname.startsWith(p)));
  if (!isPublicPage) {
    window.location.href = '/login';
  }
};

/** Generic API error */
export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

/** Parse error response from FastAPI */
const parseError = async (response: Response): Promise<ApiError> => {
  try {
    const data = await response.json();
    const detail =
      typeof data.detail === 'string'
        ? data.detail
        : JSON.stringify(data.detail) || 'An unexpected error occurred';
    return new ApiError(response.status, detail);
  } catch {
    return new ApiError(response.status, response.statusText || 'An unexpected error occurred');
  }
};

const safeFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  try {
    return await fetch(input, init);
  } catch (err: unknown) {
    throw new ApiError(
      0,
      'Unable to connect to the backend API server. Please verify that the FastAPI backend is running on http://localhost:8000.'
    );
  }
};

let refreshPromise: Promise<boolean> | null = null;

const fetchWithAuth = async (path: string, init: RequestInit): Promise<Response> => {
  let response = await safeFetch(`${BASE_URL}${path}`, init);

  if (
    response.status === 401 && 
    !path.includes('/auth/refresh') && 
    !path.includes('/auth/login') && 
    !path.includes('/auth/register')
  ) {
    if (!refreshPromise) {
      refreshPromise = safeFetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: buildHeaders(),
        credentials: 'include',
      }).then(res => {
        refreshPromise = null;
        return res.ok;
      }).catch(() => {
        refreshPromise = null;
        return false;
      });
    }

    const refreshSuccess = await refreshPromise;
    if (refreshSuccess) {
      // Retry original request
      response = await safeFetch(`${BASE_URL}${path}`, init);
    }
  }

  if (response.status === 401) {
    handleUnauthorized(path);
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  return response;
};

/** Core GET request */
export const apiGet = async <T>(path: string): Promise<T> => {
  const response = await fetchWithAuth(path, {
    method: 'GET',
    headers: buildHeaders(),
    credentials: 'include',
  });
  return response.json() as Promise<T>;
};

/** GET request that returns text/html */
export const apiGetHtml = async (path: string): Promise<string> => {
  const response = await fetchWithAuth(path, {
    method: 'GET',
    headers: { 'Accept': 'text/html' },
    credentials: 'include',
  });
  return response.text();
};

/** Core POST request (JSON body) */
export const apiPost = async <T>(path: string, body?: unknown): Promise<T> => {
  const response = await fetchWithAuth(path, {
    method: 'POST',
    headers: buildHeaders(),
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
};

/** Core POST request with FormData (multipart/form-data) */
export const apiPostFormData = async <T>(path: string, formData: FormData): Promise<T> => {
  const response = await fetchWithAuth(path, {
    method: 'POST',
    headers: buildHeaders(true),
    credentials: 'include',
    body: formData,
  });
  return response.json() as Promise<T>;
};

/** Core PATCH request (JSON body) */
export const apiPatch = async <T>(path: string, body?: unknown): Promise<T> => {
  const response = await fetchWithAuth(path, {
    method: 'PATCH',
    headers: buildHeaders(),
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return response.json() as Promise<T>;
};

/** Core PUT request (JSON body) */
export const apiPut = async <T>(path: string, body?: unknown): Promise<T> => {
  const response = await fetchWithAuth(path, {
    method: 'PUT',
    headers: buildHeaders(),
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return response.json() as Promise<T>;
};

/** Core DELETE request */
export const apiDelete = async <T>(path: string): Promise<T> => {
  const response = await fetchWithAuth(path, {
    method: 'DELETE',
    headers: buildHeaders(),
    credentials: 'include',
  });

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
};

