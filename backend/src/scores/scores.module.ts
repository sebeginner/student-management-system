import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ScoresController } from './scores.controller';
import { ScoresService } from './scores.service';

@Module({
  imports: [PrismaModule, AuthorizationModule],
  controllers: [ScoresController],
  providers: [ScoresService],
})
export class ScoresModule {}
