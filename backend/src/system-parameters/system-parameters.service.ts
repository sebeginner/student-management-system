import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSystemParameterDto } from './dto/update-system-parameter.dto';

@Injectable()
export class SystemParametersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.systemParameter.findMany({
      orderBy: { effectiveFrom: 'desc' },
      include: { schoolYear: true },
    });
  }

  async update(id: number, dto: UpdateSystemParameterDto) {
    const current = await this.prisma.systemParameter.findUnique({
      where: { id },
      include: { schoolYear: true },
    });
    if (!current) {
      throw new NotFoundException('Không tìm thấy tham số hệ thống');
    }

    const merged = {
      minAge: dto.minAge ?? current.minAge,
      maxAge: dto.maxAge ?? current.maxAge,
      maxClassSize: dto.maxClassSize ?? current.maxClassSize,
      minScore: dto.minScore ?? current.minScore,
      maxScore: dto.maxScore ?? current.maxScore,
      subjectPassScore: dto.subjectPassScore ?? current.subjectPassScore,
      semesterPassScore: dto.semesterPassScore ?? current.semesterPassScore,
      effectiveFrom: dto.effectiveFrom
        ? new Date(dto.effectiveFrom)
        : current.effectiveFrom,
      effectiveTo:
        dto.effectiveTo === undefined
          ? current.effectiveTo
          : dto.effectiveTo
            ? new Date(dto.effectiveTo)
            : null,
    };

    this.validate(merged);

    return this.prisma.systemParameter.update({
      where: { id },
      data: merged,
      include: { schoolYear: true },
    });
  }

  private validate(params: {
    minAge: number;
    maxAge: number;
    maxClassSize: number;
    minScore: number;
    maxScore: number;
    subjectPassScore: number;
    semesterPassScore: number;
    effectiveFrom: Date;
    effectiveTo: Date | null;
  }) {
    if (params.minAge >= params.maxAge) {
      throw new BadRequestException('Tuổi tối thiểu phải nhỏ hơn tuổi tối đa');
    }
    if (params.minScore >= params.maxScore) {
      throw new BadRequestException('Điểm tối thiểu phải nhỏ hơn điểm tối đa');
    }
    if (
      params.subjectPassScore < params.minScore ||
      params.subjectPassScore > params.maxScore
    ) {
      throw new BadRequestException(
        'Điểm đạt môn phải nằm trong khoảng điểm hợp lệ',
      );
    }
    if (
      params.semesterPassScore < params.minScore ||
      params.semesterPassScore > params.maxScore
    ) {
      throw new BadRequestException(
        'Điểm đạt học kỳ phải nằm trong khoảng điểm hợp lệ',
      );
    }
    if (params.effectiveTo && params.effectiveFrom >= params.effectiveTo) {
      throw new BadRequestException(
        'Ngày hiệu lực bắt đầu phải nhỏ hơn ngày kết thúc',
      );
    }
  }
}
