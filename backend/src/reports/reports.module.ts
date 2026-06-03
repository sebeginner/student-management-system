import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PdfService } from './pdf.service';

@Module({
  imports: [PrismaModule, AuthorizationModule],
  controllers: [ReportsController],
  providers: [ReportsService, PdfService],
  exports: [PdfService],
})
export class ReportsModule {}
