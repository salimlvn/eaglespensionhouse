// Admin session shape used by the temporary local admin login.
export type AdminSession = {
  role: 'admin';
  name: string;
  email: string;
  sessionToken: string;
};

type AdminLoginPayload = {
  email: string;
  password: string;
};

// Store admin login separately from guest login.
const ADMIN_STORAGE_KEY = 'eagles-pension-house-admin-session';

// Temporary static admin credentials until staff/admin management is added.
export const ADMIN_CREDENTIALS = {
  email: 'admin@eaglespensionhouse.com',
  password: 'Admin@123',
} as const;

// Validate the static admin credentials and create a lightweight admin session.
export function loginAdmin(payload: AdminLoginPayload): AdminSession {
  const email = payload.email.trim().toLowerCase();

  if (email !== ADMIN_CREDENTIALS.email || payload.password !== ADMIN_CREDENTIALS.password) {
    throw new Error('Invalid admin email or password.');
  }

  return {
    role: 'admin',
    name: 'Admin',
    email: ADMIN_CREDENTIALS.email,
    sessionToken: `admin-static-${Date.now()}`,
  };
}

// Restore an admin session from localStorage.
export function getStoredAdminSession() {
  try {
    const raw = window.localStorage.getItem(ADMIN_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

// Persist the current admin session.
export function setStoredAdminSession(session: AdminSession) {
  window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(session));
}

// Remove the admin session during logout.
export function clearStoredAdminSession() {
  window.localStorage.removeItem(ADMIN_STORAGE_KEY);
}
