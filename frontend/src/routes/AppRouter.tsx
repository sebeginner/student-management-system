import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import Login from '../Login';
import { ClassDetailPage } from '../pages/classes/ClassDetailPage';
import { ClassesPage } from '../pages/classes/ClassesPage';
import { EnrollmentsPage } from '../pages/enrollments/EnrollmentsPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ScoreChangeRequestsPage } from '../pages/score-change-requests/ScoreChangeRequestsPage';
import { ClassReportPage } from '../pages/reports/ClassReportPage';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { SubjectReportPage } from '../pages/reports/SubjectReportPage';
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
import { ProtectedRoute } from './ProtectedRoute';

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="users" element={<UsersPage />} />
            <Route path="roles" element={<RolesPage />} />
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
