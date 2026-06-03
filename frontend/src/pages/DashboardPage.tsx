import {
  BarChart3,
  ClipboardList,
  FilePenLine,
  GraduationCap,
  MessageSquareWarning,
  School,
  Search,
  Settings2,
  ShieldCheck,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  academicApi,
  type DashboardSummaryReport,
  type MyStudentScore,
  type SchoolClass,
  type Student,
  type TeacherAssignment,
} from '../lib/academic-api';
import { getApiErrorMessage } from '../lib/api';
import { useAuthStore, type UserRole } from '../lib/auth-store';
import { appText, menuLabels } from '../lib/uiText';

type MetricCard = {
  title: string;
  value?: string | number;
  description?: string;
  icon: LucideIcon;
};

type Shortcut = {
  label: string;
  to: string;
  icon: LucideIcon;
};

interface DashboardData {
  students?: Student[];
  classes?: SchoolClass[];
  dashboard?: DashboardSummaryReport;
  pendingScoreChangeRequests?: number;
  teacherAssignments?: TeacherAssignment[];
  myScores?: MyStudentScore[];
}

const roleTitles: Record<UserRole, string> = {
  ADMIN: 'Trang chủ - Quản trị viên',
  ACADEMIC_STAFF: 'Trang chủ - Giáo vụ',
  MANAGER: 'Trang chủ - Ban giám hiệu',
  TEACHER: 'Trang chủ - Giáo viên',
  STUDENT: 'Trang chủ - Học sinh',
};

const shortcutBaseClass =
  'group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md';

const loadDashboardData = async (role: UserRole): Promise<DashboardData> => {
  if (role === 'ACADEMIC_STAFF') {
    const [students, classes, requests] = await Promise.all([
      academicApi.getStudents(),
      academicApi.getClasses(),
      academicApi.getScoreChangeRequests({ status: 'PENDING' }),
    ]);

    return {
      students,
      classes,
      pendingScoreChangeRequests: requests.length,
    };
  }

  if (role === 'MANAGER') {
    try {
      const dashboard = await academicApi.getDashboardSummaryReport({
        includeUnOfficial: true,
      });

      return { dashboard };
    } catch {
      return {};
    }
  }

  if (role === 'TEACHER') {
    const teacherAssignments = await academicApi.getMyTeacherAssignments();
    return { teacherAssignments };
  }

  if (role === 'STUDENT') {
    const myScores = await academicApi.getMyScores();
    return { myScores };
  }

  return {};
};

const formatMetricValue = (value?: string | number) =>
  value === undefined || value === null || value === '' ? '-' : value;

const MetricGrid = ({ cards }: { cards: MetricCard[] }) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    {cards.map((card) => (
      <div
        key={card.title}
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-slate-500">
              {card.title}
            </div>
            <div className="mt-3 text-3xl font-bold text-slate-900">
              {formatMetricValue(card.value)}
            </div>
          </div>
          <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
            <card.icon size={26} />
          </div>
        </div>
        {card.description ? (
          <p className="mt-3 text-sm text-slate-500">{card.description}</p>
        ) : null}
      </div>
    ))}
  </div>
);

const ShortcutGrid = ({ shortcuts }: { shortcuts: Shortcut[] }) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {shortcuts.map((shortcut) => (
      <Link key={shortcut.label} to={shortcut.to} className={shortcutBaseClass}>
        <shortcut.icon
          size={34}
          className="text-emerald-600 transition group-hover:scale-105"
        />
        <div className="mt-5 text-base font-semibold text-slate-900">
          {shortcut.label}
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Mở nhanh màn hình nghiệp vụ
        </p>
      </Link>
    ))}
  </div>
);

