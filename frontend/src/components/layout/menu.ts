import type { UserRole } from '../../lib/auth-store';
import { roleLabels } from '../../lib/roleLabels';
import { menuLabels } from '../../lib/uiText';
import {
  ArrowRightLeft,
  BarChart3,
  Bell,
  BookCheck,
  BookOpen,
  BookText,
  CalendarDays,
  ClipboardList,
  FilePenLine,
  GraduationCap,
  History,
  Home,
  Layers,
  MessageSquareWarning,
  School,
  Search,
  Settings2,
  ShieldCheck,
  Trophy,
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
  // ── ADMIN: quản trị hệ thống ────────────────────────────────
  ADMIN: [
    { label: menuLabels.dashboard,  to: '/dashboard',  icon: Home      },
    { label: menuLabels.users,      to: '/users',       icon: UserCog   },
    { label: menuLabels.roles,      to: '/roles',       icon: ShieldCheck },
    { label: menuLabels.parameters, to: '/parameters',  icon: Settings2 },
    { label: menuLabels.auditLogs,  to: '/audit-logs',  icon: History   },
    { label: 'Thông báo',           to: '/notifications', icon: Bell    },
  ],

  // ── ACADEMIC_STAFF: giáo vụ ─────────────────────────────────
  ACADEMIC_STAFF: [
    { label: menuLabels.dashboard, to: '/dashboard', icon: Home },
    // Cấu trúc học vụ
    { label: 'Năm học',             to: '/academic-years',       icon: BookOpen    },
    { label: 'Học kỳ',              to: '/semesters',            icon: CalendarDays },
    { label: 'Khối lớp',            to: '/grade-levels',         icon: Layers      },
    { label: 'Môn học',             to: '/subjects',             icon: BookText    },
    { label: menuLabels.classes,    to: '/classes',              icon: School      },
    { label: menuLabels.students,   to: '/students',             icon: GraduationCap },
    // Nhân sự
    { label: menuLabels.teachers,            to: '/teachers',            icon: UserRound     },
    { label: menuLabels.teacherAssignments,  to: '/teacher-assignments', icon: ClipboardList },
    // Đăng ký học
    { label: menuLabels.enrollments, to: '/enrollments', icon: Users         },
    { label: menuLabels.transfer,    to: '/transfer',    icon: ArrowRightLeft },
    // Giảng dạy & điểm số
    { label: menuLabels.timetable,           to: '/timetable',            icon: CalendarDays      },
    { label: menuLabels.scores,              to: '/scores',               icon: Search            },
    { label: menuLabels.scoreChangeRequests, to: '/score-change-requests', icon: MessageSquareWarning },
    { label: menuLabels.conductReview,       to: '/conduct-review',       icon: BookCheck         },
    // Tổng kết
    { label: menuLabels.semesterFinalize, to: '/semester-finalize', icon: ClipboardList },
    { label: menuLabels.yearEnd,          to: '/year-end',          icon: Trophy        },
    { label: menuLabels.reports,          to: '/reports',           icon: BarChart3     },
    // Hệ thống
    { label: menuLabels.parameters, to: '/parameters',  icon: Settings2 },
    { label: menuLabels.auditLogs,  to: '/audit-logs',  icon: History   },
    { label: 'Thông báo',           to: '/notifications', icon: Bell    },
  ],

  // ── MANAGER: ban giám hiệu (xem & tổng hợp) ─────────────────
  MANAGER: [
    { label: menuLabels.dashboard, to: '/dashboard', icon: Home },
    { label: menuLabels.students,           to: '/students',            icon: GraduationCap },
    { label: menuLabels.classes,            to: '/classes',             icon: School        },
    { label: menuLabels.teachers,           to: '/teachers',            icon: UserRound     },
    { label: menuLabels.teacherAssignments, to: '/teacher-assignments', icon: ClipboardList },
    { label: menuLabels.reports,            to: '/reports',             icon: BarChart3     },
    { label: menuLabels.yearEnd,            to: '/year-end',            icon: Trophy        },
    { label: 'Thông báo',                   to: '/notifications',       icon: Bell          },
  ],

  // ── TEACHER: giáo viên ──────────────────────────────────────
  TEACHER: [
    { label: menuLabels.dashboard, to: '/dashboard', icon: Home },
    { label: menuLabels.teacherAssignments, to: '/my-assignments',  icon: ClipboardList },
    { label: menuLabels.myTimetable,        to: '/my-timetable',    icon: CalendarDays  },
    { label: menuLabels.scoreEntry,         to: '/score-entry',     icon: FilePenLine   },
    { label: menuLabels.scores,             to: '/scores',          icon: Search        },
    { label: menuLabels.scoreChangeRequests, to: '/score-change-requests', icon: MessageSquareWarning },
    { label: menuLabels.conductAssessment,  to: '/conduct-assessment', icon: BookCheck  },
    { label: menuLabels.reports,            to: '/subject-report',  icon: BarChart3     },
    { label: 'Thông báo',                   to: '/notifications',   icon: Bell          },
  ],

  // ── STUDENT: học sinh ───────────────────────────────────────
  STUDENT: [
    { label: menuLabels.dashboard,  to: '/dashboard',  icon: Home     },
    { label: menuLabels.myProfile,  to: '/my-profile', icon: UserRound },
    { label: menuLabels.myTimetable, to: '/my-timetable', icon: CalendarDays },
    { label: menuLabels.scores,     to: '/my-scores',  icon: Search   },
    { label: 'Thông báo',           to: '/notifications', icon: Bell  },
  ],
};

export const getMenuItemsByRole = (role: UserRole) => menuByRole[role];
export { roleLabels };
