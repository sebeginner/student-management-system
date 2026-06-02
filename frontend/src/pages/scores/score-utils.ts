import type {
  ScoreDetail,
  ScoreSheet,
  TeacherAssignment,
} from '../../lib/academic-api';
import type { AuthUser } from '../../lib/auth-store';

export const scoreErrorMessages: Record<string, string> = {
  SCORE_INVALID_RANGE: 'Điểm phải nằm trong khoảng cho phép.',
  SCORE_SHEET_LOCKED: 'Bảng điểm đã khóa, không thể sửa trực tiếp.',
  NOT_SUBJECT_TEACHER: 'Bạn không phải GVBM của lớp/môn/học kỳ này.',
  STUDENT_NOT_IN_CLASS: 'Học sinh không thuộc lớp trong học kỳ này.',
  SCORE_SHEET_SUBMIT_MISSING_REQUIRED_SCORES:
    'Bảng điểm còn thiếu điểm giữa kỳ hoặc cuối kỳ.',
  SCORE_SHEET_NOT_SUBMITTED: 'Chỉ được khóa bảng điểm đã nộp.',
  SCORE_CHANGE_REQUEST_DUPLICATED:
    'Đã có yêu cầu sửa điểm đang chờ xử lý cho cột điểm này.',
  SCORE_CHANGE_REQUEST_ALREADY_PROCESSED: 'Yêu cầu sửa điểm đã được xử lý.',
  ONLY_ACADEMIC_STAFF_CAN_APPROVE:
    'Chỉ giáo vụ được duyệt yêu cầu sửa điểm.',
};

export const assessmentColumns = [
  {
    key: 'oral',
    label: 'Miệng / 15 phút',
    testTypeCode: 'ORAL_15M',
    attemptNo: 1,
  },
  {
    key: 'onePeriod',
    label: 'Một tiết',
    testTypeCode: 'ONE_PERIOD',
    attemptNo: 1,
  },
  { key: 'midterm', label: 'Giữa kỳ', testTypeCode: 'MIDTERM', attemptNo: 1 },
  { key: 'final', label: 'Cuối kỳ', testTypeCode: 'FINAL', attemptNo: 1 },
];

export const isSubjectTeacherForSheet = (
  sheet: Pick<ScoreSheet, 'classId' | 'subjectId' | 'semesterId'>,
  assignments: TeacherAssignment[],
) =>
  assignments.some(
    (assignment) =>
      assignment.assignmentType === 'SUBJECT' &&
      assignment.isActive &&
      assignment.classId === sheet.classId &&
      assignment.subjectId === sheet.subjectId &&
      assignment.semesterId === sheet.semesterId,
  );

export const isHomeroomTeacherForSheet = (
  sheet: Pick<ScoreSheet, 'classId'>,
  assignments: TeacherAssignment[],
) =>
  assignments.some(
    (assignment) =>
      assignment.assignmentType === 'HOMEROOM' &&
      assignment.isActive &&
      assignment.classId === sheet.classId,
  );

export const canEditScoreSheet = (
  user: AuthUser | null,
  sheet: Pick<ScoreSheet, 'classId' | 'subjectId' | 'semesterId' | 'status'>,
  assignments: TeacherAssignment[],
) =>
  user?.role === 'TEACHER' &&
  sheet.status !== 'LOCKED' &&
  isSubjectTeacherForSheet(sheet, assignments);

export const scoreDetailKey = (testTypeCode: string, attemptNo = 1) =>
  `${testTypeCode}:${attemptNo}`;

export const scoreDetailsToMap = (details: ScoreDetail[]) => {
  const values: Record<string, string> = {};

  for (const detail of details) {
    values[scoreDetailKey(detail.testType.code, detail.attemptNo)] = String(
      detail.score,
    );
  }

  return values;
};

export const formatAverage = (value?: number | null) =>
  value === null || value === undefined ? '-' : value.toFixed(2);
