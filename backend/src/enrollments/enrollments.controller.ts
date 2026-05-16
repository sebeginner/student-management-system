import {
  Body,
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
import { VIEW_ACADEMIC_ROLES } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AssignEnrollmentDto } from './dto/assign-enrollment.dto';
import { EnrollmentQueryDto } from './dto/enrollment-query.dto';
import { TransferEnrollmentDto } from './dto/transfer-enrollment.dto';
import { EnrollmentsService } from './enrollments.service';

@ApiTags('Enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get('enrollments')
  @Roles(...VIEW_ACADEMIC_ROLES)
  async findAll(
    @Query() query: EnrollmentQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.enrollmentsService.findAll(query, user));
  }

  @Post('enrollments/assign')
  @Roles('ACADEMIC_STAFF')
  async assign(@Body() dto: AssignEnrollmentDto) {
    return successResponse(
      await this.enrollmentsService.assign(dto),
      'Assigned',
    );
  }

  @Post('enrollments/transfer')
  @Roles('ACADEMIC_STAFF')
  async transfer(@Body() dto: TransferEnrollmentDto) {
    return successResponse(
      await this.enrollmentsService.transfer(dto),
      'Transferred',
    );
  }

  @Get('students/:id/enrollments')
  @Roles(...VIEW_ACADEMIC_ROLES)
  async findByStudent(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.enrollmentsService.findByStudent(id, user),
    );
  }
}
