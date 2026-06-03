import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ConductAssessmentsController } from './conduct-assessments.controller';
import { ConductAssessmentsService } from './conduct-assessments.service';

@Module({
  imports: [PrismaModule],
  controllers: [ConductAssessmentsController],
  providers: [ConductAssessmentsService],
  exports: [ConductAssessmentsService],
})
export class ConductAssessmentsModule {}
