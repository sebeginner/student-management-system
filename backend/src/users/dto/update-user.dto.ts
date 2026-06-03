import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  roleName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  studentId?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  teacherId?: number | null;
}
