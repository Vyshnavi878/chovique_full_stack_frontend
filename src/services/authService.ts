/**
 * Auth Service — handles login, register, logout, OTP, forgot-password, and session refresh.
 * Supports backend API and demo mode fallback.
 *
 * Auth Strategy:
 *   - The backend sets httponly cookies (access_token, refresh_token) on login/register.
 *   - All API calls use `credentials: 'include'` so cookies are sent automatically.
 *   - No manual token storage or Bearer header is needed for cookie-based auth.
 *   - Demo mode stores a fake token string in localStorage for non-backend testing.
 */

import { apiGet, apiPost, clearToken, getToken } from '../lib/api';
import { demoLogin, demoRegister, demoGetMe } from '../lib/demoAuth';
import type {
  User,
  LoginPayload,
  RegisterPayload,
  AuthResponse,
  SendOtpPayload,
  VerifyOtpPayload,
  SendOtpResponse,
  GoogleAuthResponse,
} from '../types';

/** True when explicitly set in .env */
const DEMO_MODE = (import.meta.env.VITE_DEMO_MODE as string) === 'true';

/** Check if a stored token is a demo token */
const isDemoToken = (token: string | null): boolean =>
  token !== null && token.startsWith('demo_token_');

export const authService = {
  /**
   * Login — tries backend first; falls back to demo mode on network failure.
   * Auth is via httponly cookies set by the backend, not a token in the response body.
   */
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    if (DEMO_MODE) {
      return demoLogin(payload.email, payload.password);
    }

    try {
      return await apiPost<AuthResponse>('/auth/login', {
        email: payload.email,
        password: payload.password,
      });
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.warn('[Chovique] Backend unreachable — using demo mode auth.');
        return demoLogin(payload.email, payload.password);
      }
      throw err;
    }
  },

  /**
   * Register — Step 1 of the two-step signup flow: sends an OTP to the
   * user's email. No account is created at this point.
   */
  register: async (payload: RegisterPayload): Promise<SendOtpResponse> => {
    if (DEMO_MODE) {
      await demoRegister(payload.name, payload.email, payload.password);
      return { message: 'OTP sent successfully.', email: payload.email, expires_in: 30 };
    }

    try {
      return await apiPost<SendOtpResponse>('/auth/register', {
        full_name: payload.name,
        email: payload.email,
        password: payload.password,
        confirm_password: payload.confirmPassword,
      });
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.warn('[Chovique] Backend unreachable — using demo mode registration.');
        await demoRegister(payload.name, payload.email, payload.password);
        return { message: 'OTP sent successfully.', email: payload.email, expires_in: 30 };
      }
      throw err;
    }
  },

  /**
   * Send OTP — alias for register step (backend sends OTP on /auth/register).
   */
  sendOtp: async (payload: SendOtpPayload): Promise<SendOtpResponse> => {
    return apiPost<SendOtpResponse>('/auth/register', {
      full_name: payload.name,
      email: payload.email,
      password: payload.password,
      confirm_password: payload.confirmPassword,
    });
  },

  /**
   * Verify 6-digit OTP and complete registration.
   * Backend sets auth cookies and returns the created User.
   */
  verifyOtp: async (payload: VerifyOtpPayload): Promise<AuthResponse> => {
    return apiPost<AuthResponse>('/auth/verify-otp', {
      email: payload.email,
      otp: payload.otp,
      full_name: payload.fullName,
      password: payload.password,
    });
  },

  /**
   * Resend registration OTP.
   */
  resendOtp: async (email: string): Promise<SendOtpResponse> => {
    return apiPost<SendOtpResponse>('/auth/resend-otp', { email });
  },

  /**
   * Forgot password — sends reset OTP to email.
   */
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return apiPost<{ message: string }>('/auth/forgot-password', { email });
  },

  /**
   * Verify forgot-password OTP before resetting.
   */
  verifyForgotPasswordOtp: async (
    email: string,
    otp: string
  ): Promise<{ message: string }> => {
    return apiPost<{ message: string }>('/auth/forgot-password/verify', { email, otp });
  },

  /**
   * Resend forgot-password OTP.
   */
  resendForgotOtp: async (email: string): Promise<{ message: string }> => {
    return apiPost<{ message: string }>('/auth/resend-forgot-otp', { email });
  },

  /**
   * Reset password using OTP token.
   */
  resetPassword: async (
    email: string,
    otp: string,
    password: string,
    confirmPassword: string
  ): Promise<{ message: string }> => {
    return apiPost<{ message: string }>('/auth/reset-password', {
      email,
      otp,
      password,
      confirm_password: confirmPassword,
    });
  },

  /**
   * Change password (authenticated user).
   */
  changePassword: async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{ message: string }> => {
    return apiPost<{ message: string }>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
  },

  /**
   * Google Sign-In — exchange a Google id_token for a Chovique session.
   */
  googleSignIn: async (idToken: string): Promise<GoogleAuthResponse> => {
    return apiPost<GoogleAuthResponse>('/auth/google', { id_token: idToken });
  },

  /**
   * Logout — clears server-side session (cookie) and local state.
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
      // Best-effort: even if server logout fails, clear local state
    } finally {
      clearToken();
    }
  },

  /**
   * Refresh access token using the httponly refresh cookie.
   * The backend replaces both cookies on success.
   */
  refreshToken: async (): Promise<{ message: string }> => {
    return apiPost<{ message: string }>('/auth/refresh');
  },

  /**
   * Fetch authenticated user's profile.
   * Uses httponly cookie session — no token needed from localStorage.
   * Backend now returns the nested { id, name, email, role, profile: {...} } shape.
   */
  getMe: async (): Promise<User> => {
    const token = getToken();
    if (isDemoToken(token!)) {
      return demoGetMe(token!);
    }
    return apiGet<User>('/users/me');
  },
};
