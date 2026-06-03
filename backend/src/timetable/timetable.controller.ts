import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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
import { UpsertTimetableSlotDto } from './dto/upsert-timetable-slot.dto';
import { TimetableService } from './timetable.service';

@ApiTags('Timetable')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('timetable')
export class TimetableController {
  constructor(private readonly service: TimetableService) {}

  @Get()
  @Roles(...VIEW_ACADEMIC_ROLES)
  async findByClass(
    @Query('semesterId') semesterId: string,
    @Query('classId') classId: string,
  ) {
    return successResponse(
      await this.service.findByClass(Number(semesterId), Number(classId)),
    );
  }

  @Get('my')
  @Roles('TEACHER', 'STUDENT')
  async findMy(
    @Query('semesterId') semesterId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.service.findMyTimetable(Number(semesterId), user),
    );
  }

  @Post()
  @Roles('ACADEMIC_STAFF')
  async upsert(@Body() dto: UpsertTimetableSlotDto) {
    return successResponse(await this.service.upsert(dto), 'Saved');
  }

  @Post('bulk')
  @Roles('ACADEMIC_STAFF')
  async bulkUpsert(@Body() slots: UpsertTimetableSlotDto[]) {
    return successResponse(await this.service.bulkUpsert(slots), 'Saved');
  }

  @Delete(':id')
  @Roles('ACADEMIC_STAFF')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return successResponse(await this.service.remove(id), 'Deleted');
  }
}
