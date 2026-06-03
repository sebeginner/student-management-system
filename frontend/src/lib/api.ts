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
  CLASS_FULL: 'Lớp đã đủ sĩ số.',
  STUDENT_ALREADY_ENROLLED: 'Học sinh đã được phân lớp.',
  INVALID_TRANSFER_DIFFERENT_GRADE: 'Chỉ được chuyển sang lớp cùng khối.',
  HOMEROOM_ALREADY_ASSIGNED: 'Lớp này đã có giáo viên chủ nhiệm.',
  SUBJECT_TEACHER_ALREADY_ASSIGNED: 'Môn/lớp/học kỳ này đã có giáo viên bộ môn.',
  INVALID_HOMEROOM_ASSIGNMENT: 'Phân công GVCN không hợp lệ.',
  INVALID_SUBJECT_ASSIGNMENT: 'Phân công GVBM không hợp lệ.',
  SCORE_INVALID_RANGE: 'Điểm phải nằm trong khoảng hợp lệ.',
  SCORE_SHEET_LOCKED: 'Bảng điểm đã khóa, không thể sửa trực tiếp.',
  SCORE_SHEET_NOT_SUBMITTED: 'Chỉ có thể khóa bảng điểm đã gửi.',
  SCORE_SHEET_SUBMIT_MISSING_REQUIRED_SCORES:
    'Cần nhập đủ điểm bắt buộc trước khi submit.',
  STUDENT_NOT_IN_CLASS: 'Học sinh không thuộc lớp của bảng điểm.',
  NOT_SUBJECT_TEACHER: 'Giáo viên không phụ trách môn/lớp này.',
  SCORE_CHANGE_REQUEST_DUPLICATED:
    'Đã có yêu cầu sửa điểm đang chờ xử lý cho điểm này.',
  REPORT_DATA_NOT_READY: 'Chưa có dữ liệu sẵn sàng để lập báo cáo.',
  SCORE_SHEET_NOT_LOCKED: 'Báo cáo chính thức chỉ dùng bảng điểm đã khóa.',
  FORBIDDEN_REPORT_SCOPE: 'Không có quyền xem báo cáo trong phạm vi này.',
  NOT_STUDENT_OWNER: 'Học sinh chỉ được xem điểm của chính mình.',
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
    if (!error.response) {
      return 'Không kết nối được tới máy chủ. Vui lòng kiểm tra backend hoặc cấu hình API.';
    }

    const data = error.response?.data;
    const errorKey = getNestedErrorKey(data);
    const message = normalizeApiMessage(data?.message);

    return (errorKey && apiErrorMessages[errorKey]) || message || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Đã có lỗi xảy ra.';
};

export const getApiErrorKey = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return undefined;
  }

  return getNestedErrorKey(error.response?.data);
};

export const getResponseData = <T>(payload: { data: T }) => payload.data;
