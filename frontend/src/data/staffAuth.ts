// Staff session shape used by the temporary local staff login.
export type StaffSession = {
  role: 'staff';
  name: string;
  email: string;
  sessionToken: string;
};

type StaffLoginPayload = {
  email: string;
  password: string;
};

// Store staff login separately from guest login.
const STAFF_STORAGE_KEY = 'eagles-pension-house-staff-session';
const LEGACY_ADMIN_STORAGE_KEY = 'eagles-pension-house-admin-session';

// Temporary static staff credentials until staff management is added.
export const STAFF_CREDENTIALS = {
  email: 'staff@eaglespensionhouse.com',
  password: 'Staff@123',
} as const;

const LEGACY_ADMIN_CREDENTIALS = {
  email: 'admin@eaglespensionhouse.com',
  password: 'Admin@123',
} as const;

const STAFF_LOGIN_OPTIONS = [STAFF_CREDENTIALS, LEGACY_ADMIN_CREDENTIALS] as const;

// Check whether the login attempt belongs to the local staff flow.
export function isStaffEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  return STAFF_LOGIN_OPTIONS.some((credentials) => credentials.email === normalizedEmail);
}

// Validate the static staff credentials and create a lightweight staff session.
export function loginStaff(payload: StaffLoginPayload): StaffSession {
  const email = payload.email.trim().toLowerCase();
  const matchingCredentials = STAFF_LOGIN_OPTIONS.find((credentials) => credentials.email === email);

  if (!matchingCredentials || payload.password !== matchingCredentials.password) {
    throw new Error('Invalid staff email or password.');
  }

  return {
    role: 'staff',
    name: 'Staff',
    email: matchingCredentials.email,
    sessionToken: `staff-static-${Date.now()}`,
  };
}

// Restore a staff session from localStorage.
export function getStoredStaffSession() {
  try {
    const raw = window.localStorage.getItem(STAFF_STORAGE_KEY) || window.localStorage.getItem(LEGACY_ADMIN_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return normalizeStoredStaffSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

// Persist the current staff session.
export function setStoredStaffSession(session: StaffSession) {
  window.localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(session));
  window.localStorage.removeItem(LEGACY_ADMIN_STORAGE_KEY);
}

// Remove the staff session during logout.
export function clearStoredStaffSession() {
  window.localStorage.removeItem(STAFF_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_ADMIN_STORAGE_KEY);
}

function normalizeStoredStaffSession(value: unknown): StaffSession | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const session = value as Partial<StaffSession>;

  if (!session.email || !session.sessionToken) {
    return null;
  }

  return {
    role: 'staff',
    name: session.name === 'Admin' ? 'Staff' : session.name || 'Staff',
    email: session.email,
    sessionToken: session.sessionToken,
  };
}
