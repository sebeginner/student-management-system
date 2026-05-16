import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TeacherAssignmentType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional } from 'class-validator';

export class CreateTeacherAssignmentDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  teacherId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  classId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  schoolYearId: number;

  @ApiProperty({
    enum: TeacherAssignmentType,
    example: TeacherAssignmentType.HOMEROOM,
  })
  @IsEnum(TeacherAssignmentType)
  assignmentType: TeacherAssignmentType;

  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  subjectId?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  semesterId?: number | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
