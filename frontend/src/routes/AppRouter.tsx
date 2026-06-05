import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import Login from '../Login';
import { AcademicYearsPage } from '../pages/academic-years/AcademicYearsPage';
import { SemestersPage } from '../pages/semesters/SemestersPage';
import { NotificationsPage } from '../pages/notifications/NotificationsPage';
import { ClassDetailPage } from '../pages/classes/ClassDetailPage';
import { ClassesPage } from '../pages/classes/ClassesPage';
import { EnrollmentsPage } from '../pages/enrollments/EnrollmentsPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ScoreChangeRequestsPage } from '../pages/score-change-requests/ScoreChangeRequestsPage';
import { ClassReportPage } from '../pages/reports/ClassReportPage';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { SemesterFinalizePage } from '../pages/reports/SemesterFinalizePage';
import { SubjectReportPage } from '../pages/reports/SubjectReportPage';
import { YearEndPage } from '../pages/reports/YearEndPage';
import { ScoreEntryPage } from '../pages/scores/ScoreEntryPage';
import { ScoreSheetsPage } from '../pages/scores/ScoreSheetsPage';
import { StudentsPage } from '../pages/students/StudentsPage';
import { MyScoresPage } from '../pages/student/MyScoresPage';
import { MyProfilePage } from '../pages/student/MyProfilePage';
import { MyTeacherAssignmentsPage } from '../pages/teacher-assignments/MyTeacherAssignmentsPage';
import { TeacherAssignmentsPage } from '../pages/teacher-assignments/TeacherAssignmentsPage';
import { TeachersPage } from '../pages/teachers/TeachersPage';
import { ParametersPage } from '../pages/parameters/ParametersPage';
import { UsersPage } from '../pages/admin/UsersPage';
import { RolesPage } from '../pages/admin/RolesPage';
import { AuditLogPage } from '../pages/admin/AuditLogPage';
import { ConductAssessmentPage } from '../pages/conduct/ConductAssessmentPage';
import { ConductReviewPage } from '../pages/conduct/ConductReviewPage';
import { TimetablePage } from '../pages/timetable/TimetablePage';
import { MyTimetablePage } from '../pages/timetable/MyTimetablePage';
import { ProtectedRoute } from './ProtectedRoute';

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'ACADEMIC_STAFF']} />}>
            <Route path="academic-years" element={<AcademicYearsPage />} />
            <Route path="semesters" element={<SemestersPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="users" element={<UsersPage />} />
            <Route path="roles" element={<RolesPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'ACADEMIC_STAFF']} />}>
            <Route path="audit-logs" element={<AuditLogPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
            <Route path="conduct-assessment" element={<ConductAssessmentPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['ACADEMIC_STAFF']} />}>
            <Route path="conduct-review" element={<ConductReviewPage />} />
            <Route path="timetable" element={<TimetablePage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['TEACHER', 'STUDENT']} />}>
            <Route path="my-timetable" element={<MyTimetablePage />} />
          </Route>
          <Route
            element={
              <ProtectedRoute allowedRoles={['ACADEMIC_STAFF', 'MANAGER']} />
            }
          >
            <Route
              path="students"
              element={<StudentsPage />}
            />
            <Route path="classes" element={<ClassesPage />} />
            <Route path="classes/:id" element={<ClassDetailPage />} />
          </Route>
          <Route
            element={
              <ProtectedRoute allowedRoles={['ACADEMIC_STAFF', 'MANAGER']} />
            }
          >
            <Route path="enrollments" element={<EnrollmentsPage mode="assign" />} />
            <Route path="transfer" element={<EnrollmentsPage mode="transfer" />} />
          </Route>
          <Route
            element={
              <ProtectedRoute
                allowedRoles={['ADMIN', 'ACADEMIC_STAFF', 'MANAGER']}
              />
            }
          >
            <Route path="parameters" element={<ParametersPage />} />
          </Route>
          <Route
            element={
              <ProtectedRoute allowedRoles={['ACADEMIC_STAFF', 'TEACHER']} />
            }
          >
            <Route path="scores" element={<ScoreSheetsPage mode="lookup" />} />
            <Route path="scores/sheets/:id" element={<ScoreEntryPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
            <Route path="score-entry" element={<ScoreSheetsPage mode="entry" />} />
          </Route>
          <Route
            element={
              <ProtectedRoute allowedRoles={['ACADEMIC_STAFF', 'MANAGER']} />
            }
          >
            <Route path="teachers" element={<TeachersPage />} />
            <Route
              path="teacher-assignments"
              element={<TeacherAssignmentsPage />}
            />
          </Route>
          <Route
            element={
              <ProtectedRoute allowedRoles={['ACADEMIC_STAFF', 'TEACHER']} />
            }
          >
            <Route
              path="score-change-requests"
              element={<ScoreChangeRequestsPage />}
            />
          </Route>
          <Route
            element={
              <ProtectedRoute allowedRoles={['ACADEMIC_STAFF', 'MANAGER']} />
            }
          >
            <Route path="reports" element={<ReportsPage />} />
            <Route path="semester-finalize" element={<SemesterFinalizePage />} />
            <Route path="year-end" element={<YearEndPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
            <Route
              path="my-assignments"
              element={<MyTeacherAssignmentsPage />}
            />
            <Route path="class-report" element={<ClassReportPage />} />
            <Route path="subject-report" element={<SubjectReportPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
            <Route path="my-profile" element={<MyProfilePage />} />
            <Route
              path="my-scores"
              element={<MyScoresPage />}
            />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
