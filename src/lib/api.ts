/**
 * Centralized API client for Chovique frontend.
 * Connects to a FastAPI backend. Base URL is configured via VITE_API_URL env var.
 *
 * Responsibilities:
 *  - Attach Authorization: Bearer <token> header to every request
 *  - Handle 401 → clear token + redirect to /login
 *  - Return typed responses
 */

const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000/api/v1';

const TOKEN_KEY = 'chovique_token';

/** Retrieve stored JWT token */
export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

/** Persist JWT token after login */
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);

/** Remove JWT token on logout */
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

/** Build default headers, injecting Bearer token when available */
const buildHeaders = (isFormData = false): HeadersInit => {
  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/** Handle 401 Unauthorized globally */
const handleUnauthorized = (): void => {
  clearToken();
  localStorage.removeItem('chovique_user');
  localStorage.removeItem('chovique_role');
  window.location.href = '/login';
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

/** Core GET request */
export const apiGet = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: buildHeaders(),
  });

  if (response.status === 401) {
    handleUnauthorized();
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  return response.json() as Promise<T>;
};

/** Core POST request (JSON body) */
export const apiPost = async <T>(path: string, body?: unknown): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: buildHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    handleUnauthorized();
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  return response.json() as Promise<T>;
};

/** Core POST request with FormData (multipart/form-data) */
export const apiPostFormData = async <T>(path: string, formData: FormData): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: buildHeaders(true), // no Content-Type; browser sets it with boundary
    body: formData,
  });

  if (response.status === 401) {
    handleUnauthorized();
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  return response.json() as Promise<T>;
};

/** Core PATCH request (JSON body) */
export const apiPatch = async <T>(path: string, body?: unknown): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    handleUnauthorized();
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  return response.json() as Promise<T>;
};

/** Core PUT request (JSON body) */
export const apiPut = async <T>(path: string, body?: unknown): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    handleUnauthorized();
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  return response.json() as Promise<T>;
};

/** Core DELETE request */
export const apiDelete = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });

  if (response.status === 401) {
    handleUnauthorized();
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  // Some DELETE endpoints return 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};
