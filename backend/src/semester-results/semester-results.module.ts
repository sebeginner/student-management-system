import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SemesterResultsController } from './semester-results.controller';
import { SemesterResultsService } from './semester-results.service';

@Module({
  imports: [PrismaModule],
  controllers: [SemesterResultsController],
  providers: [SemesterResultsService],
  exports: [SemesterResultsService],
})
export class SemesterResultsModule {}
