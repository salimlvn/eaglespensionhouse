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

const ADMIN_STORAGE_KEY = 'eagles-pension-house-admin-session';

export const ADMIN_CREDENTIALS = {
  email: 'admin@eaglespensionhouse.com',
  password: 'Admin@123',
} as const;

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

export function setStoredAdminSession(session: AdminSession) {
  window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredAdminSession() {
  window.localStorage.removeItem(ADMIN_STORAGE_KEY);
}
