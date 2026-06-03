import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemParametersController } from './system-parameters.controller';
import { SystemParametersService } from './system-parameters.service';

@Module({
  imports: [PrismaModule],
  controllers: [SystemParametersController],
  providers: [SystemParametersService],
})
export class SystemParametersModule {}
