import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { successResponse } from '../common/api-response';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../auth/types';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsService } from './notifications.service';

const ALL_ROLES = ['ADMIN', 'ACADEMIC_STAFF', 'MANAGER', 'TEACHER', 'STUDENT'];
const CREATE_ROLES = ['ADMIN', 'ACADEMIC_STAFF', 'MANAGER', 'TEACHER'];
const MANAGE_ROLES = ['ADMIN', 'ACADEMIC_STAFF'];

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles(...ALL_ROLES)
  async findForUser(@CurrentUser() user: AuthenticatedUser) {
    return successResponse(
      await this.notificationsService.findForUser(user.id, user.role),
    );
  }

  @Get('unread-count')
  @Roles(...ALL_ROLES)
  async getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    const count = await this.notificationsService.getUnreadCount(user.id, user.role);
    return successResponse({ count });
  }

  @Get('manage')
  @Roles(...MANAGE_ROLES)
  async findAll() {
    return successResponse(await this.notificationsService.findAll());
  }

  @Get('teacher-classes')
  @Roles('TEACHER')
  async getTeacherClasses(@CurrentUser() user: AuthenticatedUser) {
    return successResponse(
      await this.notificationsService.getTeacherClasses(user.id),
    );
  }

  @Post()
  @Roles(...CREATE_ROLES)
  async create(
    @Body() dto: CreateNotificationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.notificationsService.create(dto, user.id, user.role),
      'Đã tạo thông báo',
    );
  }

  @Post(':id/read')
  @Roles(...ALL_ROLES)
  async markRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.notificationsService.markRead(id, user.id));
  }

  @Delete(':id')
  @Roles(...MANAGE_ROLES)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return successResponse(await this.notificationsService.remove(id));
  }
}
