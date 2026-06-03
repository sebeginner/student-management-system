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
import { CreateTeacherAssignmentDto } from './dto/create-teacher-assignment.dto';
import { TeacherAssignmentQueryDto } from './dto/teacher-assignment-query.dto';
import { UpdateTeacherAssignmentDto } from './dto/update-teacher-assignment.dto';
import { TeacherAssignmentsService } from './teacher-assignments.service';

const VIEW_ASSIGNMENT_ROLES = ['ADMIN', 'ACADEMIC_STAFF', 'MANAGER', 'TEACHER'];

@ApiTags('Teacher assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class TeacherAssignmentsController {
  constructor(
    private readonly teacherAssignmentsService: TeacherAssignmentsService,
  ) {}

  @Get('teacher-assignments')
  @Roles(...VIEW_ASSIGNMENT_ROLES)
  async findAll(
    @Query() query: TeacherAssignmentQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.teacherAssignmentsService.findAll(query, user),
    );
  }

  @Post('teacher-assignments')
  @Roles('ACADEMIC_STAFF')
  async create(@Body() dto: CreateTeacherAssignmentDto) {
    return successResponse(
      await this.teacherAssignmentsService.create(dto),
      'Created',
    );
  }

  @Get('teacher-assignments/:id')
  @Roles(...VIEW_ASSIGNMENT_ROLES)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.teacherAssignmentsService.findOne(id, user),
    );
  }

  @Patch('teacher-assignments/:id')
  @Roles('ACADEMIC_STAFF')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeacherAssignmentDto,
  ) {
    return successResponse(
      await this.teacherAssignmentsService.update(id, dto),
      'Updated',
    );
  }

  @Get('teachers/:id/assignments')
  @Roles(...VIEW_ASSIGNMENT_ROLES)
  async findByTeacher(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.teacherAssignmentsService.findByTeacher(id, user),
    );
  }

  @Get('me/teacher-assignments')
  @Roles('TEACHER')
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    return successResponse(await this.teacherAssignmentsService.findMine(user));
  }
}
