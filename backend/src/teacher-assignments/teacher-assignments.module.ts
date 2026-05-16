import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TeacherAssignmentsController } from './teacher-assignments.controller';
import { TeacherAssignmentsService } from './teacher-assignments.service';

@Module({
  imports: [PrismaModule, AuthorizationModule],
  controllers: [TeacherAssignmentsController],
  providers: [TeacherAssignmentsService],
})
export class TeacherAssignmentsModule {}
