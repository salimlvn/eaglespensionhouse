export {
  STAFF_CREDENTIALS as ADMIN_CREDENTIALS,
  clearStoredStaffSession as clearStoredAdminSession,
  getStoredStaffSession as getStoredAdminSession,
  isStaffEmail,
  loginStaff as loginAdmin,
  setStoredStaffSession as setStoredAdminSession,
  type StaffSession as AdminSession,
} from './staffAuth';
