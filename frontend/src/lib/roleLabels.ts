import type { UserRole } from './auth-store';

export const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Quản trị viên',
  ACADEMIC_STAFF: 'Giáo vụ',
  MANAGER: 'Ban giám hiệu',
  TEACHER: 'Giáo viên',
  STUDENT: 'Học sinh',
};
