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
  isActive: boolean;
}

export interface Semester {
  id: number;
  name: string;
  schoolYearId: number;
  isActive: boolean;
  schoolYear?: SchoolYear;
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

export const academicApi = {
  async getStudents(params?: { keyword?: string; status?: string }) {
    const response = await api.get<ApiSuccess<Student[]> | Student[]>('/students', {
      params,
    });

    return getResponseData(response.data);
  },

  async createStudent(payload: StudentPayload) {
    const response = await api.post<ApiSuccess<Student> | Student>(
      '/students',
      payload,
    );

    return getResponseData(response.data);
  },

  async updateStudent(id: number, payload: Partial<StudentPayload>) {
    const response = await api.patch<ApiSuccess<Student> | Student>(
      `/students/${id}`,
      payload,
    );

    return getResponseData(response.data);
  },

  async getClasses(params?: { keyword?: string }) {
    const response = await api.get<ApiSuccess<SchoolClass[]> | SchoolClass[]>(
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
    const response = await api.get<ApiSuccess<Teacher[]> | Teacher[]>(
      '/teachers',
      { params },
    );

    return getResponseData(response.data);
  },

  async createTeacher(payload: TeacherPayload) {
    const response = await api.post<ApiSuccess<Teacher> | Teacher>(
      '/teachers',
      payload,
    );

    return getResponseData(response.data);
  },

  async updateTeacher(id: number, payload: Partial<TeacherPayload>) {
    const response = await api.patch<ApiSuccess<Teacher> | Teacher>(
      `/teachers/${id}`,
      payload,
    );

    return getResponseData(response.data);
  },

  async getClass(id: number) {
    const response = await api.get<ApiSuccess<SchoolClass> | SchoolClass>(
      `/classes/${id}`,
    );

    return getResponseData(response.data);
  },

  async createClass(payload: ClassPayload) {
    const response = await api.post<ApiSuccess<SchoolClass> | SchoolClass>(
      '/classes',
      payload,
    );

    return getResponseData(response.data);
  },

  async updateClass(id: number, payload: Partial<ClassPayload>) {
    const response = await api.patch<ApiSuccess<SchoolClass> | SchoolClass>(
      `/classes/${id}`,
      payload,
    );

    return getResponseData(response.data);
  },

  async getClassStudents(id: number) {
    const response = await api.get<
      ApiSuccess<ClassStudentRow[]> | ClassStudentRow[]
    >(`/classes/${id}/students`);

    return getResponseData(response.data);
  },

  async getSchoolYears() {
    const response = await api.get<ApiSuccess<SchoolYear[]> | SchoolYear[]>(
      '/academic-years',
    );

    return getResponseData(response.data);
  },

  async getSemesters() {
    const response = await api.get<ApiSuccess<Semester[]> | Semester[]>(
      '/semesters',
    );

    return getResponseData(response.data);
  },

  async getGradeLevels() {
    const response = await api.get<ApiSuccess<GradeLevel[]> | GradeLevel[]>(
      '/grade-levels',
    );

    return getResponseData(response.data);
  },

  async getSubjects() {
    const response = await api.get<ApiSuccess<Subject[]> | Subject[]>(
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
      ApiSuccess<TeacherAssignment[]> | TeacherAssignment[]
    >('/teacher-assignments', { params });

    return getResponseData(response.data);
  },

  async getMyTeacherAssignments() {
    const response = await api.get<
      ApiSuccess<TeacherAssignment[]> | TeacherAssignment[]
    >('/me/teacher-assignments');

    return getResponseData(response.data);
  },

  async createTeacherAssignment(payload: TeacherAssignmentPayload) {
    const response = await api.post<
      ApiSuccess<TeacherAssignment> | TeacherAssignment
    >('/teacher-assignments', payload);

    return getResponseData(response.data);
  },

  async updateTeacherAssignment(
    id: number,
    payload: Partial<TeacherAssignmentPayload>,
  ) {
    const response = await api.patch<
      ApiSuccess<TeacherAssignment> | TeacherAssignment
    >(`/teacher-assignments/${id}`, payload);

    return getResponseData(response.data);
  },

  async getScoreSheets(params?: {
    classId?: number;
    subjectId?: number;
    semesterId?: number;
    status?: ScoreSheetStatus;
  }) {
    const response = await api.get<ApiSuccess<ScoreSheet[]> | ScoreSheet[]>(
      '/scores/sheets',
      { params },
    );

    return getResponseData(response.data);
  },

  async getScoreSheet(id: number) {
    const response = await api.get<ApiSuccess<ScoreSheet> | ScoreSheet>(
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
      ApiSuccess<StudentSubjectScore> | StudentSubjectScore
    >(`/scores/sheets/${scoreSheetId}/students/${studentId}`, payload);

    return getResponseData(response.data);
  },

  async submitScoreSheet(id: number) {
    const response = await api.post<ApiSuccess<ScoreSheet> | ScoreSheet>(
      `/scores/sheets/${id}/submit`,
    );

    return getResponseData(response.data);
  },

  async lockScoreSheet(id: number) {
    const response = await api.post<ApiSuccess<ScoreSheet> | ScoreSheet>(
      `/scores/sheets/${id}/lock`,
    );

    return getResponseData(response.data);
  },

  async getScoreChangeRequests(params?: {
    status?: ScoreChangeRequestStatus;
    scoreSheetId?: number;
  }) {
    const response = await api.get<
      ApiSuccess<ScoreChangeRequest[]> | ScoreChangeRequest[]
    >('/score-change-requests', { params });

    return getResponseData(response.data);
  },

  async createScoreChangeRequest(payload: CreateScoreChangeRequestPayload) {
    const response = await api.post<
      ApiSuccess<ScoreChangeRequest> | ScoreChangeRequest
    >('/score-change-requests', payload);

    return getResponseData(response.data);
  },

  async approveScoreChangeRequest(
    id: number,
    payload: ReviewScoreChangeRequestPayload,
  ) {
    const response = await api.post<
      ApiSuccess<ScoreChangeRequest> | ScoreChangeRequest
    >(`/score-change-requests/${id}/approve`, payload);

    return getResponseData(response.data);
  },

  async rejectScoreChangeRequest(
    id: number,
    payload: ReviewScoreChangeRequestPayload,
  ) {
    const response = await api.post<
      ApiSuccess<ScoreChangeRequest> | ScoreChangeRequest
    >(`/score-change-requests/${id}/reject`, payload);

    return getResponseData(response.data);
  },

  async getMyScores() {
    const response = await api.get<ApiSuccess<MyStudentScore[]> | MyStudentScore[]>(
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
      ApiSuccess<DashboardSummaryReport> | DashboardSummaryReport
    >('/reports/dashboard-summary', { params });

    return getResponseData(response.data);
  },

  async getClassSemesterReport(params: {
    classId: number;
    semesterId: number;
    includeUnOfficial?: boolean;
  }) {
    const response = await api.get<
      ApiSuccess<ClassSemesterReport> | ClassSemesterReport
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
      ApiSuccess<SubjectSummaryReport> | SubjectSummaryReport
    >('/reports/subject-summary', { params });

    return getResponseData(response.data);
  },

  async assignEnrollment(payload: AssignEnrollmentPayload) {
    const response = await api.post<ApiSuccess<Enrollment> | Enrollment>(
      '/enrollments/assign',
      payload,
    );

    return getResponseData(response.data);
  },

  async transferEnrollment(payload: TransferEnrollmentPayload) {
    const response = await api.post<ApiSuccess<Enrollment> | Enrollment>(
      '/enrollments/transfer',
      payload,
    );

    return getResponseData(response.data);
  },
};
