import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../auth/types';
import { successResponse } from '../common/api-response';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateScoreSheetDto } from './dto/create-score-sheet.dto';
import { ScoreSheetQueryDto } from './dto/score-sheet-query.dto';
import { UpdateStudentScoreDto } from './dto/update-student-score.dto';
import { ScoresService } from './scores.service';
import { PdfService } from '../reports/pdf.service';

@ApiTags('Scores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scores')
export class ScoresController {
  constructor(
    private readonly scoresService: ScoresService,
    private readonly pdfService: PdfService,
  ) {}

  @Get('sheets')
  @ApiOperation({ summary: 'List score sheets' })
  @Roles('ADMIN', 'ACADEMIC_STAFF', 'MANAGER', 'TEACHER')
  async findSheets(
    @Query() query: ScoreSheetQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.scoresService.findSheets(query, user));
  }

  @Post('sheets')
  @ApiOperation({ summary: 'Create score sheet' })
  @Roles('ACADEMIC_STAFF', 'TEACHER')
  async createSheet(
    @Body() dto: CreateScoreSheetDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.scoresService.createSheet(dto, user),
      'Created',
    );
  }

  @Get('sheets/:id')
  @ApiOperation({ summary: 'Get score sheet detail' })
  @Roles('ADMIN', 'ACADEMIC_STAFF', 'MANAGER', 'TEACHER')
  async findSheet(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.scoresService.findSheet(id, user));
  }

  @Put('sheets/:id/students/:studentId')
  @ApiOperation({ summary: 'Update one student score in a score sheet' })
  @Roles('ACADEMIC_STAFF', 'TEACHER')
  async updateStudentScore(
    @Param('id', ParseIntPipe) id: number,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Body() dto: UpdateStudentScoreDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.scoresService.updateStudentScore(id, studentId, dto, user),
      'Updated',
    );
  }

  @Post('sheets/:id/submit')
  @ApiOperation({ summary: 'Submit score sheet' })
  @Roles('ACADEMIC_STAFF', 'TEACHER')
  async submitSheet(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.scoresService.submitSheet(id, user),
      'Submitted',
    );
  }

  @Post('sheets/:id/lock')
  @ApiOperation({ summary: 'Lock submitted score sheet' })
  @Roles('ACADEMIC_STAFF', 'TEACHER')
  async lockSheet(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.scoresService.lockSheet(id, user),
      'Locked',
    );
  }

  @Post('sheets/:id/unlock')
  @ApiOperation({
    summary: 'Unlock score sheet for exceptional correction flow',
  })
  @Roles('ACADEMIC_STAFF', 'TEACHER')
  async unlockSheet(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.scoresService.unlockSheet(id, user),
      'Unlocked',
    );
  }

  @Get('my-scores')
  @ApiOperation({ summary: 'Get current student scores' })
  @Roles('STUDENT')
  async getMyScores(@CurrentUser() user: AuthenticatedUser) {
    return successResponse(await this.scoresService.getMyScores(user));
  }

  @Get('sheets/:id/pdf')
  @ApiOperation({ summary: 'Export score sheet as PDF' })
  @Roles('ADMIN', 'ACADEMIC_STAFF', 'TEACHER')
  async exportSheetPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.pdfService.generateScoreSheetPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="bang-diem-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}