const Section = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) => (
  <section className="space-y-4">
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    {children}
  </section>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
    {message}
  </div>
);

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<DashboardData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setError('');

    loadDashboardData(user.role)
      .then((result) => {
        if (mounted) {
          setData(result);
        }
      })
      .catch((loadError) => {
        if (mounted) {
          setData({});
          setError(getApiErrorMessage(loadError));
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  const activeTeacherAssignments = useMemo(
    () => (data.teacherAssignments ?? []).filter((item) => item.isActive),
    [data.teacherAssignments],
  );
  const homeroomAssignments = activeTeacherAssignments.filter(
    (item) => item.assignmentType === 'HOMEROOM',
  );
  const subjectAssignments = activeTeacherAssignments.filter(
    (item) => item.assignmentType === 'SUBJECT',
  );
  const hasSubjectAssignment = subjectAssignments.length > 0;
  const latestScore = data.myScores?.[0];
  const currentClassName = latestScore?.scoreSheet.class.name;
  const scoreCount = data.myScores?.length ?? 0;
  const averageScore =
    data.myScores && data.myScores.length > 0
      ? (
          data.myScores.reduce(
            (sum, score) => sum + (score.averageScore ?? 0),
            0,
          ) / data.myScores.length
        ).toFixed(2)
      : undefined;

  const cards = getCardsForRole(user?.role, data, {
    averageScore,
    currentClassName,
    homeroomCount: homeroomAssignments.length,
    scoreCount,
    subjectCount: subjectAssignments.length,
    userFullName: user?.fullName ?? user?.username,
  });
  const shortcuts = getShortcutsForRole(user?.role, hasSubjectAssignment);

  return (
    <section className="space-y-7">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          {user ? roleTitles[user.role] : menuLabels.dashboard}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Xin chào {user?.fullName ?? user?.username}.{' '}
          {appText.dashboardGreeting}
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Đang tải dữ liệu trang chủ...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Không tải được một phần dữ liệu tổng quan. Hệ thống vẫn hiển thị các
          lối tắt an toàn.
        </div>
      ) : null}

      <MetricGrid cards={cards} />

      {user?.role === 'TEACHER' ? (
        <TeacherSections
          homeroomAssignments={homeroomAssignments}
          subjectAssignments={subjectAssignments}
        />
      ) : null}

      <Section title="Lối tắt">
        <ShortcutGrid shortcuts={shortcuts} />
      </Section>
    </section>
  );
};

