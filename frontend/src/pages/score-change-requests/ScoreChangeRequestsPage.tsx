import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  academicApi,
  type ScoreChangeRequest,
  type ScoreChangeRequestStatus,
} from '../../lib/academic-api';
import { getApiErrorKey, getApiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { formatDisplayDate } from '../../lib/date';
import { useToastStore } from '../../lib/toast-store';
import { scoreErrorMessages } from '../scores/score-utils';

type ReviewAction = 'APPROVE' | 'REJECT';

const statusOptions: Array<ScoreChangeRequestStatus | ''> = [
  '',
  'PENDING',
  'APPROVED',
  'REJECTED',
];

const statusClasses: Record<ScoreChangeRequestStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800',
  APPROVED: 'bg-emerald-50 text-emerald-800',
  REJECTED: 'bg-red-50 text-red-800',
};

const getRequestErrorMessage = (error: unknown) => {
  const errorKey = getApiErrorKey(error);

  return errorKey
    ? scoreErrorMessages[errorKey] ?? getApiErrorMessage(error)
    : getApiErrorMessage(error);
};

export const ScoreChangeRequestsPage = () => {
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const canReview = user?.role === 'ACADEMIC_STAFF';
  const [requests, setRequests] = useState<ScoreChangeRequest[]>([]);
  const [status, setStatus] = useState<ScoreChangeRequestStatus | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [reviewTarget, setReviewTarget] =
    useState<ScoreChangeRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<ReviewAction>('APPROVE');
  const [reviewNote, setReviewNote] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await academicApi.getScoreChangeRequests({
        status: status || undefined,
      });
      setRequests(data);
    } catch (error) {
      showToast(getRequestErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, status]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const openReview = (
    request: ScoreChangeRequest,
    action: ReviewAction,
  ) => {
    setReviewTarget(request);
    setReviewAction(action);
    setReviewNote('');
  };

  const handleReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reviewTarget) {
      return;
    }

    setIsReviewing(true);

    try {
      if (reviewAction === 'APPROVE') {
        await academicApi.approveScoreChangeRequest(reviewTarget.id, {
          reviewNote: reviewNote.trim() || undefined,
        });
        showToast('Score change request approved.', 'success');
      } else {
        await academicApi.rejectScoreChangeRequest(reviewTarget.id, {
          rejectReason: reviewNote.trim() || undefined,
        });
        showToast('Score change request rejected.', 'success');
      }

      setReviewTarget(null);
      setReviewNote('');
      await loadRequests();
    } catch (error) {
      showToast(getRequestErrorMessage(error), 'error');
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Score Change Requests
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {canReview
              ? 'Review score correction requests after score sheets are locked.'
              : 'View the score correction requests you submitted.'}
          </p>
        </div>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Status</span>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as ScoreChangeRequestStatus | '')
            }
            className="w-44 rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option || 'ALL'} value={option}>
                {option || 'All'}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="min-w-[1080px] divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Sheet</th>
              <th className="px-4 py-3">Score field</th>
              <th className="px-4 py-3">Old</th>
              <th className="px-4 py-3">New</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Requested by</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                  Loading score change requests...
                </td>
              </tr>
            ) : null}

            {!isLoading && requests.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                  No score change requests found.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {request.studentSubjectScore.student.studentCode}
                      <div className="font-normal text-slate-600">
                        {request.studentSubjectScore.student.fullName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {request.scoreSheet.class.name} -{' '}
                      {request.scoreSheet.subject.name}
                      <div className="text-slate-500">
                        {request.scoreSheet.semester.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {request.testType.code} #{request.attemptNo}
                    </td>
                    <td className="px-4 py-3">{request.oldScore}</td>
                    <td className="px-4 py-3">{request.newScore}</td>
                    <td className="max-w-60 px-4 py-3">{request.reason}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-1 text-xs font-semibold ${
                          statusClasses[request.status]
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {request.requestedBy?.fullName ??
                        request.requestedBy?.username ??
                        request.requestedById}
                    </td>
                    <td className="px-4 py-3">
                      {formatDisplayDate(request.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canReview && request.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openReview(request, 'APPROVE')}
                            className="rounded border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => openReview(request, 'REJECT')}
                            className="rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>

      {reviewTarget ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded bg-white p-6 shadow-lg">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {reviewAction === 'APPROVE'
                  ? 'Approve request'
                  : 'Reject request'}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {reviewTarget.scoreSheet.class.name} -{' '}
                {reviewTarget.scoreSheet.subject.name}:{' '}
                {reviewTarget.oldScore} {'->'} {reviewTarget.newScore}
              </p>
            </div>

            <form onSubmit={handleReview} className="space-y-4">
              <label className="block space-y-1 text-sm font-medium text-slate-700">
                <span>
                  {reviewAction === 'APPROVE' ? 'Review note' : 'Reject reason'}
                </span>
                <textarea
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  className="min-h-24 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </label>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewTarget(null)}
                  className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReviewing}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-blue-300"
                >
                  {isReviewing ? 'Saving...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
};
