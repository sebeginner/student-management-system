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
import { VIEW_ACADEMIC_ROLES } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ClassesService } from './classes.service';
import { ClassQueryDto } from './dto/class-query.dto';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@ApiTags('Classes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  @Roles(...VIEW_ACADEMIC_ROLES)
  async findAll(
    @Query() query: ClassQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.classesService.findAll(query, user));
  }

  @Post()
  @Roles('ACADEMIC_STAFF')
  async create(@Body() dto: CreateClassDto) {
    return successResponse(await this.classesService.create(dto), 'Created');
  }

  @Get(':id')
  @Roles(...VIEW_ACADEMIC_ROLES)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.classesService.findOne(id, user));
  }

  @Patch(':id')
  @Roles('ACADEMIC_STAFF')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClassDto,
  ) {
    return successResponse(
      await this.classesService.update(id, dto),
      'Updated',
    );
  }

  @Get(':id/students')
  @Roles(...VIEW_ACADEMIC_ROLES)
  async getStudents(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.classesService.getStudents(id, user));
  }
}
