import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class CreateScoreSheetDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  classId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  subjectId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  semesterId: number;
}
