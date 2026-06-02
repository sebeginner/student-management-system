import type { UserRole } from '../../lib/auth-store';
import { roleLabels } from '../../lib/roleLabels';
import { menuLabels } from '../../lib/uiText';
import {
  ArrowRightLeft,
  BarChart3,
  ClipboardList,
  FilePenLine,
  GraduationCap,
  Home,
  MessageSquareWarning,
  School,
  Search,
  Settings2,
  ShieldCheck,
  UserCog,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface MenuItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

const menuByRole: Record<UserRole, MenuItem[]> = {
  ADMIN: [
    { label: menuLabels.dashboard, to: '/dashboard', icon: Home },
    { label: menuLabels.users, to: '/users', icon: UserCog },
    { label: menuLabels.roles, to: '/roles', icon: ShieldCheck },
    { label: menuLabels.parameters, to: '/parameters', icon: Settings2 },
  ],
  ACADEMIC_STAFF: [
    { label: menuLabels.dashboard, to: '/dashboard', icon: Home },
    { label: menuLabels.students, to: '/students', icon: GraduationCap },
    { label: menuLabels.classes, to: '/classes', icon: School },
    { label: menuLabels.teachers, to: '/teachers', icon: UserRound },
    { label: menuLabels.enrollments, to: '/enrollments', icon: Users },
    { label: menuLabels.transfer, to: '/transfer', icon: ArrowRightLeft },
    { label: menuLabels.teacherAssignments, to: '/teacher-assignments', icon: ClipboardList },
    { label: menuLabels.scores, to: '/scores', icon: Search },
    { label: menuLabels.scoreChangeRequests, to: '/score-change-requests', icon: MessageSquareWarning },
    { label: menuLabels.reports, to: '/reports', icon: BarChart3 },
    { label: menuLabels.parameters, to: '/parameters', icon: Settings2 },
  ],
  MANAGER: [
    { label: menuLabels.dashboard, to: '/dashboard', icon: Home },
    { label: menuLabels.students, to: '/students', icon: GraduationCap },
    { label: menuLabels.classes, to: '/classes', icon: School },
    { label: menuLabels.teachers, to: '/teachers', icon: UserRound },
    { label: menuLabels.teacherAssignments, to: '/teacher-assignments', icon: ClipboardList },
    { label: menuLabels.reports, to: '/reports', icon: BarChart3 },
    { label: menuLabels.parameters, to: '/parameters', icon: Settings2 },
  ],
  TEACHER: [
    { label: menuLabels.dashboard, to: '/dashboard', icon: Home },
    { label: menuLabels.teacherAssignments, to: '/my-assignments', icon: ClipboardList },
    { label: menuLabels.scoreEntry, to: '/score-entry', icon: FilePenLine },
    { label: menuLabels.scores, to: '/scores', icon: Search },
    { label: menuLabels.scoreChangeRequests, to: '/score-change-requests', icon: MessageSquareWarning },
    { label: menuLabels.reports, to: '/subject-report', icon: BarChart3 },
  ],
  STUDENT: [
    { label: menuLabels.dashboard, to: '/dashboard', icon: Home },
    { label: menuLabels.myProfile, to: '/my-profile', icon: UserRound },
    { label: menuLabels.scores, to: '/my-scores', icon: Search },
  ],
};

export const getMenuItemsByRole = (role: UserRole) => menuByRole[role];
export { roleLabels };
