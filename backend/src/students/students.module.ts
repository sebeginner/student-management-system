import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  imports: [PrismaModule, AuthorizationModule],
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}
