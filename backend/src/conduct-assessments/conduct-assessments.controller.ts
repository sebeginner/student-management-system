import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import { ConductAssessmentsService } from './conduct-assessments.service';
import { CreateConductAssessmentDto } from './dto/create-conduct-assessment.dto';
import { FinalizeConductDto } from './dto/finalize-conduct.dto';
import { UpdateConductAssessmentDto } from './dto/update-conduct-assessment.dto';

@ApiTags('Conduct Assessments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('conduct-assessments')
export class ConductAssessmentsController {
  constructor(private readonly service: ConductAssessmentsService) {}

  @Get()
  @Roles('ADMIN', 'ACADEMIC_STAFF', 'MANAGER', 'TEACHER')
  async findAll(
    @Query('semesterId') semesterId?: string,
    @Query('classId') classId?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return successResponse(
      await this.service.findAll(
        { semesterId: semesterId ? Number(semesterId) : undefined, classId: classId ? Number(classId) : undefined },
        user!,
      ),
    );
  }

  @Get('students/:studentId')
  @Roles('ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'STUDENT')
  async findByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.service.findByStudent(studentId, user));
  }

  @Get(':id')
  @Roles('ADMIN', 'ACADEMIC_STAFF', 'TEACHER')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return successResponse(await this.service.findOne(id));
  }

  @Post()
  @Roles('TEACHER')
  async create(
    @Body() dto: CreateConductAssessmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.service.create(dto, user), 'Created');
  }

  @Post('batch')
  @Roles('TEACHER')
  async createBatch(
    @Query('semesterId') semesterId: string,
    @Query('classId') classId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.service.createBatch(Number(semesterId), Number(classId), user),
      'Batch created',
    );
  }

  @Patch(':id')
  @Roles('TEACHER', 'ACADEMIC_STAFF')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateConductAssessmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.service.update(id, dto, user), 'Updated');
  }

  @Post(':id/submit')
  @Roles('TEACHER')
  async submit(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.service.submit(id, user), 'Submitted');
  }

  @Post(':id/finalize')
  @Roles('ACADEMIC_STAFF')
  async finalize(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FinalizeConductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.service.finalize(id, dto, user), 'Finalized');
  }
}
