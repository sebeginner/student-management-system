import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ example: 'Thông báo lịch thi cuối kỳ' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Lịch thi cuối kỳ HK2 sẽ bắt đầu từ ngày 15/05/2026.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    example: 'STUDENT',
    description: 'null = gửi tất cả; hoặc tên role: STUDENT, TEACHER, ACADEMIC_STAFF, MANAGER, ADMIN',
  })
  @IsOptional()
  @IsString()
  targetRole?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID lớp học. Bắt buộc với TEACHER — chỉ được chọn lớp mình phụ trách.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  classId?: number;
}
