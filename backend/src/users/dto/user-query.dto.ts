import { IsOptional, IsString } from 'class-validator';

export class UserQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  roleName?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
