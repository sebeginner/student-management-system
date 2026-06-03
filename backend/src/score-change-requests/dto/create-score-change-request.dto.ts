import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateScoreChangeRequestDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  scoreSheetId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  studentId: number;

  @ApiProperty({ example: 'MIDTERM' })
  @IsString()
  @IsNotEmpty()
  scoreType: string;

  @ApiPropertyOptional({ example: 'MIDTERM' })
  @IsOptional()
  @IsString()
  testTypeCode?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  attemptNo?: number;

  @ApiProperty({ example: 7.5 })
  @Type(() => Number)
  @IsNumber()
  oldValue: number;

  @ApiProperty({ example: 8.0 })
  @Type(() => Number)
  @IsNumber()
  newValue: number;

  @ApiProperty({ example: 'Nhap nham diem giua ky' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
