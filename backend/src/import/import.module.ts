import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { AuthorizationModule } from '../authorization/authorization.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';

@Module({
  imports: [
    PrismaModule,
    AuthorizationModule,
    MulterModule.register({ limits: { fileSize: 5 * 1024 * 1024 } }),
  ],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
