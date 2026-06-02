import { getApiErrorKey, getApiErrorMessage } from '../../lib/api';

export const reportErrorMessages: Record<string, string> = {
  REPORT_DATA_NOT_READY: 'Chua co du lieu san sang de lap bao cao.',
  SCORE_SHEET_NOT_LOCKED: 'Bao cao chinh thuc chi dung bang diem da khoa.',
  FORBIDDEN_REPORT_SCOPE: 'Khong co quyen xem bao cao trong pham vi nay.',
  NOT_STUDENT_OWNER: 'Hoc sinh chi duoc xem diem cua chinh minh.',
};

export const getReportErrorMessage = (error: unknown) => {
  const errorKey = getApiErrorKey(error);

  return errorKey
    ? reportErrorMessages[errorKey] ?? getApiErrorMessage(error)
    : getApiErrorMessage(error);
};

export const formatNumber = (value?: number | null) =>
  value === null || value === undefined ? '-' : value.toFixed(2);
