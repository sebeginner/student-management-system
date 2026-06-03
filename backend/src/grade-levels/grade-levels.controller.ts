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
import { CreateGradeLevelDto } from './dto/create-grade-level.dto';
import { UpdateGradeLevelDto } from './dto/update-grade-level.dto';
import { GradeLevelsService } from './grade-levels.service';

@ApiTags('Grade levels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('grade-levels')
export class GradeLevelsController {
  constructor(private readonly gradeLevelsService: GradeLevelsService) {}

  @Get()
  @Roles(...VIEW_ACADEMIC_ROLES)
  async findAll() {
    return successResponse(await this.gradeLevelsService.findAll());
  }

  @Post()
  @Roles(...MANAGE_ACADEMIC_ROLES)
  async create(@Body() dto: CreateGradeLevelDto) {
    return successResponse(
      await this.gradeLevelsService.create(dto),
      'Created',
    );
  }

  @Get(':id')
  @Roles(...VIEW_ACADEMIC_ROLES)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return successResponse(await this.gradeLevelsService.findOne(id));
  }

  @Patch(':id')
  @Roles(...MANAGE_ACADEMIC_ROLES)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGradeLevelDto,
  ) {
    return successResponse(
      await this.gradeLevelsService.update(id, dto),
      'Updated',
    );
  }
}
