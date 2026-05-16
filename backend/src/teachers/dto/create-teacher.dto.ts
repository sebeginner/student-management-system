import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTeacherDto {
  @ApiProperty({ example: 'T001' })
  @IsString()
  @IsNotEmpty()
  teacherCode: string;

  @ApiProperty({ example: 'Nguyen Van An' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  subjectId: number;

  @ApiPropertyOptional({ example: 'teacher@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '0900000000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;
}
