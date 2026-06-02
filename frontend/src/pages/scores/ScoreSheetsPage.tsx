import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  academicApi,
  type ScoreSheet,
  type TeacherAssignment,
} from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { useToastStore } from '../../lib/toast-store';
import { isSubjectTeacherForSheet } from './score-utils';

const statusClasses: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SUBMITTED: 'bg-blue-50 text-blue-700',
  LOCKED: 'bg-emerald-50 text-emerald-700',
  NEEDS_CORRECTION: 'bg-amber-50 text-amber-700',
};

export const ScoreSheetsPage = () => {
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const [sheets, setSheets] = useState<ScoreSheet[]>([]);
  const [myAssignments, setMyAssignments] = useState<TeacherAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSheets = useCallback(async () => {
    setIsLoading(true);

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
      ? sheets.filter((sheet) => isSubjectTeacherForSheet(sheet, myAssignments))
      : sheets;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Score Sheets</h2>
        <p className="mt-1 text-sm text-slate-600">
          View score sheets and open the score entry table.
        </p>
      </div>

      <div className="overflow-hidden rounded border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Semester</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Permission</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Loading score sheets...
                </td>
              </tr>
            ) : null}

            {!isLoading && visibleSheets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No score sheets found.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? visibleSheets.map((sheet) => {
                  const isSubjectTeacher =
                    user?.role === 'TEACHER' &&
                    isSubjectTeacherForSheet(sheet, myAssignments);

                  return (
                    <tr key={sheet.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {sheet.class.name}
                      </td>
                      <td className="px-4 py-3">{sheet.subject.name}</td>
                      <td className="px-4 py-3">
                        {sheet.semester.schoolYear?.name ?? ''} {sheet.semester.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-1 text-xs font-semibold ${
                            statusClasses[sheet.status] ??
                            'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {sheet.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {user?.role === 'TEACHER'
                          ? isSubjectTeacher
                            ? 'GVBM - can enter scores'
                            : 'View only'
                          : 'View'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/scores/sheets/${sheet.id}`}
                          className="rounded border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700"
                        >
                          {isSubjectTeacher ? 'Enter scores' : 'View'}
                        </Link>
                      </td>
                    </tr>
                  );
                })
              : null}
          </tbody>
        </table>
      </div>
    </section>
  );
};
