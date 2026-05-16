import {
  Body,
  Controller,
  Delete,
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
import { VIEW_ACADEMIC_ROLES } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateStudentDto } from './dto/create-student.dto';
import { StudentQueryDto } from './dto/student-query.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentsService } from './students.service';

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles(...VIEW_ACADEMIC_ROLES)
  async findAll(
    @Query() query: StudentQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.studentsService.findAll(query, user));
  }

  @Post()
  @Roles('ACADEMIC_STAFF')
  async create(@Body() dto: CreateStudentDto) {
    return successResponse(await this.studentsService.create(dto), 'Created');
  }

  @Get(':id')
  @Roles(...VIEW_ACADEMIC_ROLES)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.studentsService.findOne(id, user));
  }

  @Patch(':id')
  @Roles('ACADEMIC_STAFF')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudentDto,
  ) {
    return successResponse(
      await this.studentsService.update(id, dto),
      'Updated',
    );
  }

  @Delete(':id')
  @Roles('ACADEMIC_STAFF')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return successResponse(await this.studentsService.remove(id), 'Deleted');
  }
}
