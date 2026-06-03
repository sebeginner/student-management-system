import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ImportExcelModal } from '../../components/ImportExcelModal';
import {
  academicApi,
  type ClassStudentRow,
  type ScoreSheet,
  type StudentSubjectScore,
  type TeacherAssignment,
} from '../../lib/academic-api';
import { getApiErrorKey, getApiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { getStatusLabel } from '../../lib/statusLabels';
import { useToastStore } from '../../lib/toast-store';
import { commonLabels } from '../../lib/uiText';
import {
  assessmentColumns,
  canEditScoreSheet,
  formatAverage,
  scoreDetailKey,
  scoreDetailsToMap,
  scoreErrorMessages,
} from './score-utils';
import { ScoreChangeRequestModal } from './ScoreChangeRequestModal';

type ScoreRowValues = Record<string, string>;
type ScoreRows = Record<number, ScoreRowValues>;

const loadErrorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.';

const getScoreErrorMessage = (error: unknown) => {
  const errorKey = getApiErrorKey(error);

  return errorKey
    ? scoreErrorMessages[errorKey] ?? getApiErrorMessage(error)
    : getApiErrorMessage(error);
};

const buildInitialRows = (
  sheet: ScoreSheet,
  classStudents: ClassStudentRow[],
) => {
  const rows: ScoreRows = {};

  for (const row of classStudents) {
    const studentScore = sheet.studentScores.find(
      (score) => score.studentId === row.student.id,
    );
    rows[row.student.id] = studentScore
      ? scoreDetailsToMap(studentScore.scoreDetails)
      : {};
  }

  return rows;
};

const getScoreSheetStatusClass = (status?: string) => {
  switch (status) {
    case 'LOCKED':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'SUBMITTED':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'NEEDS_CORRECTION':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

const getStudentScoreStatus = (studentScore?: StudentSubjectScore) => {
  if (!studentScore) {
    return {
      label: 'Chưa nhập',
      className: 'border-slate-200 bg-slate-50 text-slate-600',
    };
  }

  if (studentScore.averageScore === null || studentScore.averageScore === undefined) {
    return {
      label: 'Đang nhập',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }

  if (studentScore.passStatus === false) {
    return {
      label: 'Chưa đạt',
      className: 'border-rose-200 bg-rose-50 text-rose-700',
    };
  }

  return {
    label: 'Đã có điểm',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };
};

const getAssessmentColumnLabel = (key: string, label: string) =>
  key === 'oral' ? 'Miệng / 15 phút' : label;

export const ScoreEntryPage = () => {
  const { id } = useParams();
  const scoreSheetId = Number(id);
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const [sheet, setSheet] = useState<ScoreSheet | null>(null);
  const [classStudents, setClassStudents] = useState<ClassStudentRow[]>([]);
  const [myAssignments, setMyAssignments] = useState<TeacherAssignment[]>([]);
  const [rows, setRows] = useState<ScoreRows>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [savingStudentId, setSavingStudentId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [requestStudentScore, setRequestStudentScore] =
    useState<StudentSubjectScore | null>(null);

  const editable = sheet
    ? canEditScoreSheet(user, sheet, myAssignments)
    : false;
  const isLocked = sheet?.status === 'LOCKED';
  const isSubjectTeacher = sheet
    ? user?.role === 'TEACHER' &&
      myAssignments.some(
        (assignment) =>
          assignment.assignmentType === 'SUBJECT' &&
          assignment.isActive &&
          assignment.classId === sheet.classId &&
          assignment.subjectId === sheet.subjectId &&
          assignment.semesterId === sheet.semesterId,
      )
    : false;
  const canSubmit =
    Boolean(sheet) &&
    user?.role === 'TEACHER' &&
    editable &&
    sheet?.status === 'DRAFT';
  const canLock = user?.role === 'ACADEMIC_STAFF' && sheet?.status === 'SUBMITTED';

  const scoreByStudentId = useMemo(() => {
    const map = new Map<number, ScoreSheet['studentScores'][number]>();

    for (const studentScore of sheet?.studentScores ?? []) {
      map.set(studentScore.studentId, studentScore);
    }

    return map;
  }, [sheet?.studentScores]);

  const loadSheet = useCallback(async () => {
    if (!scoreSheetId) {
      return;
    }

    setIsLoading(true);
    setLoadError('');

    try {
      const sheetData = await academicApi.getScoreSheet(scoreSheetId);
      const [studentData, assignmentData] = await Promise.all([
        academicApi.getClassStudents(sheetData.classId),
        user?.role === 'TEACHER'
          ? academicApi.getMyTeacherAssignments()
          : Promise.resolve([]),
      ]);

      setSheet(sheetData);
      setClassStudents(studentData);
      setMyAssignments(assignmentData);
      setRows(buildInitialRows(sheetData, studentData));
    } catch (error) {
      setLoadError(loadErrorMessage);
      showToast(getScoreErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [scoreSheetId, showToast, user?.role]);

  useEffect(() => {
    void loadSheet();
  }, [loadSheet]);

  const updateCell = (studentId: number, key: string, value: string) => {
    setRows((current) => ({
      ...current,
      [studentId]: {
        ...(current[studentId] ?? {}),
        [key]: value,
      },
    }));
  };

  const saveStudentScore = async (
    event: FormEvent<HTMLFormElement>,
    studentId: number,
  ) => {
    event.preventDefault();

    if (!sheet || !editable) {
      return;
    }

    setSavingStudentId(studentId);

    try {
      const values = rows[studentId] ?? {};
      const details = assessmentColumns
        .map((column) => {
          const rawValue =
            values[scoreDetailKey(column.testTypeCode, column.attemptNo)] ?? '';
          const trimmed = rawValue.trim();

          if (trimmed === '') {
            return null;
          }

          return {
            testTypeCode: column.testTypeCode,
            attemptNo: column.attemptNo,
            score: Number(trimmed),
          };
        })
        .filter((detail): detail is NonNullable<typeof detail> =>
          Boolean(detail),
        );

      await academicApi.updateStudentScore(sheet.id, studentId, { details });
      showToast('Lưu nháp điểm thành công.', 'success');
      await loadSheet();
    } catch (error) {
      showToast(getScoreErrorMessage(error), 'error');
    } finally {
      setSavingStudentId(null);
    }
  };

  const handleSubmitSheet = async () => {
    if (!sheet || !canSubmit) {
      return;
    }

    setIsSubmitting(true);

    try {
      await academicApi.submitScoreSheet(sheet.id);
      showToast('Nộp bảng điểm thành công.', 'success');
      await loadSheet();
    } catch (error) {
      showToast(getScoreErrorMessage(error), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLockSheet = async () => {
    if (!sheet || !canLock) {
      return;
    }

    setIsLocking(true);

    try {
      await academicApi.lockScoreSheet(sheet.id);
      showToast('Khóa bảng điểm thành công.', 'success');
      await loadSheet();
    } catch (error) {
      showToast(getScoreErrorMessage(error), 'error');
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              to="/scores"
              className="inline-flex rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Quay lại bảng điểm
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold text-slate-900">
                Nhập bảng điểm
              </h2>
              {sheet ? (
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${getScoreSheetStatusClass(
                    sheet.status,
                  )}`}
                >
                  {getStatusLabel(sheet.status)}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {sheet
                ? `${sheet.class.name} · ${sheet.subject.name} · ${
                    sheet.semester.schoolYear?.name ?? ''
                  } · ${sheet.semester.name}`
                : 'Đang tải dữ liệu...'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {isLocked && !isSubjectTeacher ? (
              <Link
                to="/score-change-requests"
                className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
              >
                Xem yêu cầu sửa điểm
              </Link>
            ) : null}

            {user?.role === 'ACADEMIC_STAFF' ? (
              <button
                type="button"
                onClick={handleLockSheet}
                disabled={!canLock || isLocking}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-300"
              >
                {isLocking ? 'Đang khóa...' : 'Khóa bảng điểm'}
              </button>
            ) : null}

            {user?.role === 'TEACHER' ? (
              <button
                type="button"
                onClick={handleSubmitSheet}
                disabled={!canSubmit || isSubmitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
              >
                {isSubmitting ? 'Đang nộp...' : 'Nộp bảng điểm'}
              </button>
            ) : null}

            {!isLocked ? (
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Import Excel
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void academicApi.downloadScoreSheetPdf(sheet.id)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Tải PDF
            </button>
          </div>
        </div>
      </div>

      {isLocked ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
          Bảng điểm đã khóa. Vui lòng gửi yêu cầu sửa điểm nếu cần điều chỉnh.
        </div>
      ) : null}

      {!editable && sheet && user?.role === 'TEACHER' && !isLocked ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Bạn có thể xem bảng điểm này, nhưng chỉ giáo viên bộ môn đúng lớp,
          môn và học kỳ mới được nhập điểm.
        </div>
      ) : null}

      {user?.role === 'ACADEMIC_STAFF' ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Giáo vụ có thể xem và khóa bảng điểm đã nộp. Việc nhập điểm trực tiếp
          dành cho giáo viên bộ môn được phân công.
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Danh sách học sinh
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Nhập điểm theo từng học sinh và lưu nháp trước khi nộp bảng điểm.
            </p>
          </div>
        </div>

        {loadError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-8 text-center text-sm font-medium text-rose-700">
            {loadError}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Mã học sinh</th>
                  <th className="px-4 py-3">Họ tên</th>
                  {assessmentColumns.map((column) => (
                    <th key={column.key} className="px-4 py-3">
                      {getAssessmentColumnLabel(column.key, column.label)}
                    </th>
                  ))}
                  <th className="px-4 py-3">Trung bình</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : null}

                {!isLoading && classStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Chưa có dữ liệu
                    </td>
                  </tr>
                ) : null}

                {!isLoading
                  ? classStudents.map((classStudent) => {
                      const student = classStudent.student;
                      const studentScore = scoreByStudentId.get(student.id);
                      const scoreStatus = getStudentScoreStatus(studentScore);

                      return (
                        <tr key={student.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {student.studentCode}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {student.fullName}
                          </td>
                          {assessmentColumns.map((column) => {
                            const key = scoreDetailKey(
                              column.testTypeCode,
                              column.attemptNo,
                            );

                            return (
                              <td key={column.key} className="px-4 py-3">
                                <input
                                  type="number"
                                  min={0}
                                  max={10}
                                  step={0.01}
                                  value={rows[student.id]?.[key] ?? ''}
                                  onChange={(event) =>
                                    updateCell(
                                      student.id,
                                      key,
                                      event.target.value,
                                    )
                                  }
                                  disabled={!editable}
                                  className="h-10 w-24 rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
                                />
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {formatAverage(studentScore?.averageScore)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${scoreStatus.className}`}
                            >
                              {scoreStatus.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isLocked && isSubjectTeacher && studentScore ? (
                              <button
                                type="button"
                                onClick={() => setRequestStudentScore(studentScore)}
                                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                              >
                                Gửi yêu cầu sửa điểm
                              </button>
                            ) : (
                              <form
                                onSubmit={(event) =>
                                  void saveStudentScore(event, student.id)
                                }
                              >
                                <button
                                  type="submit"
                                  disabled={
                                    !editable || savingStudentId === student.id
                                  }
                                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
                                >
                                  {savingStudentId === student.id
                                    ? commonLabels.saving
                                    : 'Lưu nháp'}
                                </button>
                              </form>
                            )}
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

      {sheet && requestStudentScore ? (
        <ScoreChangeRequestModal
          scoreSheet={sheet}
          studentScore={requestStudentScore}
          onClose={() => setRequestStudentScore(null)}
          onCreated={loadSheet}
        />
      ) : null}
      {showImportModal && sheet ? (
        <ImportExcelModal
          title={`Import điểm – ${sheet.subject?.name ?? ''}`}
          description="Upload file Excel có các cột: Mã HS, Miệng, 1 tiết, Giữa kỳ, Cuối kỳ."
          onClose={() => { setShowImportModal(false); void loadSheet(); }}
          onDownloadTemplate={() => academicApi.downloadScoreSheetTemplate(sheet.id)}
          onPreview={(file) => academicApi.previewScoreImport(sheet.id, file)}
          onCommit={(rows) => academicApi.commitScoreImport(sheet.id, rows).then(() => undefined)}
        />
      ) : null}
    </section>
  );
};
