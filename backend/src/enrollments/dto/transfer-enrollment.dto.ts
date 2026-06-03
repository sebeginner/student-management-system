import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class TransferEnrollmentDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  studentId: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  fromClassId?: number;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  toClassId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  semesterId: number;

  @ApiPropertyOptional({ example: 'Chuyen lop theo yeu cau giao vu' })
  @IsOptional()
  @IsString()
  reason?: string;
}
