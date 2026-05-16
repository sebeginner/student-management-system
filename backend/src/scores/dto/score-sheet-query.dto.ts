import { ApiPropertyOptional } from '@nestjs/swagger';
import { ScoreSheetStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';

export class ScoreSheetQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  classId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  subjectId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  semesterId?: number;

  @ApiPropertyOptional({ enum: ScoreSheetStatus })
  @IsOptional()
  @IsEnum(ScoreSheetStatus)
  status?: ScoreSheetStatus;
}