const TeacherSections = ({
  homeroomAssignments,
  subjectAssignments,
}: {
  homeroomAssignments: TeacherAssignment[];
  subjectAssignments: TeacherAssignment[];
}) => (
  <div className="grid gap-5 xl:grid-cols-2">
    <Section title="Lớp chủ nhiệm">
      {homeroomAssignments.length > 0 ? (
        <div className="space-y-3">
          {homeroomAssignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      ) : (
        <EmptyState message="Chưa có lớp chủ nhiệm đang hiệu lực." />
      )}
    </Section>

    <Section title="Lớp/môn đang dạy">
      {subjectAssignments.length > 0 ? (
        <div className="space-y-3">
          {subjectAssignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      ) : (
        <EmptyState message="Chưa có phân công bộ môn đang hiệu lực." />
      )}
    </Section>
  </div>
);

const AssignmentCard = ({ assignment }: { assignment: TeacherAssignment }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="font-semibold text-slate-900">
          {assignment.class?.name ?? `Lớp ${assignment.classId}`}
        </div>
        <div className="mt-1 text-sm text-slate-500">
          {assignment.schoolYear?.name ?? assignment.schoolYearId}
          {assignment.semester ? ` - ${assignment.semester.name}` : ''}
        </div>
      </div>
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        {assignment.assignmentType === 'HOMEROOM' ? 'Chủ nhiệm' : 'Bộ môn'}
      </span>
    </div>
    {assignment.assignmentType === 'SUBJECT' ? (
      <div className="mt-3 text-sm text-slate-700">
        Môn học: {assignment.subject?.name ?? assignment.subjectId}
      </div>
    ) : null}
  </div>
);

const getCardsForRole = (
  role: UserRole | undefined,
  data: DashboardData,
  derived: {
    averageScore?: string;
    currentClassName?: string;
    homeroomCount: number;
    scoreCount: number;
    subjectCount: number;
    userFullName?: string;
  },
): MetricCard[] => {
  if (role === 'ACADEMIC_STAFF') {
    const students = data.students ?? [];
    const classes = data.classes ?? [];

    return [
      {
        title: 'Tổng số học sinh',
        value: students.length,
        icon: GraduationCap,
      },
      {
        title: 'Tổng số lớp',
        value: classes.length,
        icon: School,
      },
      {
        title: 'Chờ phân lớp',
        value: students.filter(
          (student) => student.status === 'PENDING_CLASS_ASSIGNMENT',
        ).length,
        icon: Users,
      },
      {
        title: 'Yêu cầu sửa điểm',
        value: data.pendingScoreChangeRequests,
        description: 'Đang chờ duyệt',
        icon: MessageSquareWarning,
      },
    ];
  }

  if (role === 'TEACHER') {
    return [
      {
        title: 'Lớp chủ nhiệm',
        value: derived.homeroomCount,
        description: 'Phân công đang hiệu lực',
        icon: School,
      },
      {
        title: 'Lớp/môn đang dạy',
        value: derived.subjectCount,
        description: 'Phân công bộ môn',
        icon: ClipboardList,
      },
    ];
  }

  if (role === 'STUDENT') {
    return [
      {
        title: 'Thông tin cá nhân',
        value: derived.userFullName,
        description: 'Tài khoản học sinh đang đăng nhập',
        icon: GraduationCap,
      },
      {
        title: 'Lớp hiện tại',
        value: derived.currentClassName,
        description: 'Suy ra từ bảng điểm gần nhất nếu có',
        icon: School,
      },
      {
        title: 'Điểm cá nhân',
        value: derived.averageScore,
        description:
          derived.scoreCount > 0
            ? `${derived.scoreCount} bảng điểm`
            : 'Chưa có dữ liệu điểm',
        icon: Search,
      },
    ];
  }

  if (role === 'MANAGER') {
    return [
      {
        title: 'Báo cáo học kỳ',
        value: data.dashboard?.classCount,
        description: 'Số lớp trong kỳ hiện tại',
        icon: BarChart3,
      },
      {
        title: 'Báo cáo môn học',
        value: data.dashboard?.subjectCount,
        description: 'Số môn đang tổng hợp',
        icon: ClipboardList,
      },
      {
        title: 'Thống kê toàn trường',
        value: data.dashboard?.studentCount,
        description: 'Tổng số học sinh',
        icon: School,
      },
    ];
  }

  return [
    {
      title: 'Tài khoản',
      description: 'Quản lý người dùng hệ thống',
      icon: UserCog,
    },
    {
      title: 'Vai trò',
      description: 'Quản lý vai trò và phạm vi truy cập',
      icon: ShieldCheck,
    },
    {
      title: 'Cấu hình hệ thống',
      description: 'Quy định, tham số và thiết lập kỹ thuật',
      icon: Settings2,
    },
  ];
};

const getShortcutsForRole = (
  role: UserRole | undefined,
  hasSubjectAssignment: boolean,
): Shortcut[] => {
  if (role === 'ACADEMIC_STAFF') {
    return [
      { label: 'Tiếp nhận học sinh', to: '/students', icon: GraduationCap },
      { label: 'Phân lớp', to: '/enrollments', icon: Users },
      { label: 'Chuyển lớp', to: '/transfer', icon: School },
      {
        label: 'Phân công giáo viên',
        to: '/teacher-assignments',
        icon: ClipboardList,
      },
      { label: 'Khóa bảng điểm', to: '/scores', icon: FilePenLine },
      { label: 'Báo cáo', to: '/reports', icon: BarChart3 },
    ];
  }

  if (role === 'TEACHER') {
    return [
      ...(hasSubjectAssignment
        ? [
            {
              label: 'Nhập bảng điểm',
              to: '/score-entry',
              icon: FilePenLine,
            },
          ]
        : []),
      { label: 'Tra cứu điểm', to: '/scores', icon: Search },
      { label: 'Danh sách lớp', to: '/my-assignments', icon: School },
      {
        label: 'Yêu cầu sửa điểm',
        to: '/score-change-requests',
        icon: MessageSquareWarning,
      },
    ];
  }

  if (role === 'STUDENT') {
    return [
      { label: 'Xem điểm cá nhân', to: '/my-scores', icon: Search },
      { label: 'Xem lớp học', to: '/my-profile', icon: School },
    ];
  }

  if (role === 'MANAGER') {
    return [
      { label: 'Báo cáo học kỳ', to: '/reports', icon: BarChart3 },
      { label: 'Báo cáo môn học', to: '/reports', icon: ClipboardList },
      { label: 'Quy định / Tham số', to: '/parameters', icon: Settings2 },
    ];
  }

  return [
    { label: 'Quản lý người dùng', to: '/users', icon: UserCog },
    { label: 'Phân quyền', to: '/roles', icon: ShieldCheck },
    { label: 'Quy định / Tham số', to: '/parameters', icon: Settings2 },
  ];
};
