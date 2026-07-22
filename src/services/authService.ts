/**
 * Auth Service — handles login, register, logout, and token verification.
 * Supports backend API and demo mode fallback.
 */

import { apiGet, apiPost, setToken, clearToken, ApiError, getToken } from '../lib/api';
import { demoLogin, demoRegister, demoGetMe } from '../lib/demoAuth';
import type { User, LoginPayload, RegisterPayload, AuthResponse, SendOtpPayload, VerifyOtpPayload, SendOtpResponse, GoogleAuthResponse } from '../types';

/** True when explicitly set OR when we detect the backend is unreachable */
const DEMO_MODE = (import.meta.env.VITE_DEMO_MODE as string) === 'true';

/** Check if a stored token is a demo token */
const isDemoToken = (token: string | null): boolean =>
  token !== null && token.startsWith('demo_token_');

export const authService = {
  /**
   * Login — tries backend first; falls back to demo mode on network failure.
   */
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    if (DEMO_MODE) {
      return demoLogin(payload.email, payload.password);
    }

    const formBody = new URLSearchParams({
      username: payload.email,
      password: payload.password,
    });

    const baseUrl =
      (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000/api/v1';

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody,
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      console.warn('[Chovique] Backend unreachable — using demo mode auth.');
      return demoLogin(payload.email, payload.password);
    }

    if (!response.ok) {
      let detail = 'Invalid email or password.';
      try {
        const data = await response.json();
        detail = typeof data.detail === 'string' ? data.detail : detail;
      } catch {
        // use default message
      }
      throw new ApiError(response.status, detail);
    }

    const data = (await response.json()) as AuthResponse;
    setToken(data.access_token);
    return data;
  },

  /**
   * Register — tries backend first; falls back to demo mode on network failure.
   */
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    if (DEMO_MODE) {
      return demoRegister(payload.name, payload.email, payload.password);
    }

    try {
      const data = await apiPost<AuthResponse>('/auth/register', payload);
      setToken(data.access_token);
      return data;
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.warn('[Chovique] Backend unreachable — using demo mode registration.');
        return demoRegister(payload.name, payload.email, payload.password);
      }
      throw err;
    }
  },

  /**
   * Send OTP code to user email during registration.
   */
  sendOtp: async (payload: SendOtpPayload): Promise<SendOtpResponse> => {
    return apiPost<SendOtpResponse>('/auth/send-otp', payload);
  },

  /**
   * Verify 6-digit OTP code (30s expiry) and complete registration.
   * Stores JWT token in localStorage on success.
   */
  verifyOtp: async (payload: VerifyOtpPayload): Promise<AuthResponse> => {
    const data = await apiPost<AuthResponse>('/auth/verify-otp', payload);
    setToken(data.access_token);
    return data;
  },

  /**
   * Resend a fresh 6-digit OTP code to email.
   */
  resendOtp: async (email: string): Promise<SendOtpResponse> => {
    return apiPost<SendOtpResponse>('/auth/resend-otp', { email });
  },

  /**
   * Google Sign-In — exchange a Google id_token for a Chovique JWT or OTP requirement.
   */
  googleSignIn: async (idToken: string): Promise<GoogleAuthResponse> => {
    const data = await apiPost<GoogleAuthResponse>('/auth/google', { id_token: idToken });
    if (data.access_token) {
      setToken(data.access_token);
    }
    return data;
  },

  /**
   * Logout — clears token locally and optionally invalidates server-side.
   */
  logout: async (): Promise<void> => {
    const token = getToken();
    if (isDemoToken(token)) {
      clearToken();
      return;
    }
    try {
      await apiPost<void>('/auth/logout');
    } catch {
      // Even if server-side logout fails, clear local token
    } finally {
      clearToken();
    }
  },

  /**
   * Fetch authenticated user's profile.
   */
  getMe: async (): Promise<User> => {
    const token = getToken();
    if (isDemoToken(token!)) {
      return demoGetMe(token!);
    }
    return apiGet<User>('/users/me');
  },
};
