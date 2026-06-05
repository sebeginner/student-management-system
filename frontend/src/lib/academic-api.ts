import { api, getResponseData } from './api';

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface SchoolYear {
  id: number;
  name: string;
  startYear: number;
  endYear: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  _count?: { semesters: number; classes: number; assignments: number };
}

export interface AcademicYearPayload {
  name: string;
  startYear: number;
  endYear: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface Semester {
  id: number;
  name: string;
  schoolYearId: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  schoolYear?: SchoolYear;
  _count?: { enrollments: number; scoreSheets: number; assignments: number };
}

export interface SemesterPayload {
  name: string;
  schoolYearId: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface Notification {
  id: number;
  title: string;
  content: string;
  targetRole: string | null;
  className: string | null;
  createdBy: string;
  createdAt: string;
  isRead: boolean;
}

export interface TeacherNotificationClass {
  id: number;
  name: string;
  classCode: string;
  type: 'HOMEROOM' | 'SUBJECT';
}

export interface NotificationManage {
  id: number;
  title: string;
  content: string;
  targetRole: string | null;
  createdBy: { fullName: string };
  createdAt: string;
  _count: { reads: number };
}

export interface NotificationPayload {
  title: string;
  content: string;
  targetRole?: string;
  classId?: number;
}

export interface GradeLevel {
  id: number;
  name: string;
  level: number;
  isActive: boolean;
}

export interface Subject {
  id: number;
  subjectCode: string;
  name: string;
  coefficient: number;
  description?: string | null;
  isActive: boolean;
}

export interface Teacher {
  id: number;
  teacherCode: string;
  fullName: string;
  subjectId: number;
  email?: string | null;
  phone?: string | null;
  status: string;
  subject?: Subject;
}

export interface Student {
  id: number;
  studentCode: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  admissionDate: string;
  address?: string | null;
  email?: string | null;
  status: string;
  note?: string | null;
  enrollments?: Enrollment[];
}

export interface SchoolClass {
  id: number;
  classCode: string;
  name: string;
  maxSize: number;
  currentSize: number;
  status: string;
  gradeLevelId: number;
  schoolYearId: number;
  homeroomTeacherId?: number | null;
  gradeLevel?: GradeLevel;
  schoolYear?: SchoolYear;
}

export interface Enrollment {
  id?: number;
  enrollmentId?: number;
  studentId: number;
  classId: number;
  semesterId: number;
  enrolledAt: string;
  endedAt?: string | null;
  status: string;
  reason?: string | null;
  student?: Student;
  class?: SchoolClass;
  semester?: Semester;
}

export interface ClassStudentRow {
  enrollmentId: number;
  enrolledAt: string;
  semester: Semester;
  student: Student;
}

export interface StudentPayload {
  studentCode: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  admissionDate: string;
  address?: string;
  email?: string;
  status?: string;
  note?: string;
}

export interface ClassPayload {
  className: string;
  schoolYearId: number;
  gradeLevelId: number;
  classCode?: string;
  maxSize?: number;
  status?: string;
  homeroomTeacherId?: number;
}

export interface AssignEnrollmentPayload {
  studentId: number;
  classId: number;
  semesterId: number;
  reason?: string;
}

export interface TransferEnrollmentPayload {
  studentId: number;
  fromClassId?: number;
  toClassId: number;
  semesterId: number;
  reason?: string;
}

export type TeacherAssignmentType = 'HOMEROOM' | 'SUBJECT';

export interface TeacherAssignment {
  id: number;
  teacherId: number;
  classId: number;
  subjectId: number | null;
  schoolYearId: number;
  semesterId: number | null;
  assignmentType: TeacherAssignmentType;
  isActive: boolean;
  createdAt?: string;
  teacher?: Teacher;
  class?: SchoolClass;
  subject?: Subject | null;
  schoolYear?: SchoolYear;
  semester?: Semester | null;
}

export interface TeacherPayload {
  teacherCode: string;
  fullName: string;
  subjectId: number;
  email?: string;
  phone?: string;
  status?: string;
}

export interface TeacherAssignmentPayload {
  teacherId: number;
  classId: number;
  schoolYearId: number;
  assignmentType: TeacherAssignmentType;
  subjectId?: number | null;
  semesterId?: number | null;
  isActive?: boolean;
}

export type ScoreSheetStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'LOCKED'
  | 'NEEDS_CORRECTION';

export interface TestType {
  id: number;
  code: string;
  name: string;
  defaultWeight: number;
  isMultiple: boolean;
}

export interface ScoreDetail {
  id: number;
  testTypeId: number;
  attemptNo: number;
  score: number;
  weightSnapshot: number;
  testType: TestType;
}

export interface StudentSubjectScore {
  id: number;
  scoreSheetId: number;
  studentId: number;
  averageScore?: number | null;
  passStatus?: boolean | null;
  calculatedAt?: string | null;
  student: Student;
  scoreDetails: ScoreDetail[];
}

export interface ScoreSheet {
  id: number;
  classId: number;
  subjectId: number;
  semesterId: number;
  status: ScoreSheetStatus;
  createdBy?: number | null;
  lockedAt?: string | null;
  submittedAt?: string | null;
  class: SchoolClass;
  subject: Subject;
  semester: Semester;
  studentScores: StudentSubjectScore[];
}

export interface ScoreDetailPayload {
  testTypeCode: string;
  attemptNo?: number;
  score: number;
}

export interface UpdateStudentScorePayload {
  details: ScoreDetailPayload[];
}

export type ScoreChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ScoreChangeRequest {
  id: number;
  scoreSheetId: number;
  studentSubjectScoreId: number;
  scoreDetailId?: number | null;
  testTypeId: number;
  attemptNo: number;
  oldScore: number;
  newScore: number;
  reason: string;
  status: ScoreChangeRequestStatus;
  requestedById: number;
  reviewedById?: number | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  updatedAt: string;
  scoreSheet: ScoreSheet;
  studentSubjectScore: StudentSubjectScore;
  scoreDetail?: ScoreDetail | null;
  testType: TestType;
  requestedBy?: {
    id: number;
    username: string;
    fullName: string;
    teacherId?: number | null;
  };
  reviewedBy?: {
    id: number;
    username: string;
    fullName: string;
  } | null;
}

export interface CreateScoreChangeRequestPayload {
  scoreSheetId: number;
  studentId: number;
  scoreType: string;
  testTypeCode?: string;
  attemptNo?: number;
  oldValue: number;
  newValue: number;
  reason: string;
}

export interface ReviewScoreChangeRequestPayload {
  reviewNote?: string;
  rejectReason?: string;
}

export interface MyStudentScore {
  id: number;
  scoreSheetId: number;
  studentId: number;
  averageScore?: number | null;
  passStatus?: boolean | null;
  calculatedAt?: string | null;
  scoreSheet: ScoreSheet;
  scoreDetails: ScoreDetail[];
}

export interface DashboardSummaryReport {
  schoolYear: SchoolYear;
  semester: Semester;
  isOfficial: boolean;
  studentCount: number;
  classCount: number;
  subjectCount: number;
  scoreSheetCount: number;
  lockedScoreSheetCount: number;
  pendingScoreChangeRequestCount: number;
}

export interface ClassSemesterStudentSummary {
  studentId: number;
  studentCode: string;
  fullName: string;
  subjectCount: number;
  semesterAverage: number | null;
  result: 'PASS' | 'FAIL';
}

export interface ClassSemesterReport {
  class: SchoolClass;
  semesterId: number;
  isOfficial: boolean;
  studentCount: number;
  classSemesterAverage: number | null;
  passCount: number;
  failCount: number;
  students: ClassSemesterStudentSummary[];
}

export interface SubjectSummaryReportDetail {
  classId: number;
  className: string;
  subjectId: number;
  subjectName: string;
  semesterId: number;
  isOfficial: boolean;
  studentCount: number;
  subjectAverage: number | null;
  passCount: number;
  passRate: number;
}

export interface SubjectSummaryReport {
  subjectId: number;
  semesterId: number;
  isOfficial: boolean;
  details: SubjectSummaryReportDetail[];
}

export interface SystemParameter {
  id: number;
  schoolYearId: number;
  minAge: number;
  maxAge: number;
  maxClassSize: number;
  minScore: number;
  maxScore: number;
  subjectPassScore: number;
  semesterPassScore: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  schoolYear: SchoolYear;
}

export interface UpdateSystemParameterPayload {
  minAge?: number;
  maxAge?: number;
  maxClassSize?: number;
  minScore?: number;
  maxScore?: number;
  subjectPassScore?: number;
  semesterPassScore?: number;
  effectiveFrom?: string;
  effectiveTo?: string | null;
}

export interface SystemUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  status: string;
  lastLoginAt: string | null;
  roleId: number;
  studentId: number | null;
  teacherId: number | null;
  role: { id: number; name: string };
  student: { id: number; studentCode: string; fullName: string } | null;
  teacher: { id: number; teacherCode: string; fullName: string } | null;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  fullName: string;
  roleName: string;
  studentId?: number;
  teacherId?: number;
}

export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
  status?: string;
  roleName?: string;
  studentId?: number | null;
  teacherId?: number | null;
}

