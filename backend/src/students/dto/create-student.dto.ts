import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: 'S006' })
  @IsString()
  @IsNotEmpty()
  studentCode: string;

  @ApiProperty({ example: 'Student 06' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'MALE' })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({ example: '2009-02-01' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ example: '2025-09-01' })
  @IsDateString()
  admissionDate: string;

  @ApiPropertyOptional({ example: 'TP.HCM' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'student06@school.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'PENDING_CLASS_ASSIGNMENT' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Demo student' })
  @IsOptional()
  @IsString()
  note?: string;
}
