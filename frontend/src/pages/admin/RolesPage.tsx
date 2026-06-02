import { menuLabels } from '../../lib/uiText';

interface Permission {
  feature: string;
  admin: boolean;
  academicStaff: boolean;
  manager: boolean;
  teacher: boolean;
  student: boolean;
}

const PERMISSIONS: Permission[] = [
  {
    feature: 'Quản lý người dùng & vai trò',
    admin: true,
    academicStaff: false,
    manager: false,
    teacher: false,
    student: false,
  },
  {
    feature: 'Cấu hình tham số hệ thống',
    admin: true,
    academicStaff: true,
    manager: false,
    teacher: false,
    student: false,
  },
  {
    feature: 'Quản lý học sinh (CRUD)',
    admin: false,
    academicStaff: true,
    manager: false,
    teacher: false,
    student: false,
  },
  {
    feature: 'Quản lý giáo viên (CRUD)',
    admin: false,
    academicStaff: true,
    manager: false,
    teacher: false,
    student: false,
  },
  {
    feature: 'Quản lý lớp học',
    admin: false,
    academicStaff: true,
    manager: true,
    teacher: false,
    student: false,
  },
  {
    feature: 'Phân lớp & chuyển lớp',
    admin: false,
    academicStaff: true,
    manager: false,
    teacher: false,
    student: false,
  },
  {
    feature: 'Phân công giáo viên',
    admin: false,
    academicStaff: true,
    manager: false,
    teacher: false,
    student: false,
  },
  {
    feature: 'Nhập bảng điểm',
    admin: false,
    academicStaff: false,
    manager: false,
    teacher: true,
    student: false,
  },
  {
    feature: 'Tra cứu điểm',
    admin: false,
    academicStaff: true,
    manager: false,
    teacher: true,
    student: false,
  },
  {
    feature: 'Duyệt yêu cầu sửa điểm',
    admin: false,
    academicStaff: true,
    manager: false,
    teacher: false,
    student: false,
  },
  {
    feature: 'Gửi yêu cầu sửa điểm',
    admin: false,
    academicStaff: false,
    manager: false,
    teacher: true,
    student: false,
  },
  {
    feature: 'Xem báo cáo toàn trường',
    admin: false,
    academicStaff: true,
    manager: true,
    teacher: false,
    student: false,
  },
  {
    feature: 'Xem báo cáo lớp / môn',
    admin: false,
    academicStaff: false,
    manager: false,
    teacher: true,
    student: false,
  },
  {
    feature: 'Xem điểm cá nhân',
    admin: false,
    academicStaff: false,
    manager: false,
    teacher: false,
    student: true,
  },
  {
    feature: 'Xem hồ sơ cá nhân',
    admin: false,
    academicStaff: false,
    manager: false,
    teacher: false,
    student: true,
  },
];

const Check = ({ value }: { value: boolean }) =>
  value ? (
    <span className="text-green-600 font-semibold">✓</span>
  ) : (
    <span className="text-slate-300">–</span>
  );

export const RolesPage = () => {
  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">
          {menuLabels.roles}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Tổng quan quyền hạn theo từng vai trò trong hệ thống.
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm text-sm text-amber-700">
        <span className="font-semibold text-amber-800">Lưu ý: </span>
        Đây là bảng tổng quan tĩnh. Quản lý vai trò động (tạo vai trò mới,
        chỉnh sửa quyền hạn) cần module{' '}
        <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
          authorization/
        </code>{' '}
        bổ sung HTTP endpoints.
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[700px] w-full text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left w-64">Tính năng</th>
              <th className="px-4 py-3 text-center">Quản trị viên</th>
              <th className="px-4 py-3 text-center">Giáo vụ</th>
              <th className="px-4 py-3 text-center">Ban giám hiệu</th>
              <th className="px-4 py-3 text-center">Giáo viên</th>
              <th className="px-4 py-3 text-center">Học sinh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PERMISSIONS.map((row) => (
              <tr key={row.feature} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-800">{row.feature}</td>
                <td className="px-4 py-3 text-center">
                  <Check value={row.admin} />
                </td>
                <td className="px-4 py-3 text-center">
                  <Check value={row.academicStaff} />
                </td>
                <td className="px-4 py-3 text-center">
                  <Check value={row.manager} />
                </td>
                <td className="px-4 py-3 text-center">
                  <Check value={row.teacher} />
                </td>
                <td className="px-4 py-3 text-center">
                  <Check value={row.student} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
