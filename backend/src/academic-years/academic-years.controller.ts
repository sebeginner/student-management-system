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
import { AcademicYearsService } from './academic-years.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';

@ApiTags('Academic years')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academic-years')
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Get()
  @Roles(...VIEW_ACADEMIC_ROLES)
  async findAll() {
    return successResponse(await this.academicYearsService.findAll());
  }

  @Post()
  @Roles(...MANAGE_ACADEMIC_ROLES)
  async create(@Body() dto: CreateAcademicYearDto) {
    return successResponse(
      await this.academicYearsService.create(dto),
      'Created',
    );
  }

  @Get(':id')
  @Roles(...VIEW_ACADEMIC_ROLES)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return successResponse(await this.academicYearsService.findOne(id));
  }

  @Patch(':id')
  @Roles(...MANAGE_ACADEMIC_ROLES)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAcademicYearDto,
  ) {
    return successResponse(
      await this.academicYearsService.update(id, dto),
      'Updated',
    );
  }
}
