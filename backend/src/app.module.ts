import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AcademicYearsModule } from './academic-years/academic-years.module';
import { SemestersModule } from './semesters/semesters.module';
import { GradeLevelsModule } from './grade-levels/grade-levels.module';
import { SubjectsModule } from './subjects/subjects.module';
import { SystemParametersModule } from './system-parameters/system-parameters.module';
import { StudentsModule } from './students/students.module';
import { ClassesModule } from './classes/classes.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { TeachersModule } from './teachers/teachers.module';
import { TeacherAssignmentsModule } from './teacher-assignments/teacher-assignments.module';
import { ScoresModule } from './scores/scores.module';
import { ScoreChangeRequestsModule } from './score-change-requests/score-change-requests.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    AcademicYearsModule,
    SemestersModule,
    GradeLevelsModule,
    SubjectsModule,
    SystemParametersModule,
    StudentsModule,
    ClassesModule,
    EnrollmentsModule,
    AuthorizationModule,
    TeachersModule,
    TeacherAssignmentsModule,
    ScoresModule,
    ScoreChangeRequestsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
