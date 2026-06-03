import { useCallback, useEffect, useState } from 'react';
import { academicApi, type MyStudentScore } from '../../lib/academic-api';
import { useAuthStore } from '../../lib/auth-store';
import { useToastStore } from '../../lib/toast-store';
import { menuLabels } from '../../lib/uiText';
import { assessmentColumns, scoreDetailKey } from '../scores/score-utils';
import { formatNumber, getReportErrorMessage } from '../reports/report-utils';

const detailValue = (score: MyStudentScore, code: string, attemptNo = 1) => {
  const detail = score.scoreDetails.find(
    (item) => item.testType.code === code && item.attemptNo === attemptNo,
  );

  return detail ? String(detail.score) : '-';
};

export const MyScoresPage = () => {
  const showToast = useToastStore((state) => state.showToast);
  const user = useAuthStore((s) => s.user);
  const [scores, setScores] = useState<MyStudentScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadScores = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await academicApi.getMyScores();
      setScores(data);
    } catch (error) {
      showToast(getReportErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadScores();
  }, [loadScores]);

  return (
    <section className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {menuLabels.myScores}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Điểm được tải từ tài khoản học sinh đang đăng nhập.
          </p>
        </div>
        {user?.studentId && scores.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {[...new Set(scores.map(s => s.scoreSheet.semesterId))].map(semId => {
              const sem = scores.find(s => s.scoreSheet.semesterId === semId)?.scoreSheet.semester;
              return (
                <button
                  key={semId}
                  type="button"
                  onClick={() => void academicApi.downloadStudentTranscriptPdf(user.studentId!, semId)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  PDF {sem?.name}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="min-w-[920px] divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Môn học</th>
              <th className="px-4 py-3">Lớp</th>
              <th className="px-4 py-3">Học kỳ</th>
              {assessmentColumns.map((column) => (
                <th key={scoreDetailKey(column.testTypeCode, column.attemptNo)} className="px-4 py-3">
                  {column.label}
                </th>
              ))}
              <th className="px-4 py-3">Điểm TB</th>
              <th className="px-4 py-3">Kết quả</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  Đang tải điểm...
                </td>
              </tr>
            ) : null}

            {!isLoading && scores.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  Chưa có dữ liệu điểm.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? scores.map((score) => (
                  <tr key={score.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {score.scoreSheet.subject.name}
                    </td>
                    <td className="px-4 py-3">{score.scoreSheet.class.name}</td>
                    <td className="px-4 py-3">
                      {score.scoreSheet.semester.schoolYear?.name ?? ''}{' '}
                      {score.scoreSheet.semester.name}
                    </td>
                    {assessmentColumns.map((column) => (
                      <td key={column.key} className="px-4 py-3">
                        {detailValue(score, column.testTypeCode, column.attemptNo)}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      {formatNumber(score.averageScore)}
                    </td>
                    <td className="px-4 py-3">
                      {score.passStatus === null || score.passStatus === undefined
                        ? '-'
                        : score.passStatus
                          ? 'Đạt'
                          : 'Chưa đạt'}
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
