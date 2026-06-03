import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../auth/types';
import { successResponse } from '../common/api-response';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SemesterResultsService } from './semester-results.service';

@ApiTags('Semester Results')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class SemesterResultsController {
  constructor(private readonly service: SemesterResultsService) {}

  @Post('semesters/:id/finalize')
  @Roles('ACADEMIC_STAFF')
  async finalizeSemester(
    @Param('id', ParseIntPipe) semesterId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.service.finalizeSemester(semesterId, user),
      'Chốt kết quả học kỳ thành công',
    );
  }

  @Get('semesters/:id/results')
  @Roles('ADMIN', 'ACADEMIC_STAFF', 'MANAGER')
  async getSemesterResults(
    @Param('id', ParseIntPipe) semesterId: number,
    @Query('classId') classId?: string,
  ) {
    return successResponse(
      await this.service.getSemesterResults(semesterId, classId ? Number(classId) : undefined),
    );
  }

  @Post('school-years/:id/year-end')
  @Roles('ACADEMIC_STAFF')
  async generateYearEnd(
    @Param('id', ParseIntPipe) schoolYearId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.service.generateYearEnd(schoolYearId, user),
      'Tổng kết năm học thành công',
    );
  }

  @Get('reports/year-end')
  @Roles('ADMIN', 'ACADEMIC_STAFF', 'MANAGER')
  async getYearEndResults(
    @Query('schoolYearId') schoolYearId: string,
    @Query('classId') classId?: string,
  ) {
    return successResponse(
      await this.service.getYearEndResults(Number(schoolYearId), classId ? Number(classId) : undefined),
    );
  }
}
