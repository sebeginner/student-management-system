import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CriterionDto {
  @IsString()
  code: string; // ATTENDANCE | DISCIPLINE | ACADEMIC | ACTIVITIES

  @IsString()
  rating: string; // EXCELLENT | GOOD | AVERAGE | WEAK

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateConductAssessmentDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterionDto)
  criteria?: CriterionDto[];

  @IsOptional()
  @IsString()
  teacherNote?: string;
}
