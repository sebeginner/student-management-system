import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ScoreDetailInputDto {
  @ApiProperty({ example: 'MIDTERM' })
  @IsString()
  testTypeCode: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  attemptNo?: number;

  @ApiProperty({ example: 8.5 })
  @Type(() => Number)
  @IsNumber()
  score: number;
}

export class UpdateStudentScoreDto {
  @ApiProperty({ type: [ScoreDetailInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScoreDetailInputDto)
  details: ScoreDetailInputDto[];
}
