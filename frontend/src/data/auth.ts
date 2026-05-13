// User shape returned by the backend auth endpoints.
export type AuthUser = {
  userId: number;
  fullName: string;
  email: string;
  contactNumber: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// Guest session stored in localStorage after login.
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

// Storage keys keep guest sessions and signup flash messages separate.
const STORAGE_KEY = 'eagles-pension-house-session';
const SIGNUP_FLASH_KEY = 'eagles-pension-house-signup-flash';

// Use the Vite proxy by default, or an absolute backend URL when configured.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

// Match frontend field limits to the backend and SQL schema.
export const AUTH_FIELD_LIMITS = {
  fullName: 120,
  email: 255,
  contactNumber: 30,
} as const;

// Shared password rule message for signup validation.
export const PASSWORD_RULES_MESSAGE =
  'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.';

// Send an auth request and normalize backend/network errors.
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

// Log in a guest account and convert the response to the app session shape.
export async function loginUser(payload: LoginPayload) {
  const response = await apiRequest<LoginResponse>('/api/auth/login', payload);
  return toSession(response);
}

// Create a guest account through the backend.
export async function signupUser(payload: SignupPayload) {
  return apiRequest<SignupResponse>('/api/auth/signup', payload);
}

// Restore a saved guest session, ignoring invalid localStorage data.
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

// Persist the current guest session in the browser.
export function setStoredSession(session: AuthSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

// Remove the guest session during logout.
export function clearStoredSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}

// Check the same strong password rule used by the backend.
export function isStrongPassword(password: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
}

// Save a one-time message for the login page after signup succeeds.
export function setSignupSuccessState(email: string) {
  window.sessionStorage.setItem(
    SIGNUP_FLASH_KEY,
    JSON.stringify({
      email: email.trim().toLowerCase(),
      message: 'Account created successfully. Please log in with your new password.',
    }),
  );
}

// Read and clear the one-time signup success message.
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

// Keep only the fields the frontend needs from the login response.
function toSession(response: LoginResponse): AuthSession {
  return {
    sessionToken: response.sessionToken,
    user: response.user,
  };
}

// Build request URLs for either proxied or direct API calls.
function resolveApiUrl(path: string) {
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  if (API_BASE_URL === '/api') {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}
