import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { academicApi, type Student } from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { formatDisplayDate } from '../../lib/date';
import { roleLabels } from '../../lib/roleLabels';
import { getStatusLabel } from '../../lib/statusLabels';
import { useToastStore } from '../../lib/toast-store';
import { menuLabels } from '../../lib/uiText';

const genderLabels: Record<string, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
};

export const MyProfilePage = () => {
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user?.studentId) return;
    setIsLoading(true);
    academicApi
      .getStudent(user.studentId)
      .then(setStudent)
      .catch((error: unknown) =>
        showToast(getApiErrorMessage(error), 'error'),
      )
      .finally(() => setIsLoading(false));
  }, [user, showToast]);

  const activeEnrollment = student?.enrollments?.find(
    (e) => e.status === 'ACTIVE',
  );

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">
          {menuLabels.myProfile}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Thông tin tài khoản và hồ sơ học sinh của bạn.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Account info */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">
            Thông tin tài khoản
          </h3>
          <dl className="space-y-3">
            <InfoRow label="Tên đăng nhập" value={user?.username ?? '-'} />
            <InfoRow label="Họ và tên" value={user?.fullName ?? '-'} />
            <InfoRow label="Email tài khoản" value={user?.email ?? '-'} />
            <InfoRow
              label="Vai trò"
              value={user ? roleLabels[user.role] : '-'}
            />
          </dl>
        </div>

        {/* Student profile */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">
            Hồ sơ học sinh
          </h3>

          {isLoading ? (
            <p className="text-sm text-slate-500">Đang tải hồ sơ...</p>
          ) : !student ? (
            <p className="text-sm text-slate-500">
              Tài khoản chưa liên kết với hồ sơ học sinh.
            </p>
          ) : (
            <dl className="space-y-3">
              <InfoRow label="Mã học sinh" value={student.studentCode} />
              <InfoRow label="Họ và tên" value={student.fullName} />
              <InfoRow
                label="Giới tính"
                value={genderLabels[student.gender] ?? student.gender}
              />
              <InfoRow
                label="Ngày sinh"
                value={formatDisplayDate(student.dateOfBirth)}
              />
              <InfoRow
                label="Ngày nhập học"
                value={formatDisplayDate(student.admissionDate)}
              />
              {student.email ? (
                <InfoRow label="Email" value={student.email} />
              ) : null}
              {student.address ? (
                <InfoRow label="Địa chỉ" value={student.address} />
              ) : null}
              <InfoRow
                label="Trạng thái"
                value={getStatusLabel(student.status)}
              />
            </dl>
          )}
        </div>
      </div>

      {/* Current enrollment */}
      {student ? (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">
            Lớp học hiện tại
          </h3>

          {activeEnrollment ? (
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <dt className="text-xs font-medium text-slate-500">Lớp</dt>
                <dd className="mt-0.5 text-lg font-semibold text-slate-900">
                  {activeEnrollment.class?.name ?? '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Học kỳ</dt>
                <dd className="mt-0.5 font-medium text-slate-900">
                  {activeEnrollment.semester?.schoolYear?.name ?? ''}{' '}
                  {activeEnrollment.semester?.name ?? '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">
                  Ngày vào lớp
                </dt>
                <dd className="mt-0.5 font-medium text-slate-900">
                  {formatDisplayDate(activeEnrollment.enrolledAt)}
                </dd>
              </div>
              {activeEnrollment.classId ? (
                <Link
                  to={`/my-scores`}
                  className="ml-auto rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Xem điểm của tôi
                </Link>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Bạn chưa được phân vào lớp học nào.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start gap-3">
    <dt className="w-36 shrink-0 text-sm text-slate-500">{label}</dt>
    <dd className="text-sm font-medium text-slate-900">{value}</dd>
  </div>
);
