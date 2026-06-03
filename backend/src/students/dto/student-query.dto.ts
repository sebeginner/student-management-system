import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class StudentQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  classId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  gradeLevelId?: number;
}
