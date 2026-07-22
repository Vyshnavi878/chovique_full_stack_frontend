/**
 * Demo Mock Data — used when VITE_DEMO_MODE=true or backend is unavailable.
 *
 * Provides pre-seeded accounts and fake token-based auth fully in localStorage.
 *
 * Demo accounts:
 *   customer@chovique.com / demo1234
 *   admin@chovique.com    / demo1234
 *   superadmin@chovique.com / demo1234
 *   (or Register any new account — stored in localStorage)
 */

import type { User, AuthResponse } from '../types';
import { setToken } from '../lib/api';

const DEMO_USERS_KEY = 'chovique_demo_users';
const DEMO_TOKEN_PREFIX = 'demo_token_';

// ─── Pre-seeded demo accounts ───────────────────────────────────────────────

const SEED_ACCOUNTS: User[] = [
  {
    id: 'demo-customer-1',
    name: 'Demo Customer',
    email: 'customer@chovique.com',
    role: 'customer',
    profile: {
      name: 'Demo Customer',
      email: 'customer@chovique.com',
      phone: '+91 98765 43210',
      avatar: 'DC',
      dob: '1995-06-15',
      gender: 'Female',
      preferences: 'Dark Chocolate',
      address: { street: '12, MG Road', city: 'Bangalore', state: 'Karnataka', zip: '560001' },
    },
  },
  {
    id: 'demo-admin-1',
    name: 'Admin User',
    email: 'admin@chovique.com',
    role: 'admin',
    profile: {
      name: 'Admin User',
      email: 'admin@chovique.com',
      phone: '+91 99887 76655',
      avatar: 'AU',
      address: { street: '45, Brigade Road', city: 'Bangalore', state: 'Karnataka', zip: '560025' },
    },
  },
  {
    id: 'demo-superadmin-1',
    name: 'Enterprise Chief',
    email: 'superadmin@chovique.com',
    role: 'superadmin',
    profile: {
      name: 'Enterprise Chief',
      email: 'superadmin@chovique.com',
      phone: '+91 88776 65544',
      avatar: 'EC',
      address: { street: '1, Chovique HQ', city: 'Mumbai', state: 'Maharashtra', zip: '400001' },
    },
  },
];

// ─── Storage Helpers ─────────────────────────────────────────────────────────

/** Load all registered users (seeded + user-registered) from localStorage */
const loadDemoUsers = (): (User & { password: string })[] => {
  try {
    const saved = localStorage.getItem(DEMO_USERS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  // First run: seed accounts with demo password
  const seeded = SEED_ACCOUNTS.map((u) => ({ ...u, password: 'demo1234' }));
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(seeded));
  return seeded;
};

const saveDemoUsers = (users: (User & { password: string })[]) => {
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
};

/** Generate a deterministic fake JWT for demo sessions */
const makeDemoToken = (userId: string): string =>
  `${DEMO_TOKEN_PREFIX}${userId}_${Date.now()}`;

/** Extract userId from a demo token */
export const extractDemoUserId = (token: string): string | null => {
  if (!token.startsWith(DEMO_TOKEN_PREFIX)) return null;
  const parts = token.slice(DEMO_TOKEN_PREFIX.length).split('_');
  // userId may itself contain hyphens — join all but last (timestamp)
  return parts.slice(0, -1).join('_');
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Demo login — matches email + password against localStorage users.
 * On success, persists the token and returns the same AuthResponse shape as the real backend.
 */
export const demoLogin = (email: string, password: string): AuthResponse => {
  const users = loadDemoUsers();
  const match = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!match) {
    throw new Error('Invalid email or password.');
  }
  const { password: _pw, ...user } = match;
  const token = makeDemoToken(user.id);
  setToken(token);
  return { access_token: token, token_type: 'bearer', user };
};

/**
 * Demo register — creates a new customer account in localStorage.
 * Rejects if email is already taken.
 */
export const demoRegister = (name: string, email: string, password: string): AuthResponse => {
  const users = loadDemoUsers();
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('An account with this email already exists.');
  }
  const newUser: User & { password: string } = {
    id: `demo-user-${Date.now()}`,
    name,
    email,
    role: 'customer',
    password,
    profile: {
      name,
      email,
      phone: '',
      avatar: name.substring(0, 2).toUpperCase(),
      address: { street: '', city: '', state: '', zip: '' },
    },
  };
  saveDemoUsers([...users, newUser]);
  const { password: _pw, ...user } = newUser;
  const token = makeDemoToken(user.id);
  setToken(token);
  return { access_token: token, token_type: 'bearer', user };
};

/**
 * Demo getMe — reconstructs the User from the stored demo token.
 */
export const demoGetMe = (token: string): User => {
  const userId = extractDemoUserId(token);
  if (!userId) throw new Error('Invalid demo token.');
  const users = loadDemoUsers();
  const match = users.find((u) => u.id === userId);
  if (!match) throw new Error('Demo user not found.');
  const { password: _pw, ...user } = match;
  return user;
};
