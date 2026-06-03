import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { successResponse } from '../common/api-response';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ImportService, type ScoreImportRow, type StudentImportRow } from './import.service';

@ApiTags('Import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  // ─── Templates ──────────────────────────────────────────────────────────────

  @Get('templates/students')
  @Roles('ADMIN', 'ACADEMIC_STAFF')
  async studentTemplate(@Res() res: Response) {
    const buffer = await this.importService.generateStudentTemplate();
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="mau-hoc-sinh.xlsx"' });
    res.end(buffer);
  }

  @Get('templates/score-sheet')
  @Roles('ADMIN', 'ACADEMIC_STAFF', 'TEACHER')
  async scoreSheetTemplate(@Query('sheetId') sheetId: string, @Res() res: Response) {
    const buffer = await this.importService.generateScoreSheetTemplate(Number(sheetId));
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="mau-diem-${sheetId}.xlsx"` });
    res.end(buffer);
  }

  // ─── Student Import ──────────────────────────────────────────────────────────

  @Post('students/import/preview')
  @Roles('ADMIN', 'ACADEMIC_STAFF')
  @UseInterceptors(FileInterceptor('file'))
  async previewStudentImport(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('No file uploaded');
    return successResponse(await this.importService.previewStudentImport(file.buffer));
  }

  @Post('students/import/commit')
  @Roles('ADMIN', 'ACADEMIC_STAFF')
  async commitStudentImport(@Body() body: { data: StudentImportRow[] }) {
    return successResponse(
      await this.importService.commitStudentImport(body.data),
      'Import thành công',
    );
  }

  // ─── Score Import ─────────────────────────────────────────────────────────

  @Post('scores/sheets/:id/import/preview')
  @Roles('ADMIN', 'ACADEMIC_STAFF', 'TEACHER')
  @UseInterceptors(FileInterceptor('file'))
  async previewScoreImport(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new Error('No file uploaded');
    return successResponse(await this.importService.previewScoreImport(file.buffer, id));
  }

  @Post('scores/sheets/:id/import/commit')
  @Roles('ADMIN', 'ACADEMIC_STAFF', 'TEACHER')
  async commitScoreImport(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { data: ScoreImportRow[] },
  ) {
    return successResponse(
      await this.importService.commitScoreImport(body.data, id),
      'Import điểm thành công',
    );
  }
}
