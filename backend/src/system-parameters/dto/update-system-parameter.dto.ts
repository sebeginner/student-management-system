import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateSystemParameterDto {
  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  minAge?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  maxAge?: number;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxClassSize?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  minScore?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  maxScore?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  subjectPassScore?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  semesterPassScore?: number;

  @ApiPropertyOptional({ example: '2025-09-01' })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ example: '2026-05-30' })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}
