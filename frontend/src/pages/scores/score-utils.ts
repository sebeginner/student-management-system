import type {
  ScoreDetail,
  ScoreSheet,
  TeacherAssignment,
} from '../../lib/academic-api';
import type { AuthUser } from '../../lib/auth-store';

export const scoreErrorMessages: Record<string, string> = {
  SCORE_INVALID_RANGE: 'Diem phai nam trong khoang cho phep.',
  SCORE_SHEET_LOCKED: 'Bang diem da khoa, khong the sua truc tiep.',
  NOT_SUBJECT_TEACHER: 'Ban khong phai GVBM cua lop/mon/hoc ky nay.',
  STUDENT_NOT_IN_CLASS: 'Hoc sinh khong thuoc lop trong hoc ky nay.',
  SCORE_SHEET_SUBMIT_MISSING_REQUIRED_SCORES:
    'Bang diem con thieu diem giua ky hoac cuoi ky.',
  SCORE_SHEET_NOT_SUBMITTED: 'Chi duoc khoa bang diem da submit.',
  SCORE_CHANGE_REQUEST_DUPLICATED:
    'Da co yeu cau sua diem dang cho xu ly cho cot diem nay.',
  SCORE_CHANGE_REQUEST_ALREADY_PROCESSED: 'Yeu cau sua diem da duoc xu ly.',
  ONLY_ACADEMIC_STAFF_CAN_APPROVE:
    'Chi giao vu duoc duyet yeu cau sua diem.',
};

export const assessmentColumns = [
  { key: 'oral', label: 'Oral/15m', testTypeCode: 'ORAL_15M', attemptNo: 1 },
  {
    key: 'onePeriod',
    label: 'One period',
    testTypeCode: 'ONE_PERIOD',
    attemptNo: 1,
  },
  { key: 'midterm', label: 'Midterm', testTypeCode: 'MIDTERM', attemptNo: 1 },
  { key: 'final', label: 'Final', testTypeCode: 'FINAL', attemptNo: 1 },
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
