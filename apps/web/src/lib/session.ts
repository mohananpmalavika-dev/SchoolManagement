export const teacherRoles = ['TEACHER', 'CLASS_TEACHER', 'EXAM_OFFICER'];
export const schoolRoles = ['SCHOOL_OWNER', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'SCHOOL_ADMIN', 'ACCOUNTANT', 'LIBRARIAN', 'TRANSPORT_OFFICER', 'RECEPTIONIST', 'AUDITOR'];
export const predictiveAnalyticsRoles = ['SCHOOL_OWNER', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'SCHOOL_ADMIN'];
export function homeForRole(role: string) {
  if (role === 'SUPER_ADMIN') return '/admin/dashboard';
  if (teacherRoles.includes(role)) return '/teacher/dashboard';
  if (schoolRoles.includes(role)) return '/school/dashboard';
  if (role === 'STUDENT') return '/student/dashboard';
  return '/dashboard';
}
export function clearSession() {
  for (const key of ['user', 'accessToken', 'refreshToken', 'adminToken', 'adminUser']) localStorage.removeItem(key);
}
