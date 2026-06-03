import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../auth/types';
import { successResponse } from '../common/api-response';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateScoreChangeRequestDto } from './dto/create-score-change-request.dto';
import { ReviewScoreChangeRequestDto } from './dto/review-score-change-request.dto';
import { ScoreChangeRequestQueryDto } from './dto/score-change-request-query.dto';
import { ScoreChangeRequestsService } from './score-change-requests.service';

@ApiTags('Score change requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('score-change-requests')
export class ScoreChangeRequestsController {
  constructor(
    private readonly scoreChangeRequestsService: ScoreChangeRequestsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List score change requests' })
  @Roles('ADMIN', 'ACADEMIC_STAFF', 'MANAGER', 'TEACHER')
  async findAll(
    @Query() query: ScoreChangeRequestQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.scoreChangeRequestsService.findAll(query, user),
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Create score change request for a locked score sheet',
  })
  @Roles('TEACHER')
  async create(
    @Body() dto: CreateScoreChangeRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.scoreChangeRequestsService.create(dto, user),
      'Created',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get score change request detail' })
  @Roles('ADMIN', 'ACADEMIC_STAFF', 'MANAGER', 'TEACHER')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.scoreChangeRequestsService.findOne(id, user),
    );
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve score change request' })
  @Roles('ACADEMIC_STAFF', 'TEACHER')
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewScoreChangeRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.scoreChangeRequestsService.approve(id, dto, user),
      'Approved',
    );
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject score change request' })
  @Roles('ACADEMIC_STAFF', 'TEACHER')
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewScoreChangeRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.scoreChangeRequestsService.reject(id, dto, user),
      'Rejected',
    );
  }
}
