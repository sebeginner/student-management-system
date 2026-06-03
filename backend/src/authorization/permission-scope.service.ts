import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types';
import { PrismaService } from '../prisma/prisma.service';

type ScoreSheetStatusInput = string | null | undefined;

@Injectable()
export class PermissionScopeService {
  constructor(protected readonly prisma: PrismaService) {}

  async isHomeroomTeacherOfClass(
    teacherId: number,
    classId: number,
    schoolYearId: number,
  ) {
    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: {
        teacherId,
        classId,
        schoolYearId,
        assignmentType: 'HOMEROOM',
        isActive: true,
      },
      select: { id: true },
    });

    return Boolean(assignment);
  }

  async isSubjectTeacherOfClass(
    teacherId: number,
    classId: number,
    subjectId: number,
    semesterId: number,
  ) {
    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: {
        teacherId,
        classId,
        subjectId,
        semesterId,
        assignmentType: 'SUBJECT',
        isActive: true,
      },
      select: { id: true },
    });

    return Boolean(assignment);
  }

  async getTeacherByUserId(userId: number) {
    return this.prisma.teacher.findFirst({
      where: { user: { id: userId } },
      include: {
        subject: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            status: true,
          },
        },
      },
    });
  }

  classScopeWhereForUser(user: AuthenticatedUser): Prisma.ClassWhereInput {
    if (this.canViewSchoolWide(user)) {
      return {};
    }

    if (user.role === 'TEACHER') {
      this.ensureTeacherLinked(user);
      return {
        assignments: {
          some: {
            teacherId: user.teacherId!,
            isActive: true,
          },
        },
      };
    }

    if (user.role === 'STUDENT') {
      this.ensureStudentLinked(user);
      return {
        enrollments: {
          some: {
            studentId: user.studentId!,
            status: 'ACTIVE',
          },
        },
      };
    }

    throw this.forbidden();
  }

  async studentScopeWhereForUser(
    user: AuthenticatedUser,
    requestedClassId?: number,
  ): Promise<Prisma.StudentWhereInput> {
    if (this.canViewSchoolWide(user)) {
      return {};
    }

    if (user.role === 'STUDENT') {
      this.ensureStudentLinked(user);
      return { id: user.studentId! };
    }

    if (user.role === 'TEACHER') {
      this.ensureTeacherLinked(user);
      const classIds = await this.getTeacherActiveClassIds(user.teacherId!);

      if (requestedClassId && !classIds.includes(requestedClassId)) {
        return { id: -1 };
      }

      if (classIds.length === 0) {
        return { id: -1 };
      }

      return {
        enrollments: {
          some: {
            status: 'ACTIVE',
            classId: { in: classIds },
          },
        },
      };
    }

    throw this.forbidden();
  }

  async canViewClassStudents(user: AuthenticatedUser, classId: number) {
    if (this.canViewSchoolWide(user)) {
      return true;
    }

    if (user.role === 'TEACHER') {
      this.ensureTeacherLinked(user);
      const hasAssignment = await this.hasAnyActiveClassAssignment(
        user.teacherId!,
        classId,
      );
      if (hasAssignment) {
        return true;
      }
      throw this.forbidden('FORBIDDEN', 'Khong co phan cong voi lop nay');
    }

    if (user.role === 'STUDENT') {
      this.ensureStudentLinked(user);
      const isEnrolled = await this.isStudentActiveInClass(
        user.studentId!,
        classId,
      );
      if (isEnrolled) {
        return true;
      }
      throw this.forbidden(
        'NOT_STUDENT_OWNER',
        'Hoc sinh chi duoc xem lop cua minh',
      );
    }

    throw this.forbidden();
  }

  async canViewStudentProfile(user: AuthenticatedUser, studentId: number) {
    if (this.canViewSchoolWide(user)) {
      return true;
    }

    if (user.role === 'STUDENT') {
      this.ensureStudentLinked(user);
      if (user.studentId === studentId) {
        return true;
      }
      throw this.forbidden(
        'NOT_STUDENT_OWNER',
        'Hoc sinh chi duoc xem ho so cua minh',
      );
    }

    if (user.role === 'TEACHER') {
      this.ensureTeacherLinked(user);
      const canView = await this.teacherHasActiveStudentInScope(
        user.teacherId!,
        studentId,
      );
      if (canView) {
        return true;
      }
      throw this.forbidden(
        'FORBIDDEN',
        'Giao vien khong co phan cong lien quan hoc sinh nay',
      );
    }

    throw this.forbidden();
  }

  async canViewStudentScores(user: AuthenticatedUser, studentId: number) {
    return this.canViewStudentProfile(user, studentId);
  }

  async canViewClassScores(user: AuthenticatedUser, classId: number) {
    if (this.canViewSchoolWide(user)) {
      return true;
    }

    if (user.role === 'TEACHER') {
      this.ensureTeacherLinked(user);
      const hasAssignment = await this.hasAnyActiveClassAssignment(
        user.teacherId!,
        classId,
      );
      if (hasAssignment) {
        return true;
      }
      throw this.forbidden(
        'FORBIDDEN',
        'Giao vien khong co phan cong voi lop nay',
      );
    }

    throw this.forbidden(
      'NOT_STUDENT_OWNER',
      'Hoc sinh chi duoc xem diem ca nhan',
    );
  }

  async canEditSubjectScore(
    user: AuthenticatedUser,
    classId: number,
    subjectId: number,
    semesterId: number,
    scoreSheetStatus: ScoreSheetStatusInput,
  ) {
    if (scoreSheetStatus === 'LOCKED') {
      throw this.forbidden('SCORE_SHEET_LOCKED', 'Bang diem da khoa');
    }

    if (this.canManageAcademicWorkflow(user)) {
      return true;
    }

    if (user.role === 'TEACHER') {
      this.ensureTeacherLinked(user);
      const isSubjectTeacher = await this.isSubjectTeacherOfClass(
        user.teacherId!,
        classId,
        subjectId,
        semesterId,
      );
      if (isSubjectTeacher) {
        return true;
      }
      throw this.forbidden(
        'NOT_SUBJECT_TEACHER',
        'Khong phai GVBM cua lop/mon/hoc ky nay',
      );
    }

    throw this.forbidden();
  }

  async canSubmitScoreSheet(
    user: AuthenticatedUser,
    classId: number,
    subjectId: number,
    semesterId: number,
  ) {
    if (this.canManageAcademicWorkflow(user)) {
      return true;
    }

    if (user.role === 'TEACHER') {
      this.ensureTeacherLinked(user);
      const isSubjectTeacher = await this.isSubjectTeacherOfClass(
        user.teacherId!,
        classId,
        subjectId,
        semesterId,
      );
      if (isSubjectTeacher) {
        return true;
      }
      throw this.forbidden(
        'NOT_SUBJECT_TEACHER',
        'Khong phai GVBM cua lop/mon/hoc ky nay',
      );
    }

    throw this.forbidden();
  }

  canLockScoreSheet(user: AuthenticatedUser) {
    if (this.canManageAcademicWorkflow(user)) {
      return true;
    }
    throw this.forbidden();
  }

  canApproveScoreChangeRequest(user: AuthenticatedUser) {
    if (this.canManageAcademicWorkflow(user)) {
      return true;
    }
    throw this.forbidden();
  }

  async canViewScoreChangeRequest(user: AuthenticatedUser, requestId: number) {
    if (this.canViewSchoolWide(user)) {
      return true;
    }

    if (user.role === 'TEACHER') {
      this.ensureTeacherLinked(user);
      const request = await this.prisma.scoreChangeRequest.findUnique({
        where: { id: requestId },
        include: { scoreSheet: true, requestedBy: true },
      });

      if (
        request &&
        (request.requestedBy.teacherId === user.teacherId ||
          (await this.isSubjectTeacherOfClass(
            user.teacherId!,
            request.scoreSheet.classId,
            request.scoreSheet.subjectId,
            request.scoreSheet.semesterId,
          )))
      ) {
        return true;
      }
    }

    throw this.forbidden();
  }

  private canViewSchoolWide(user: AuthenticatedUser) {
    return ['ADMIN', 'ACADEMIC_STAFF', 'MANAGER'].includes(user.role);
  }

  private canManageAcademicWorkflow(user: AuthenticatedUser) {
    return ['ADMIN', 'ACADEMIC_STAFF'].includes(user.role);
  }

  private ensureTeacherLinked(user: AuthenticatedUser) {
    if (!user.teacherId) {
      throw this.forbidden('FORBIDDEN', 'Khong co ho so giao vien lien ket');
    }
  }

  private ensureStudentLinked(user: AuthenticatedUser) {
    if (!user.studentId) {
      throw this.forbidden('FORBIDDEN', 'Khong co ho so hoc sinh lien ket');
    }
  }

  private async getTeacherActiveClassIds(teacherId: number) {
    const assignments = await this.prisma.teacherAssignment.findMany({
      where: { teacherId, isActive: true },
      select: { classId: true },
    });

    return [...new Set(assignments.map((assignment) => assignment.classId))];
  }

  private async hasAnyActiveClassAssignment(
    teacherId: number,
    classId: number,
  ) {
    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: {
        teacherId,
        classId,
        isActive: true,
      },
      select: { id: true },
    });

    return Boolean(assignment);
  }

  private async teacherHasActiveStudentInScope(
    teacherId: number,
    studentId: number,
  ) {
    const enrollment = await this.prisma.studentClassEnrollment.findFirst({
      where: {
        studentId,
        status: 'ACTIVE',
        class: {
          assignments: {
            some: {
              teacherId,
              isActive: true,
            },
          },
        },
      },
      select: { id: true },
    });

    return Boolean(enrollment);
  }

  private async isStudentActiveInClass(studentId: number, classId: number) {
    const enrollment = await this.prisma.studentClassEnrollment.findFirst({
      where: {
        studentId,
        classId,
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    return Boolean(enrollment);
  }

  private forbidden(
    errorKey = 'FORBIDDEN',
    message = 'Khong co quyen truy cap',
  ) {
    return new ForbiddenException({ errorKey, message });
  }
}
