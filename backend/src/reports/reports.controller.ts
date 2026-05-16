import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../auth/types';
import { successResponse } from '../common/api-response';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  ClassSemesterReportQueryDto,
  DashboardSummaryReportQueryDto,
  StudentSemesterReportQueryDto,
  SubjectSummaryReportQueryDto,
} from './dto/report-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('class-semester')
  @ApiOperation({ summary: 'Get class semester report' })
  @Roles('ADMIN', 'ACADEMIC_STAFF', 'MANAGER', 'TEACHER')
  async getClassSemester(
    @Query() query: ClassSemesterReportQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.reportsService.getClassSemesterReport(query, user),
    );
  }

  @Get('subject-summary')
  @ApiOperation({ summary: 'Get subject summary report' })
  @Roles('ADMIN', 'ACADEMIC_STAFF', 'MANAGER', 'TEACHER')
  async getSubjectSummary(
    @Query() query: SubjectSummaryReportQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.reportsService.getSubjectSummary(query, user),
    );
  }

  @Get('student-semester/:studentId')
  @ApiOperation({ summary: 'Get student semester report' })
  @Roles('ADMIN', 'ACADEMIC_STAFF', 'MANAGER', 'TEACHER', 'STUDENT')
  async getStudentSemester(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() query: StudentSemesterReportQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.reportsService.getStudentSemesterReport(
        studentId,
        query,
        user,
      ),
    );
  }

  @Get('dashboard-summary')
  @ApiOperation({ summary: 'Get dashboard summary report' })
  @Roles('ADMIN', 'ACADEMIC_STAFF', 'MANAGER')
  async getDashboardSummary(
    @Query() query: DashboardSummaryReportQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.reportsService.getDashboardSummary(query, user),
    );
  }
}
