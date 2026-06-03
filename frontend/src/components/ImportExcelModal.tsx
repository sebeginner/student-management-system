import { useRef, useState, type FormEvent } from 'react';
import { commonLabels } from '../lib/uiText';

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface Props {
  title: string;
  onClose: () => void;
  /** Returns { valid, errors } from the preview API */
  onPreview: (file: File) => Promise<{ valid: unknown[]; errors: ImportError[] }>;
  /** Called with the validated rows to commit */
  onCommit: (rows: unknown[]) => Promise<void>;
  onDownloadTemplate?: () => Promise<void>;
  description?: string;
}

type Phase = 'upload' | 'preview' | 'committing' | 'done';

export const ImportExcelModal = ({
  title, onClose, onPreview, onCommit, onDownloadTemplate, description,
}: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>('upload');
  const [validRows, setValidRows] = useState<unknown[]>([]);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [result, setResult] = useState<{ count: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePreview = async (e: FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setIsPreviewing(true);
    setErrorMsg('');
    try {
      const data = await onPreview(file);
      setValidRows(data.valid);
      setErrors(data.errors);
      setPhase('preview');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleCommit = async () => {
    if (validRows.length === 0) return;
    setPhase('committing');
    setErrorMsg('');
    try {
      await onCommit(validRows);
      setResult({ count: validRows.length });
      setPhase('done');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi import');
      setPhase('preview');
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        {phase === 'upload' ? (
          <form onSubmit={(e) => void handlePreview(e)} className="space-y-4">
            {onDownloadTemplate ? (
              <button type="button" onClick={() => void onDownloadTemplate()}
                className="text-sm text-blue-600 hover:underline">
                Tải file mẫu Excel
              </button>
            ) : null}
            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              <span>Chọn file Excel (.xlsx) *</span>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" required
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium" />
            </label>
            {errorMsg ? <p className="text-sm text-rose-600">{errorMsg}</p> : null}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium">{commonLabels.cancel}</button>
              <button type="submit" disabled={isPreviewing}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {isPreviewing ? 'Đang kiểm tra...' : 'Kiểm tra file'}
              </button>
            </div>
          </form>
        ) : phase === 'preview' ? (
          <div className="space-y-4">
            <div className="flex gap-4 text-sm">
              <span className="font-semibold text-emerald-700">{validRows.length} dòng hợp lệ</span>
              {errors.length > 0 ? <span className="font-semibold text-rose-600">{errors.length} lỗi</span> : null}
            </div>

            {errors.length > 0 ? (
              <div className="max-h-36 overflow-y-auto rounded-lg border border-rose-200 bg-rose-50 p-3">
                {errors.map((e, i) => (
                  <div key={i} className="text-xs text-rose-700">
                    Hàng {e.row} [{e.field}]: {e.message}
                  </div>
                ))}
              </div>
            ) : null}

            {errorMsg ? <p className="text-sm text-rose-600">{errorMsg}</p> : null}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setPhase('upload')}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium">Chọn lại</button>
              <button type="button" disabled={validRows.length === 0} onClick={() => void handleCommit()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Xác nhận import {validRows.length} dòng
              </button>
            </div>
          </div>
        ) : phase === 'committing' ? (
          <div className="py-8 text-center text-sm text-slate-500">Đang import...</div>
        ) : (
          <div className="space-y-4 text-center">
            <div className="text-4xl">✅</div>
            <p className="text-sm font-semibold text-emerald-700">
              Import thành công {result?.count} dòng!
            </p>
            <button type="button" onClick={onClose}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
