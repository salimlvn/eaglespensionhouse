export type AuthUser = {
  userId: number;
  fullName: string;
  email: string;
  contactNumber: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  sessionToken: string;
  user: AuthUser;
};

type LoginPayload = {
  email: string;
  password: string;
};

type SignupPayload = {
  fullName: string;
  email: string;
  contactNumber: string;
  password: string;
  confirmPassword: string;
};

type LoginResponse = {
  message: string;
  sessionToken: string;
  user: AuthUser;
};

type SignupResponse = {
  message: string;
  user: AuthUser;
  sessionToken?: string;
};

const STORAGE_KEY = 'eagles-pension-house-session';
const SIGNUP_FLASH_KEY = 'eagles-pension-house-signup-flash';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
export const AUTH_FIELD_LIMITS = {
  fullName: 120,
  email: 255,
  contactNumber: 30,
} as const;
export const PASSWORD_RULES_MESSAGE =
  'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.';

async function apiRequest<T extends { message: string }>(path: string, body: LoginPayload | SignupPayload) {
  let response: Response;

  try {
    response = await fetch(resolveApiUrl(path), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Cannot reach the auth server. Make sure the backend is running and the API URL is configured correctly.');
  }

  const payload = (await response.json().catch(() => null)) as T | { message?: string } | null;

  if (!response.ok) {
    throw new Error(payload?.message || 'Request failed. Please try again.');
  }

  return payload as T;
}

export async function loginUser(payload: LoginPayload) {
  const response = await apiRequest<LoginResponse>('/api/auth/login', payload);
  return toSession(response);
}

export async function signupUser(payload: SignupPayload) {
  return apiRequest<SignupResponse>('/api/auth/signup', payload);
}

export function getStoredSession() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function setStoredSession(session: AuthSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function isStrongPassword(password: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
}

export function setSignupSuccessState(email: string) {
  window.sessionStorage.setItem(
    SIGNUP_FLASH_KEY,
    JSON.stringify({
      email: email.trim().toLowerCase(),
      message: 'Account created successfully. Please log in with your new password.',
    }),
  );
}

export function consumeSignupSuccessState() {
  const raw = window.sessionStorage.getItem(SIGNUP_FLASH_KEY);

  if (!raw) {
    return null;
  }

  window.sessionStorage.removeItem(SIGNUP_FLASH_KEY);

  try {
    return JSON.parse(raw) as { email: string; message: string };
  } catch {
    return null;
  }
}

function toSession(response: LoginResponse): AuthSession {
  return {
    sessionToken: response.sessionToken,
    user: response.user,
  };
}

function resolveApiUrl(path: string) {
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  if (API_BASE_URL === '/api') {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}