export interface ResetPasswordPayload {
  newPassword: string;
}

export const ACADEMIC_RATING_LABELS: Record<string, string> = {
  EXCELLENT: 'Giỏi',
  GOOD: 'Khá',
  AVERAGE: 'Trung bình',
  WEAK: 'Yếu',
  POOR: 'Kém',
};

export const CONDUCT_RATING_LABELS: Record<string, string> = {
  EXCELLENT: 'Tốt',
  GOOD: 'Khá',
  AVERAGE: 'Trung bình',
  WEAK: 'Yếu',
};

export const YEAR_END_DECISION_LABELS: Record<string, string> = {
  ADVANCE: 'Lên lớp',
  REMEDIAL: 'Thi lại',
  CONDUCT_REVIEW: 'Rèn luyện hè',
  RETAIN: 'Ở lại',
};

export interface SemesterStudentResult {
  id: number;
  studentId: number;
  semesterId: number;
  classId: number;
  semesterAverage: number;
  academicRating: string;
  subjectCount: number;
  failedSubjectCount: number;
  finalizedAt: string;
  student: { id: number; studentCode: string; fullName: string; gender: string };
  class: { id: number; name: string };
}

export interface YearEndResult {
  id: number;
  studentId: number;
  schoolYearId: number;
  classId: number;
  hk1Average: number;
  hk2Average: number;
  yearAverage: number;
  academicRating: string;
  conductRating: string | null;
  decision: string;
  decisionNote: string | null;
  generatedAt: string;
  student: { id: number; studentCode: string; fullName: string; gender: string };
  class: { id: number; name: string };
  schoolYear: { name: string };
}

