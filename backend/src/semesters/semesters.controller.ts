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
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';
import { SemestersService } from './semesters.service';

@ApiTags('Semesters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('semesters')
export class SemestersController {
  constructor(private readonly semestersService: SemestersService) {}

  @Get()
  @Roles(...VIEW_ACADEMIC_ROLES)
  async findAll() {
    return successResponse(await this.semestersService.findAll());
  }

  @Post()
  @Roles(...MANAGE_ACADEMIC_ROLES)
  async create(@Body() dto: CreateSemesterDto) {
    return successResponse(await this.semestersService.create(dto), 'Created');
  }

  @Get(':id')
  @Roles(...VIEW_ACADEMIC_ROLES)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return successResponse(await this.semestersService.findOne(id));
  }

  @Patch(':id')
  @Roles(...MANAGE_ACADEMIC_ROLES)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSemesterDto,
  ) {
    return successResponse(
      await this.semestersService.update(id, dto),
      'Updated',
    );
  }
}
