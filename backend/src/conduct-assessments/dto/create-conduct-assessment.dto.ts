import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateConductAssessmentDto {
  @Type(() => Number)
  @IsInt()
  studentId: number;

  @Type(() => Number)
  @IsInt()
  semesterId: number;

  @Type(() => Number)
  @IsInt()
  classId: number;
}
