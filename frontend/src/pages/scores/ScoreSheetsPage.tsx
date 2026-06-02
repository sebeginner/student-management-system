import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  academicApi,
  type ScoreSheet,
  type TeacherAssignment,
} from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { getStatusLabel } from '../../lib/statusLabels';
import { useToastStore } from '../../lib/toast-store';
import { commonLabels, menuLabels } from '../../lib/uiText';
import { isHomeroomTeacherForSheet, isSubjectTeacherForSheet } from './score-utils';

const statusClasses: Record<string, string> = {
  DRAFT: 'border-slate-200 bg-slate-50 text-slate-700',
  SUBMITTED: 'border-blue-200 bg-blue-50 text-blue-700',
  LOCKED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  NEEDS_CORRECTION: 'border-amber-200 bg-amber-50 text-amber-700',
};

const loadErrorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.';

interface ScoreSheetsPageProps {
  mode?: 'entry' | 'lookup';
}

export const ScoreSheetsPage = ({ mode = 'lookup' }: ScoreSheetsPageProps) => {
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const isEntryMode = mode === 'entry';
  const [sheets, setSheets] = useState<ScoreSheet[]>([]);
  const [myAssignments, setMyAssignments] = useState<TeacherAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadSheets = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const [sheetData, assignmentData] = await Promise.all([
        academicApi.getScoreSheets(),
        user?.role === 'TEACHER'
          ? academicApi.getMyTeacherAssignments()
          : Promise.resolve([]),
      ]);

      setSheets(sheetData);
      setMyAssignments(assignmentData);
    } catch (error) {
      setLoadError(loadErrorMessage);
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, user?.role]);

  useEffect(() => {
    void loadSheets();
  }, [loadSheets]);

  const visibleSheets =
    user?.role === 'TEACHER'
      ? sheets.filter(
          (sheet) =>
            isSubjectTeacherForSheet(sheet, myAssignments) ||
            isHomeroomTeacherForSheet(sheet, myAssignments),
        )
      : sheets;

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">
          {isEntryMode ? menuLabels.scoreEntry : menuLabels.scores}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {isEntryMode
            ? 'Giáo viên bộ môn chọn bảng điểm được phân công để nhập điểm.'
            : 'Tra cứu bảng điểm. GVBM xem môn phụ trách; GVCN xem tất cả môn của lớp chủ nhiệm; Giáo vụ có thể khóa bảng điểm đã nộp.'}
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Danh sách bảng điểm
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Chỉ hiển thị bảng điểm đúng phạm vi phân công của giáo viên.
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            {visibleSheets.length} bảng điểm
          </span>
        </div>

        {loadError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-8 text-center text-sm font-medium text-rose-700">
            {loadError}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Lớp</th>
                  <th className="px-4 py-3">Môn học</th>
                  <th className="px-4 py-3">Học kỳ</th>
                  <th className="px-4 py-3">{commonLabels.status}</th>
                  <th className="px-4 py-3">Quyền</th>
                  <th className="px-4 py-3 text-right">{commonLabels.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : null}

                {!isLoading && visibleSheets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Chưa có dữ liệu
                    </td>
                  </tr>
                ) : null}

                {!isLoading
                  ? visibleSheets.map((sheet) => {
                      const isSubjectTeacher =
                        user?.role === 'TEACHER' &&
                        isSubjectTeacherForSheet(sheet, myAssignments);
                      const isHomeroom =
                        user?.role === 'TEACHER' &&
                        !isSubjectTeacher &&
                        isHomeroomTeacherForSheet(sheet, myAssignments);

                      return (
                        <tr key={sheet.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {sheet.class.name}
                          </td>
                          <td className="px-4 py-3">{sheet.subject.name}</td>
                          <td className="px-4 py-3">
                            {sheet.semester.schoolYear?.name ?? ''}{' '}
                            {sheet.semester.name}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                statusClasses[sheet.status] ??
                                'border-slate-200 bg-slate-50 text-slate-700'
                              }`}
                            >
                              {getStatusLabel(sheet.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {user?.role === 'TEACHER' ? (
                              isSubjectTeacher ? (
                                <span className="font-medium text-blue-700">
                                  {isEntryMode ? 'GVBM – nhập điểm' : 'GVBM – xem & nhập'}
                                </span>
                              ) : isHomeroom ? (
                                <span className="font-medium text-emerald-700">
                                  GVCN – xem tất cả môn
                                </span>
                              ) : (
                                'Chỉ xem'
                              )
                            ) : (
                              'Xem/khóa'
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              to={`/scores/sheets/${sheet.id}`}
                              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                            >
                              {isEntryMode && isSubjectTeacher ? 'Nhập điểm' : 'Xem'}
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
