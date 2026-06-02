import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  academicApi,
  type ClassStudentRow,
  type ScoreSheet,
  type StudentSubjectScore,
  type TeacherAssignment,
} from '../../lib/academic-api';
import { getApiErrorKey, getApiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { useToastStore } from '../../lib/toast-store';
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
  const [savingStudentId, setSavingStudentId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
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
      showToast('Score saved successfully.', 'success');
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
      showToast('Score sheet submitted successfully.', 'success');
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
      showToast('Score sheet locked successfully.', 'success');
      await loadSheet();
    } catch (error) {
      showToast(getScoreErrorMessage(error), 'error');
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/scores" className="text-sm font-medium text-blue-700">
            Back to score sheets
          </Link>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {sheet
              ? `${sheet.class.name} - ${sheet.subject.name}`
              : 'Score entry'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {sheet
              ? `${sheet.semester.schoolYear?.name ?? ''} ${
                  sheet.semester.name
                } - ${sheet.status}`
              : 'Loading score sheet...'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isLocked && !isSubjectTeacher ? (
            <Link
              to="/score-change-requests"
              className="rounded border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800"
            >
              View score change requests
            </Link>
          ) : null}

          {user?.role === 'ACADEMIC_STAFF' ? (
            <button
              type="button"
              onClick={handleLockSheet}
              disabled={!canLock || isLocking}
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-emerald-300"
            >
              {isLocking ? 'Locking...' : 'Lock'}
            </button>
          ) : null}

          {user?.role === 'TEACHER' ? (
            <button
              type="button"
              onClick={handleSubmitSheet}
              disabled={!canSubmit || isSubmitting}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-blue-300"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          ) : null}
        </div>
      </div>

      {!editable && sheet && user?.role === 'TEACHER' ? (
        <div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          You can view this sheet, but score entry is disabled because you are
          not the subject teacher for this class, subject, and semester or the
          sheet is locked.
        </div>
      ) : null}

      {user?.role === 'ACADEMIC_STAFF' ? (
        <div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Academic staff can view and lock submitted score sheets. Direct score
          entry is reserved for the assigned subject teacher.
        </div>
      ) : null}

      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="min-w-[980px] divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Student</th>
              {assessmentColumns.map((column) => (
                <th key={column.key} className="px-4 py-3">
                  {column.label}
                </th>
              ))}
              <th className="px-4 py-3">Average</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Loading score sheet...
                </td>
              </tr>
            ) : null}

            {!isLoading && classStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No students in this class.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? classStudents.map((classStudent) => {
                  const student = classStudent.student;
                  const studentScore = scoreByStudentId.get(student.id);

                  return (
                    <tr key={student.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {student.studentCode}
                        </div>
                        <div className="text-slate-600">{student.fullName}</div>
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
                                updateCell(student.id, key, event.target.value)
                              }
                              disabled={!editable}
                              className="w-24 rounded border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-100"
                            />
                          </td>
                        );
                      })}
                      <td className="px-4 py-3">
                        {formatAverage(studentScore?.averageScore)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isLocked && isSubjectTeacher && studentScore ? (
                          <button
                            type="button"
                            onClick={() => setRequestStudentScore(studentScore)}
                            className="rounded border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800"
                          >
                            Yeu cau sua
                          </button>
                        ) : (
                          <form
                            onSubmit={(event) =>
                              void saveStudentScore(event, student.id)
                            }
                          >
                            <button
                              type="submit"
                              disabled={!editable || savingStudentId === student.id}
                              className="rounded border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 disabled:border-slate-200 disabled:text-slate-400"
                            >
                              {savingStudentId === student.id
                                ? 'Saving...'
                                : 'Save'}
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

      {sheet && requestStudentScore ? (
        <ScoreChangeRequestModal
          scoreSheet={sheet}
          studentScore={requestStudentScore}
          onClose={() => setRequestStudentScore(null)}
          onCreated={loadSheet}
        />
      ) : null}
    </section>
  );
};
