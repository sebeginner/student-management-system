import axios from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export const TOKEN_STORAGE_KEY = 'accessToken';
const LEGACY_TOKEN_STORAGE_KEY = 'access_token';

export const getAccessToken = () =>
  localStorage.getItem(TOKEN_STORAGE_KEY) ??
  localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY);

export const setAccessToken = (token: string) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
};

export const clearAccessToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const apiErrorMessages: Record<string, string> = {
  CLASS_FULL: 'Lop da du si so.',
  STUDENT_ALREADY_ENROLLED: 'Hoc sinh da duoc phan lop.',
  INVALID_TRANSFER_DIFFERENT_GRADE: 'Chi duoc chuyen sang lop cung khoi.',
  HOMEROOM_ALREADY_ASSIGNED: 'Lop nay da co giao vien chu nhiem.',
  SUBJECT_TEACHER_ALREADY_ASSIGNED: 'Mon/lop/hoc ky nay da co giao vien bo mon.',
  INVALID_HOMEROOM_ASSIGNMENT: 'Phan cong GVCN khong hop le.',
  INVALID_SUBJECT_ASSIGNMENT: 'Phan cong GVBM khong hop le.',
  SCORE_INVALID_RANGE: 'Diem phai nam trong khoang hop le.',
  SCORE_SHEET_LOCKED: 'Bang diem da khoa, khong the sua truc tiep.',
  SCORE_SHEET_NOT_SUBMITTED: 'Chi co the khoa bang diem da submit.',
  SCORE_SHEET_SUBMIT_MISSING_REQUIRED_SCORES:
    'Can nhap du diem bat buoc truoc khi submit.',
  STUDENT_NOT_IN_CLASS: 'Hoc sinh khong thuoc lop cua bang diem.',
  NOT_SUBJECT_TEACHER: 'Giao vien khong phu trach mon/lop nay.',
  SCORE_CHANGE_REQUEST_DUPLICATED:
    'Da co yeu cau sua diem dang cho xu ly cho diem nay.',
  REPORT_DATA_NOT_READY: 'Chua co du lieu san sang de lap bao cao.',
  SCORE_SHEET_NOT_LOCKED: 'Bao cao chinh thuc chi dung bang diem da khoa.',
  FORBIDDEN_REPORT_SCOPE: 'Khong co quyen xem bao cao trong pham vi nay.',
  NOT_STUDENT_OWNER: 'Hoc sinh chi duoc xem diem cua chinh minh.',
};

const getNestedErrorKey = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const data = payload as { errorKey?: unknown; message?: unknown };

  if (typeof data.errorKey === 'string') {
    return data.errorKey;
  }

  if (data.message && typeof data.message === 'object' && !Array.isArray(data.message)) {
    const nested = data.message as { errorKey?: unknown };

    if (typeof nested.errorKey === 'string') {
      return nested.errorKey;
    }
  }

  return undefined;
};

const normalizeApiMessage = (message: unknown): string | undefined => {
  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message)) {
    return message
      .map((item) => normalizeApiMessage(item))
      .filter(Boolean)
      .join(', ');
  }

  if (message && typeof message === 'object') {
    const nested = message as { message?: unknown; error?: unknown };
    return normalizeApiMessage(nested.message) ?? normalizeApiMessage(nested.error);
  }

  return undefined;
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearAccessToken();

      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  },
);

export const getApiErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const errorKey = getNestedErrorKey(data);
    const message = normalizeApiMessage(data?.message);

    return (errorKey && apiErrorMessages[errorKey]) || message || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Da co loi xay ra.';
};

export const getApiErrorKey = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return undefined;
  }

  return getNestedErrorKey(error.response?.data);
};

export const getResponseData = <T>(payload: T | { data: T }) => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
};
