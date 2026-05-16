import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReviewScoreChangeRequestDto {
  @ApiPropertyOptional({ example: 'Da doi chieu minh chung' })
  @IsOptional()
  @IsString()
  reviewNote?: string;

  @ApiPropertyOptional({ example: 'Minh chung chua hop le' })
  @IsOptional()
  @IsString()
  rejectReason?: string;
}
