import { useMemo, useState, type FormEvent } from 'react';
import {
  academicApi,
  type ScoreSheet,
  type StudentSubjectScore,
} from '../../lib/academic-api';
import { getApiErrorKey, getApiErrorMessage } from '../../lib/api';
import { useToastStore } from '../../lib/toast-store';
import { commonLabels } from '../../lib/uiText';
import {
  assessmentColumns,
  scoreDetailKey,
  scoreErrorMessages,
} from './score-utils';

interface ScoreChangeRequestModalProps {
  scoreSheet: ScoreSheet;
  studentScore: StudentSubjectScore;
  onClose: () => void;
  onCreated: () => Promise<void>;
}

const getRequestErrorMessage = (error: unknown) => {
  const errorKey = getApiErrorKey(error);

  return errorKey
    ? scoreErrorMessages[errorKey] ?? getApiErrorMessage(error)
    : getApiErrorMessage(error);
};

export const ScoreChangeRequestModal = ({
  onClose,
  onCreated,
  scoreSheet,
  studentScore,
}: ScoreChangeRequestModalProps) => {
  const showToast = useToastStore((state) => state.showToast);
  const detailsByKey = useMemo(() => {
    const map = new Map<string, number>();

    for (const detail of studentScore.scoreDetails) {
      map.set(
        scoreDetailKey(detail.testType.code, detail.attemptNo),
        detail.score,
      );
    }

    return map;
  }, [studentScore.scoreDetails]);
  const editableColumns = assessmentColumns.filter((column) =>
    detailsByKey.has(scoreDetailKey(column.testTypeCode, column.attemptNo)),
  );
  const [selectedKey, setSelectedKey] = useState(() => {
    const firstColumn = editableColumns[0];
    return firstColumn
      ? scoreDetailKey(firstColumn.testTypeCode, firstColumn.attemptNo)
      : '';
  });
  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedColumn = assessmentColumns.find(
    (column) => scoreDetailKey(column.testTypeCode, column.attemptNo) === selectedKey,
  );
  const oldValue = selectedKey ? detailsByKey.get(selectedKey) : undefined;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedColumn || oldValue === undefined) {
      showToast('Không tìm thấy điểm thành phần cần sửa.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      await academicApi.createScoreChangeRequest({
        scoreSheetId: scoreSheet.id,
        studentId: studentScore.studentId,
        scoreType: selectedColumn.testTypeCode,
        testTypeCode: selectedColumn.testTypeCode,
        attemptNo: selectedColumn.attemptNo,
        oldValue,
        newValue: Number(newValue),
        reason: reason.trim(),
      });

      showToast('Tạo yêu cầu sửa điểm thành công.', 'success');
      await onCreated();
      onClose();
    } catch (error) {
      showToast(getRequestErrorMessage(error), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded bg-white p-6 shadow-lg">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Yêu cầu sửa điểm
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {studentScore.student.studentCode} - {studentScore.student.fullName}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1 text-sm font-medium text-slate-700">
            <span>Cột điểm</span>
            <select
              required
              value={selectedKey}
              onChange={(event) => {
                setSelectedKey(event.target.value);
                setNewValue('');
              }}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              {editableColumns.map((column) => (
                <option
                  key={column.key}
                  value={scoreDetailKey(column.testTypeCode, column.attemptNo)}
                >
                  {column.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-sm font-medium text-slate-700">
            <span>Điểm cũ</span>
            <input
              readOnly
              value={oldValue ?? ''}
              className="w-full rounded border border-slate-300 bg-slate-100 px-3 py-2 text-sm"
            />
          </label>

          <label className="block space-y-1 text-sm font-medium text-slate-700">
            <span>Điểm mới</span>
            <input
              required
              type="number"
              min={0}
              max={10}
              step={0.01}
              value={newValue}
              onChange={(event) => setNewValue(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block space-y-1 text-sm font-medium text-slate-700">
            <span>Lý do</span>
            <textarea
              required
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="min-h-24 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              {commonLabels.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || editableColumns.length === 0}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-blue-300"
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
