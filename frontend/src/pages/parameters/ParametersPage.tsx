import { useCallback, useEffect, useState } from 'react';
import {
  academicApi,
  type SystemParameter,
  type UpdateSystemParameterPayload,
} from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { formatDisplayDate } from '../../lib/date';
import { useToastStore } from '../../lib/toast-store';
import { commonLabels, menuLabels } from '../../lib/uiText';

interface FormState {
  minAge: string;
  maxAge: string;
  maxClassSize: string;
  minScore: string;
  maxScore: string;
  subjectPassScore: string;
  semesterPassScore: string;
}

const toForm = (p: SystemParameter): FormState => ({
  minAge: String(p.minAge),
  maxAge: String(p.maxAge),
  maxClassSize: String(p.maxClassSize),
  minScore: String(p.minScore),
  maxScore: String(p.maxScore),
  subjectPassScore: String(p.subjectPassScore),
  semesterPassScore: String(p.semesterPassScore),
});

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
}

const NumericField = ({ label, value, onChange, unit }: FieldProps) => (
  <label className="flex flex-col gap-1 text-sm">
    <span className="font-medium text-slate-700">{label}</span>
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-28 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
      {unit ? <span className="text-slate-500">{unit}</span> : null}
    </div>
  </label>
);

export const ParametersPage = () => {
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const canEdit =
    user?.role === 'ADMIN' || user?.role === 'ACADEMIC_STAFF';

  const [params, setParams] = useState<SystemParameter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingParam, setEditingParam] = useState<SystemParameter | null>(
    null,
  );
  const [form, setForm] = useState<FormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadParams = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await academicApi.getSystemParameters();
      setParams(data);
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadParams();
  }, [loadParams]);

  const openEdit = (param: SystemParameter) => {
    setEditingParam(param);
    setForm(toForm(param));
  };

  const closeEdit = () => {
    setEditingParam(null);
    setForm(null);
  };

  const set = (key: keyof FormState) => (value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!editingParam || !form) return;
    setIsSaving(true);
    try {
      const payload: UpdateSystemParameterPayload = {
        minAge: Number(form.minAge),
        maxAge: Number(form.maxAge),
        maxClassSize: Number(form.maxClassSize),
        minScore: Number(form.minScore),
        maxScore: Number(form.maxScore),
        subjectPassScore: Number(form.subjectPassScore),
        semesterPassScore: Number(form.semesterPassScore),
      };
      await academicApi.updateSystemParameter(editingParam.id, payload);
      showToast('Cập nhật tham số thành công.', 'success');
      closeEdit();
      await loadParams();
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">
          {menuLabels.parameters}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Cấu hình giới hạn tuổi, sĩ số lớp, thang điểm và điểm đạt theo từng
          năm học.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          {commonLabels.loading}
        </div>
      ) : params.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          {commonLabels.noData}
        </div>
      ) : (
        <div className="space-y-4">
          {params.map((param) => (
            <div
              key={param.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Năm học {param.schoolYear.name}
                  </h3>
                  {param.schoolYear.isActive ? (
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                      Đang áp dụng
                    </span>
                  ) : null}
                </div>
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => openEdit(param)}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    {commonLabels.edit}
                  </button>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-4">
                <Row label="Tuổi nhập học" value={`${param.minAge} – ${param.maxAge} tuổi`} />
                <Row label="Sĩ số tối đa" value={`${param.maxClassSize} học sinh`} />
                <Row label="Thang điểm" value={`${param.minScore} – ${param.maxScore}`} />
                <Row label="Điểm đạt môn" value={String(param.subjectPassScore)} />
                <Row label="Điểm đạt học kỳ" value={String(param.semesterPassScore)} />
                <Row label="Hiệu lực từ" value={formatDisplayDate(param.effectiveFrom)} />
                {param.effectiveTo ? (
                  <Row label="Hiệu lực đến" value={formatDisplayDate(param.effectiveTo)} />
                ) : (
                  <Row label="Hiệu lực đến" value="Không giới hạn" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingParam && form ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-5 text-lg font-semibold text-slate-900">
              Chỉnh sửa tham số – Năm học {editingParam.schoolYear.name}
            </h3>

            <div className="space-y-5">
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  Quy định học sinh
                </legend>
                <div className="flex flex-wrap gap-6">
                  <NumericField
                    label="Tuổi tối thiểu"
                    value={form.minAge}
                    onChange={set('minAge')}
                    unit="tuổi"
                  />
                  <NumericField
                    label="Tuổi tối đa"
                    value={form.maxAge}
                    onChange={set('maxAge')}
                    unit="tuổi"
                  />
                  <NumericField
                    label="Sĩ số tối đa / lớp"
                    value={form.maxClassSize}
                    onChange={set('maxClassSize')}
                    unit="học sinh"
                  />
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  Thang điểm
                </legend>
                <div className="flex flex-wrap gap-6">
                  <NumericField
                    label="Điểm tối thiểu"
                    value={form.minScore}
                    onChange={set('minScore')}
                  />
                  <NumericField
                    label="Điểm tối đa"
                    value={form.maxScore}
                    onChange={set('maxScore')}
                  />
                  <NumericField
                    label="Điểm đạt môn"
                    value={form.subjectPassScore}
                    onChange={set('subjectPassScore')}
                  />
                  <NumericField
                    label="Điểm đạt học kỳ"
                    value={form.semesterPassScore}
                    onChange={set('semesterPassScore')}
                  />
                </div>
              </fieldset>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEdit}
                disabled={isSaving}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {commonLabels.cancel}
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? commonLabels.saving : commonLabels.save}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-xs font-medium text-slate-500">{label}</dt>
    <dd className="mt-0.5 font-medium text-slate-900">{value}</dd>
  </div>
);
