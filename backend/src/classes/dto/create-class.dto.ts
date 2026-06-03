import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateClassDto {
  @ApiProperty({ example: '10A3' })
  @IsString()
  @IsNotEmpty()
  className: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  schoolYearId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  gradeLevelId: number;

  @ApiPropertyOptional({ example: '10A3-2025' })
  @IsOptional()
  @IsString()
  classCode?: string;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxSize?: number;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  homeroomTeacherId?: number;
}
