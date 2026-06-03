import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpsertTimetableSlotDto {
  @Type(() => Number)
  @IsInt()
  semesterId: number;

  @Type(() => Number)
  @IsInt()
  classId: number;

  @Type(() => Number)
  @IsInt()
  subjectId: number;

  @Type(() => Number)
  @IsInt()
  teacherId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  dayOfWeek: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  period: number;

  @IsOptional()
  @IsString()
  room?: string;
}
