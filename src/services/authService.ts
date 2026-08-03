/**
 * Auth Service — handles login, register, logout, OTP, forgot-password, and session refresh.
 *
 * Auth Strategy:
 *   - The backend sets httpOnly cookies (access_token, refresh_token) on login/register.
 *   - All API calls use credentials: 'include' so cookies are sent automatically.
 *   - No manual token storage or Bearer header is needed.
 *   - No demo mode, no localStorage auth fallbacks.
 */

import { apiGet, apiPost } from '../lib/api';
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

export const authService = {
  /**
   * Login — POST /auth/login.
   * Backend sets httpOnly access + refresh cookies on success.
   */
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    return apiPost<AuthResponse>('/auth/login', {
      email: payload.email,
      password: payload.password,
    });
  },

  /**
   * Register — Step 1: POST /auth/register.
   * Sends OTP to the user's email. No account is created at this point.
   */
  register: async (payload: RegisterPayload): Promise<SendOtpResponse> => {
    return apiPost<SendOtpResponse>('/auth/register', {
      full_name: payload.name,
      email: payload.email,
      password: payload.password,
      confirm_password: payload.confirmPassword,
    });
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
  forgotPassword: async (email: string): Promise<{ message: string; dev_otp?: string }> => {
    return apiPost<{ message: string; dev_otp?: string }>('/auth/forgot-password', { email });
  },


  /**
   * Resend forgot-password OTP.
   */
  resendForgotOtp: async (email: string): Promise<{ message: string; dev_otp?: string }> => {
    return apiPost<{ message: string; dev_otp?: string }>('/auth/resend-forgot-otp', { email });
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
   * Set password for OAuth / Google users who don't have a password yet — POST /auth/set-password.
   */
  setPassword: async (password: string, confirmPassword: string): Promise<AuthResponse> => {
    return apiPost<AuthResponse>('/auth/set-password', {
      password,
      confirm_password: confirmPassword,
    });
  },

  /**
   * Logout — clears server-side session (cookie).
   * Best-effort: even if server logout fails, session cookie will eventually expire.
   */
  logout: async (): Promise<void> => {
    try {
      await apiPost<void>('/auth/logout');
    } catch {
      // Best-effort: even if server logout fails, the cookie will expire
    }
  },

  /**
   * Refresh access token using the httpOnly refresh cookie.
   * The backend replaces both cookies on success.
   */
  refreshToken: async (): Promise<{ message: string }> => {
    return apiPost<{ message: string }>('/auth/refresh');
  },

  /**
   * Fetch authenticated user's profile.
   * Uses httpOnly cookie session — no token needed from localStorage.
   * Returns null-equivalent if not authenticated (401 redirects to /login).
   */
  getMe: async (): Promise<User> => {
    return apiGet<User>('/users/me');
  },
};
