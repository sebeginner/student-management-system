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
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { TeacherQueryDto } from './dto/teacher-query.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { TeachersService } from './teachers.service';

const VIEW_TEACHER_ROLES = ['ADMIN', 'ACADEMIC_STAFF', 'MANAGER', 'TEACHER'];

@ApiTags('Teachers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @Roles(...VIEW_TEACHER_ROLES)
  async findAll(
    @Query() query: TeacherQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.teachersService.findAll(query, user));
  }

  @Post()
  @Roles('ACADEMIC_STAFF')
  async create(@Body() dto: CreateTeacherDto) {
    return successResponse(await this.teachersService.create(dto), 'Created');
  }

  @Get(':id')
  @Roles(...VIEW_TEACHER_ROLES)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.teachersService.findOne(id, user));
  }

  @Patch(':id')
  @Roles('ACADEMIC_STAFF')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeacherDto,
  ) {
    return successResponse(
      await this.teachersService.update(id, dto),
      'Updated',
    );
  }
}
