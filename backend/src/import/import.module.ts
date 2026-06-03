import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from '../prisma/prisma.module';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({ limits: { fileSize: 5 * 1024 * 1024 } }),
  ],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
