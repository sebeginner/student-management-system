import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  academicApi,
  type ClassStudentRow,
  type SchoolClass,
} from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { formatDisplayDate } from '../../lib/date';
import { useToastStore } from '../../lib/toast-store';

export const ClassDetailPage = () => {
  const { id } = useParams();
  const showToast = useToastStore((state) => state.showToast);
  const classId = Number(id);
  const [classItem, setClassItem] = useState<SchoolClass | null>(null);
  const [students, setStudents] = useState<ClassStudentRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!classId) {
      return;
    }

    setIsLoading(true);

    try {
      const [classData, studentData] = await Promise.all([
        academicApi.getClass(classId),
        academicApi.getClassStudents(classId),
      ]);

      setClassItem(classData);
      setStudents(studentData);
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [classId, showToast]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/classes" className="text-sm font-medium text-blue-700">
            Back to classes
          </Link>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {classItem?.name ?? 'Class detail'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {classItem
              ? `${classItem.gradeLevel?.name ?? classItem.gradeLevelId} - ${
                  classItem.schoolYear?.name ?? classItem.schoolYearId
                } - ${classItem.currentSize}/${classItem.maxSize} students`
              : 'Loading class information...'}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Birth date</th>
              <th className="px-4 py-3">Semester</th>
              <th className="px-4 py-3">Enrolled at</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Loading class students...
                </td>
              </tr>
            ) : null}

            {!isLoading && students.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No active students in this class.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? students.map((row) => (
                  <tr key={row.enrollmentId}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.student.studentCode}
                    </td>
                    <td className="px-4 py-3">{row.student.fullName}</td>
                    <td className="px-4 py-3">{row.student.gender}</td>
                    <td className="px-4 py-3">
                      {formatDisplayDate(row.student.dateOfBirth)}
                    </td>
                    <td className="px-4 py-3">{row.semester.name}</td>
                    <td className="px-4 py-3">
                      {formatDisplayDate(row.enrolledAt)}
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    </section>
  );
};