export interface ConductAssessment {
  id: number;
  studentId: number;
  semesterId: number;
  classId: number;
  status: string;
  finalRating: string | null;
  teacherNote: string | null;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  student: { id: number; studentCode: string; fullName: string; gender: string };
  class: { id: number; name: string };
  semester: Semester;
  criteria: { id: number; code: string; rating: string; note: string | null }[];
}

export interface TimetableSlot {
  id: number;
  semesterId: number;
  classId: number;
  subjectId: number;
  teacherId: number;
  dayOfWeek: number;
  period: number;
  room: string | null;
  isActive: boolean;
  class:   { id: number; name: string };
  subject: { id: number; name: string; subjectCode: string };
  teacher: { id: number; teacherCode: string; fullName: string };
  semester: Semester;
}

export interface TimetableGrid {
  slots: TimetableSlot[];
  grid: Record<number, Record<number, TimetableSlot>>;
}

export interface AuditLogItem {
  id: number;
  action: string;
  entityType: string;
  entityId: number | null;
  oldValue: string | null;
  newValue: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { id: number; username: string; fullName: string } | null;
}

export interface AuditLogPage {
  total: number;
  page: number;
  limit: number;
  items: AuditLogItem[];
}

export const academicApi = {
  async getStudents(params?: { keyword?: string; status?: string }) {
    const response = await api.get<ApiSuccess<Student[]>>('/students', {
      params,
    });

    return getResponseData(response.data);
  },

  async createStudent(payload: StudentPayload) {
    const response = await api.post<ApiSuccess<Student>>(
      '/students',
      payload,
    );

    return getResponseData(response.data);
  },

  async updateStudent(id: number, payload: Partial<StudentPayload>) {
    const response = await api.patch<ApiSuccess<Student>>(
      `/students/${id}`,
      payload,
    );

    return getResponseData(response.data);
  },

  async getClasses(params?: { keyword?: string }) {
    const response = await api.get<ApiSuccess<SchoolClass[]>>(
      '/classes',
      { params },
    );

    return getResponseData(response.data);
  },

  async getTeachers(params?: {
    keyword?: string;
    subjectId?: number;
    status?: string;
  }) {
    const response = await api.get<ApiSuccess<Teacher[]>>(
      '/teachers',
      { params },
    );

    return getResponseData(response.data);
  },

  async createTeacher(payload: TeacherPayload) {
    const response = await api.post<ApiSuccess<Teacher>>(
      '/teachers',
      payload,
    );

    return getResponseData(response.data);
  },

  async updateTeacher(id: number, payload: Partial<TeacherPayload>) {
    const response = await api.patch<ApiSuccess<Teacher>>(
      `/teachers/${id}`,
      payload,
    );

    return getResponseData(response.data);
  },

  async getClass(id: number) {
    const response = await api.get<ApiSuccess<SchoolClass>>(
      `/classes/${id}`,
    );

    return getResponseData(response.data);
  },

  async createClass(payload: ClassPayload) {
    const response = await api.post<ApiSuccess<SchoolClass>>(
      '/classes',
      payload,
    );

    return getResponseData(response.data);
  },

  async updateClass(id: number, payload: Partial<ClassPayload>) {
    const response = await api.patch<ApiSuccess<SchoolClass>>(
      `/classes/${id}`,
      payload,
    );

    return getResponseData(response.data);
  },

  async getClassStudents(id: number) {
    const response = await api.get<
      ApiSuccess<ClassStudentRow[]>
    >(`/classes/${id}/students`);

    return getResponseData(response.data);
  },

  async getSchoolYears() {
    const response = await api.get<ApiSuccess<SchoolYear[]>>(
      '/academic-years',
    );

    return getResponseData(response.data);
  },

  async getSemesters() {
    const response = await api.get<ApiSuccess<Semester[]>>(
      '/semesters',
    );

    return getResponseData(response.data);
  },

  async getGradeLevels() {
    const response = await api.get<ApiSuccess<GradeLevel[]>>(
      '/grade-levels',
    );

    return getResponseData(response.data);
  },

  async getSubjects() {
    const response = await api.get<ApiSuccess<Subject[]>>(
      '/subjects',
    );

    return getResponseData(response.data);
  },

  async getTeacherAssignments(params?: {
    teacherId?: number;
    classId?: number;
    schoolYearId?: number;
    semesterId?: number;
    subjectId?: number;
    assignmentType?: TeacherAssignmentType;
    isActive?: boolean;
  }) {
    const response = await api.get<
      ApiSuccess<TeacherAssignment[]>
    >('/teacher-assignments', { params });

    return getResponseData(response.data);
  },

  async getMyTeacherAssignments() {
    const response = await api.get<
      ApiSuccess<TeacherAssignment[]>
    >('/me/teacher-assignments');

    return getResponseData(response.data);
  },

  async createTeacherAssignment(payload: TeacherAssignmentPayload) {
    const response = await api.post<
      ApiSuccess<TeacherAssignment>
    >('/teacher-assignments', payload);

    return getResponseData(response.data);
  },

  async updateTeacherAssignment(
    id: number,
    payload: Partial<TeacherAssignmentPayload>,
  ) {
    const response = await api.patch<
      ApiSuccess<TeacherAssignment>
    >(`/teacher-assignments/${id}`, payload);

    return getResponseData(response.data);
  },

  async getScoreSheets(params?: {
    classId?: number;
    subjectId?: number;
    semesterId?: number;
    status?: ScoreSheetStatus;
  }) {
    const response = await api.get<ApiSuccess<ScoreSheet[]>>(
      '/scores/sheets',
      { params },
    );

    return getResponseData(response.data);
  },

  async getScoreSheet(id: number) {
    const response = await api.get<ApiSuccess<ScoreSheet>>(
      `/scores/sheets/${id}`,
    );

    return getResponseData(response.data);
  },

  async updateStudentScore(
    scoreSheetId: number,
    studentId: number,
    payload: UpdateStudentScorePayload,
  ) {
    const response = await api.put<
      ApiSuccess<StudentSubjectScore>
    >(`/scores/sheets/${scoreSheetId}/students/${studentId}`, payload);

    return getResponseData(response.data);
  },

  async submitScoreSheet(id: number) {
    const response = await api.post<ApiSuccess<ScoreSheet>>(
      `/scores/sheets/${id}/submit`,
    );

    return getResponseData(response.data);
  },

  async lockScoreSheet(id: number) {
    const response = await api.post<ApiSuccess<ScoreSheet>>(
      `/scores/sheets/${id}/lock`,
    );

    return getResponseData(response.data);
  },

  async getScoreChangeRequests(params?: {
    status?: ScoreChangeRequestStatus;
    scoreSheetId?: number;
  }) {
    const response = await api.get<
      ApiSuccess<ScoreChangeRequest[]>
    >('/score-change-requests', { params });

    return getResponseData(response.data);
  },

  async createScoreChangeRequest(payload: CreateScoreChangeRequestPayload) {
    const response = await api.post<
      ApiSuccess<ScoreChangeRequest>
    >('/score-change-requests', payload);

    return getResponseData(response.data);
  },

  async approveScoreChangeRequest(
    id: number,
    payload: ReviewScoreChangeRequestPayload,
  ) {
    const response = await api.post<
      ApiSuccess<ScoreChangeRequest>
    >(`/score-change-requests/${id}/approve`, payload);

    return getResponseData(response.data);
  },

  async rejectScoreChangeRequest(
    id: number,
    payload: ReviewScoreChangeRequestPayload,
  ) {
    const response = await api.post<
      ApiSuccess<ScoreChangeRequest>
    >(`/score-change-requests/${id}/reject`, payload);

    return getResponseData(response.data);
  },

  async getMyScores() {
    const response = await api.get<ApiSuccess<MyStudentScore[]>>(
      '/scores/my-scores',
    );

    return getResponseData(response.data);
  },

  async getDashboardSummaryReport(params?: {
    schoolYearId?: number;
    semesterId?: number;
    includeUnOfficial?: boolean;
  }) {
    const response = await api.get<
      ApiSuccess<DashboardSummaryReport>
    >('/reports/dashboard-summary', { params });

    return getResponseData(response.data);
  },

  async getClassSemesterReport(params: {
    classId: number;
    semesterId: number;
    includeUnOfficial?: boolean;
  }) {
    const response = await api.get<
      ApiSuccess<ClassSemesterReport>
    >('/reports/class-semester', { params });

    return getResponseData(response.data);
  },

  async getSubjectSummaryReport(params: {
    subjectId: number;
    semesterId: number;
    classId?: number;
    includeUnOfficial?: boolean;
  }) {
    const response = await api.get<
      ApiSuccess<SubjectSummaryReport>
    >('/reports/subject-summary', { params });

    return getResponseData(response.data);
  },

  async getStudent(id: number) {
    const response = await api.get<ApiSuccess<Student>>(
      `/students/${id}`,
    );

    return getResponseData(response.data);
  },

  async assignEnrollment(payload: AssignEnrollmentPayload) {
    const response = await api.post<ApiSuccess<Enrollment>>(
      '/enrollments/assign',
      payload,
    );

    return getResponseData(response.data);
  },

  async transferEnrollment(payload: TransferEnrollmentPayload) {
    const response = await api.post<ApiSuccess<Enrollment>>(
      '/enrollments/transfer',
      payload,
    );

    return getResponseData(response.data);
  },

  async getSystemParameters() {
    const response = await api.get<
      ApiSuccess<SystemParameter[]>
    >('/system-parameters');

    return getResponseData(response.data);
  },

  async updateSystemParameter(id: number, payload: UpdateSystemParameterPayload) {
    const response = await api.patch<ApiSuccess<SystemParameter>>(
      `/system-parameters/${id}`,
      payload,
    );

    return getResponseData(response.data);
  },

  async getUsers(params?: { keyword?: string; roleName?: string; status?: string }) {
    const response = await api.get<ApiSuccess<SystemUser[]>>('/users', { params });
    return getResponseData(response.data);
  },

  async createUser(payload: CreateUserPayload) {
    const response = await api.post<ApiSuccess<SystemUser>>('/users', payload);
    return getResponseData(response.data);
  },

  async updateUser(id: number, payload: UpdateUserPayload) {
    const response = await api.patch<ApiSuccess<SystemUser>>(`/users/${id}`, payload);
    return getResponseData(response.data);
  },

  async resetUserPassword(id: number, payload: ResetPasswordPayload) {
    const response = await api.post<ApiSuccess<SystemUser>>(
      `/users/${id}/reset-password`,
      payload,
    );
    return getResponseData(response.data);
  },

  async getConductAssessments(params?: { semesterId?: number; classId?: number }) {
    const response = await api.get<ApiSuccess<ConductAssessment[]>>('/conduct-assessments', { params });
    return getResponseData(response.data);
  },

  async createConductBatch(semesterId: number, classId: number) {
    const response = await api.post<ApiSuccess<{ created: number; total: number }>>(
      '/conduct-assessments/batch',
      {},
      { params: { semesterId, classId } },
    );
    return getResponseData(response.data);
  },

  async updateConduct(id: number, payload: { criteria?: { code: string; rating: string; note?: string }[]; teacherNote?: string }) {
    const response = await api.patch<ApiSuccess<ConductAssessment>>(`/conduct-assessments/${id}`, payload);
    return getResponseData(response.data);
  },

  async submitConduct(id: number) {
    const response = await api.post<ApiSuccess<ConductAssessment>>(`/conduct-assessments/${id}/submit`);
    return getResponseData(response.data);
  },

  async finalizeConduct(id: number, payload: { finalRating: string; reviewNote?: string }) {
    const response = await api.post<ApiSuccess<ConductAssessment>>(`/conduct-assessments/${id}/finalize`, payload);
    return getResponseData(response.data);
  },

  async getStudentConduct(studentId: number) {
    const response = await api.get<ApiSuccess<ConductAssessment[]>>(`/conduct-assessments/students/${studentId}`);
    return getResponseData(response.data);
  },

  async finalizeSemester(semesterId: number) {
    const response = await api.post<ApiSuccess<{ semesterId: number; semesterName: string; schoolYear: string; studentCount: number }>>(
      `/semesters/${semesterId}/finalize`,
    );
    return getResponseData(response.data);
  },

  async getSemesterResults(semesterId: number, classId?: number) {
    const response = await api.get<ApiSuccess<SemesterStudentResult[]>>(
      `/semesters/${semesterId}/results`,
      { params: { classId } },
    );
    return getResponseData(response.data);
  },

  async generateYearEnd(schoolYearId: number) {
    const response = await api.post<ApiSuccess<{ schoolYearId: number; schoolYear: string; studentCount: number }>>(
      `/school-years/${schoolYearId}/year-end`,
    );
    return getResponseData(response.data);
  },

  async getYearEndResults(schoolYearId: number, classId?: number) {
    const response = await api.get<ApiSuccess<YearEndResult[]>>(
      '/reports/year-end',
      { params: { schoolYearId, classId } },
    );
    return getResponseData(response.data);
  },

  async downloadStudentTemplate(): Promise<void> {
    const response = await api.get('/templates/students', { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([response.data as BlobPart]));
    const a = document.createElement('a'); a.href = url; a.download = 'mau-hoc-sinh.xlsx'; a.click();
    URL.revokeObjectURL(url);
  },

  async downloadScoreSheetTemplate(sheetId: number): Promise<void> {
    const response = await api.get('/templates/score-sheet', { params: { sheetId }, responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([response.data as BlobPart]));
    const a = document.createElement('a'); a.href = url; a.download = `mau-diem-${sheetId}.xlsx`; a.click();
    URL.revokeObjectURL(url);
  },

  async previewStudentImport(file: File) {
    const fd = new FormData(); fd.append('file', file);
    const response = await api.post<ApiSuccess<{ valid: unknown[]; errors: { row: number; field: string; message: string }[] }>>(
      '/students/import/preview', fd, { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return getResponseData(response.data);
  },

  async commitStudentImport(data: unknown[]) {
    const response = await api.post<ApiSuccess<{ created: number }>>('/students/import/commit', { data });
    return getResponseData(response.data);
  },

  async previewScoreImport(sheetId: number, file: File) {
    const fd = new FormData(); fd.append('file', file);
    const response = await api.post<ApiSuccess<{ valid: unknown[]; errors: { row: number; field: string; message: string }[]; sheetInfo: { className: string; subjectName: string; semesterName: string } }>>(
      `/scores/sheets/${sheetId}/import/preview`, fd, { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return getResponseData(response.data);
  },

  async commitScoreImport(sheetId: number, data: unknown[]) {
    const response = await api.post<ApiSuccess<{ updated: number }>>(
      `/scores/sheets/${sheetId}/import/commit`, { data },
    );
    return getResponseData(response.data);
  },

  async downloadScoreSheetPdf(sheetId: number): Promise<void> {
    const response = await api.get(`/scores/sheets/${sheetId}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `bang-diem-${sheetId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async downloadStudentTranscriptPdf(studentId: number, semesterId: number): Promise<void> {
    const response = await api.get(
      `/reports/student-transcript/${studentId}/pdf`,
      { params: { semesterId }, responseType: 'blob' },
    );
    const url = URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `phieu-diem-${studentId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async getTimetable(semesterId: number, classId: number) {
    const response = await api.get<ApiSuccess<TimetableGrid>>('/timetable', { params: { semesterId, classId } });
    return getResponseData(response.data);
  },

  async getMyTimetable(semesterId: number) {
    const response = await api.get<ApiSuccess<TimetableGrid>>('/timetable/my', { params: { semesterId } });
    return getResponseData(response.data);
  },

  async upsertTimetableSlot(payload: {
    semesterId: number; classId: number; subjectId: number; teacherId: number;
    dayOfWeek: number; period: number; room?: string;
  }) {
    const response = await api.post<ApiSuccess<TimetableSlot>>('/timetable', payload);
    return getResponseData(response.data);
  },

  async deleteTimetableSlot(id: number) {
    const response = await api.delete<ApiSuccess<TimetableSlot>>(`/timetable/${id}`);
    return getResponseData(response.data);
  },

  async getAuditLogs(params?: {
    entityType?: string;
    entityId?: number;
    userId?: number;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await api.get<ApiSuccess<AuditLogPage>>('/audit-logs', { params });
    return getResponseData(response.data);
  },

  // ── Quản lý Năm học ─────────────────────────────────────────
  async createAcademicYear(payload: AcademicYearPayload) {
    const response = await api.post<ApiSuccess<SchoolYear>>('/academic-years', payload);
    return getResponseData(response.data);
  },

  async updateAcademicYear(id: number, payload: Partial<AcademicYearPayload>) {
    const response = await api.patch<ApiSuccess<SchoolYear>>(`/academic-years/${id}`, payload);
    return getResponseData(response.data);
  },

  // ── Quản lý Học kỳ ──────────────────────────────────────────
  async createSemester(payload: SemesterPayload) {
    const response = await api.post<ApiSuccess<Semester>>('/semesters', payload);
    return getResponseData(response.data);
  },

  async updateSemester(id: number, payload: Partial<SemesterPayload>) {
    const response = await api.patch<ApiSuccess<Semester>>(`/semesters/${id}`, payload);
    return getResponseData(response.data);
  },

  // ── Thông báo ────────────────────────────────────────────────
  async getNotifications() {
    const response = await api.get<ApiSuccess<Notification[]>>('/notifications');
    return getResponseData(response.data);
  },

  async getTeacherNotificationClasses() {
    const response = await api.get<ApiSuccess<TeacherNotificationClass[]>>('/notifications/teacher-classes');
    return getResponseData(response.data);
  },

  async getUnreadCount() {
    const response = await api.get<ApiSuccess<{ count: number }>>('/notifications/unread-count');
    return getResponseData(response.data);
  },

  async getNotificationsManage() {
    const response = await api.get<ApiSuccess<NotificationManage[]>>('/notifications/manage');
    return getResponseData(response.data);
  },

  async createNotification(payload: NotificationPayload) {
    const response = await api.post<ApiSuccess<NotificationManage>>('/notifications', payload);
    return getResponseData(response.data);
  },

  async markNotificationRead(id: number) {
    const response = await api.post<ApiSuccess<{ message: string }>>(`/notifications/${id}/read`, {});
    return getResponseData(response.data);
  },

  async deleteNotification(id: number) {
    const response = await api.delete<ApiSuccess<{ message: string }>>(`/notifications/${id}`);
    return getResponseData(response.data);
  },
};
