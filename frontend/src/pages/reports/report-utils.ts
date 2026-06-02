import { getApiErrorKey, getApiErrorMessage } from '../../lib/api';

export const reportErrorMessages: Record<string, string> = {
  REPORT_DATA_NOT_READY: 'Chưa có dữ liệu sẵn sàng để lập báo cáo.',
  SCORE_SHEET_NOT_LOCKED: 'Báo cáo chính thức chỉ dùng bảng điểm đã khóa.',
  FORBIDDEN_REPORT_SCOPE: 'Không có quyền xem báo cáo trong phạm vi này.',
  NOT_STUDENT_OWNER: 'Học sinh chỉ được xem điểm của chính mình.',
};

export const getReportErrorMessage = (error: unknown) => {
  const errorKey = getApiErrorKey(error);

  return errorKey
    ? reportErrorMessages[errorKey] ?? getApiErrorMessage(error)
    : getApiErrorMessage(error);
};

export const formatNumber = (value?: number | null) =>
  value === null || value === undefined ? '-' : value.toFixed(2);

export const formatPercent = (value?: number | null) =>
  value === null || value === undefined ? '-' : `${value.toFixed(1)}%`;

export const calculatePassRate = (passCount: number, studentCount: number) =>
  studentCount > 0 ? (passCount / studentCount) * 100 : 0;

export const calculateFailCount = (studentCount: number, passCount: number) =>
  Math.max(studentCount - passCount, 0);

export const reportColors = {
  pass: '#2563eb',
  fail: '#ef4444',
  average: '#f59e0b',
  total: '#0f766e',
};
