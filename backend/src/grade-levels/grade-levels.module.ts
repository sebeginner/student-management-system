import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GradeLevelsController } from './grade-levels.controller';
import { GradeLevelsService } from './grade-levels.service';

@Module({
  imports: [PrismaModule],
  controllers: [GradeLevelsController],
  providers: [GradeLevelsService],
})
export class GradeLevelsModule {}
