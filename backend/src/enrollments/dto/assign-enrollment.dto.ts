import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class AssignEnrollmentDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  studentId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  classId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  semesterId: number;

  @ApiPropertyOptional({ example: 'Phan lop dau nam' })
  @IsOptional()
  @IsString()
  reason?: string;
}
