import { IsOptional, IsString } from 'class-validator';

export class FinalizeConductDto {
  @IsString()
  finalRating: string; // EXCELLENT | GOOD | AVERAGE | WEAK

  @IsOptional()
  @IsString()
  reviewNote?: string;
}
