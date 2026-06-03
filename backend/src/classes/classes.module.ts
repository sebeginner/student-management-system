import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';

@Module({
  imports: [PrismaModule, AuthorizationModule],
  controllers: [ClassesController],
  providers: [ClassesService],
})
export class ClassesModule {}
