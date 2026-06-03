import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { successResponse } from '../common/api-response';
import {
  MANAGE_ACADEMIC_ROLES,
  VIEW_ACADEMIC_ROLES,
} from '../common/constants/roles';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { SubjectsService } from './subjects.service';

@ApiTags('Subjects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @Roles(...VIEW_ACADEMIC_ROLES)
  async findAll() {
    return successResponse(await this.subjectsService.findAll());
  }

  @Post()
  @Roles(...MANAGE_ACADEMIC_ROLES)
  async create(@Body() dto: CreateSubjectDto) {
    return successResponse(await this.subjectsService.create(dto), 'Created');
  }

  @Get(':id')
  @Roles(...VIEW_ACADEMIC_ROLES)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return successResponse(await this.subjectsService.findOne(id));
  }

  @Patch(':id')
  @Roles(...MANAGE_ACADEMIC_ROLES)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubjectDto,
  ) {
    return successResponse(
      await this.subjectsService.update(id, dto),
      'Updated',
    );
  }
}
