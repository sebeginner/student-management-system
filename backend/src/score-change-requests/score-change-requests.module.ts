import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ScoreChangeRequestsController } from './score-change-requests.controller';
import { ScoreChangeRequestsService } from './score-change-requests.service';

@Module({
  imports: [PrismaModule, AuthorizationModule],
  controllers: [ScoreChangeRequestsController],
  providers: [ScoreChangeRequestsService],
})
export class ScoreChangeRequestsModule {}
