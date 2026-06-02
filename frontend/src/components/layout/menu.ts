import type { UserRole } from '../../lib/auth-store';

export interface MenuItem {
  label: string;
  to: string;
}

const menuByRole: Record<UserRole, MenuItem[]> = {
  ADMIN: [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Users', to: '/users' },
    { label: 'Roles', to: '/roles' },
  ],
  ACADEMIC_STAFF: [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Students', to: '/students' },
    { label: 'Classes', to: '/classes' },
    { label: 'Enrollments', to: '/enrollments' },
    { label: 'Teachers', to: '/teachers' },
    { label: 'Teacher Assignments', to: '/teacher-assignments' },
    { label: 'Scores', to: '/scores' },
    { label: 'Score Change Requests', to: '/score-change-requests' },
    { label: 'Reports', to: '/reports' },
  ],
  MANAGER: [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Students', to: '/students' },
    { label: 'Classes', to: '/classes' },
    { label: 'Teachers', to: '/teachers' },
    { label: 'Teacher Assignments', to: '/teacher-assignments' },
    { label: 'Reports', to: '/reports' },
  ],
  TEACHER: [
    { label: 'My Assignments', to: '/my-assignments' },
    { label: 'Score Entry', to: '/score-entry' },
    { label: 'Score Change Requests', to: '/score-change-requests' },
    { label: 'Class Report', to: '/class-report' },
    { label: 'Subject Report', to: '/subject-report' },
  ],
  STUDENT: [
    { label: 'My Profile', to: '/my-profile' },
    { label: 'My Scores', to: '/my-scores' },
  ],
};

export const getMenuItemsByRole = (role: UserRole) => menuByRole[role];

export const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Quan tri vien',
  ACADEMIC_STAFF: 'Giao vu',
  MANAGER: 'Ban giam hieu',
  TEACHER: 'Giao vien',
  STUDENT: 'Hoc sinh',
};
