import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import { UpdateSystemParameterDto } from './dto/update-system-parameter.dto';
import { SystemParametersService } from './system-parameters.service';

@ApiTags('System parameters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('system-parameters')
export class SystemParametersController {
  constructor(
    private readonly systemParametersService: SystemParametersService,
  ) {}

  @Get()
  @Roles(...VIEW_ACADEMIC_ROLES)
  async findAll() {
    return successResponse(await this.systemParametersService.findAll());
  }

  @Patch(':id')
  @Roles(...MANAGE_ACADEMIC_ROLES)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemParameterDto,
  ) {
    return successResponse(
      await this.systemParametersService.update(id, dto),
      'Updated',
    );
  }
}
