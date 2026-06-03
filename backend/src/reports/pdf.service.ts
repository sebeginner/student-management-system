import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require('pdfmake/src/printer') as new (fonts: Record<string, unknown>) => {
  createPdfKitDocument: (docDef: Record<string, unknown>) => NodeJS.EventEmitter & { end: () => void };
};

const FONTS = {
  Roboto: {
    normal: Buffer.from(''),
    bold: Buffer.from(''),
    italics: Buffer.from(''),
    bolditalics: Buffer.from(''),
  },
};

const ACADEMIC_RATING_VN: Record<string, string> = {
  EXCELLENT: 'Giỏi', GOOD: 'Khá', AVERAGE: 'Trung bình', WEAK: 'Yếu', POOR: 'Kém',
};
const CONDUCT_VN: Record<string, string> = {
  EXCELLENT: 'Tốt', GOOD: 'Khá', AVERAGE: 'Trung bình', WEAK: 'Yếu',
};

@Injectable()
export class PdfService {
  constructor(private readonly prisma: PrismaService) {}

  /** Xuất bảng điểm lớp (1 score sheet) */
  async generateScoreSheetPdf(sheetId: number): Promise<Buffer> {
    const sheet = await this.prisma.scoreSheet.findUnique({
      where: { id: sheetId },
      include: {
        class: { include: { schoolYear: true } },
        subject: true,
        semester: { include: { schoolYear: true } },
        studentScores: {
          include: {
            student: { select: { studentCode: true, fullName: true, gender: true } },
            scoreDetails: { include: { testType: true } },
          },
          orderBy: { student: { studentCode: 'asc' } },
        },
      },
    });

    if (!sheet) throw new NotFoundException('Không tìm thấy bảng điểm');

    const testTypeCodes = ['ORAL_15M', 'ONE_PERIOD', 'MIDTERM', 'FINAL'];
    const testTypeNames: Record<string, string> = {
      ORAL_15M: 'Miệng', ONE_PERIOD: '1 tiết', MIDTERM: 'Giữa kỳ', FINAL: 'Cuối kỳ',
    };

    const headerRow = ['STT', 'Mã HS', 'Họ tên', ...testTypeCodes.map(c => testTypeNames[c] ?? c), 'Điểm TB', 'KQ'];
    const dataRows = sheet.studentScores.map((ss, idx) => {
      const scoreMap = new Map(ss.scoreDetails.map(d => [d.testType.code, d.score]));
      const scores = testTypeCodes.map(c => {
        const v = scoreMap.get(c);
        return v !== undefined ? String(v) : '-';
      });
      return [
        String(idx + 1),
        ss.student.studentCode,
        ss.student.fullName,
        ...scores,
        ss.averageScore !== null ? String(ss.averageScore) : '-',
        ss.passStatus === true ? 'Đạt' : ss.passStatus === false ? 'Chưa đạt' : '-',
      ];
    });

    const docDef = {
      pageOrientation: 'landscape',
      content: [
        { text: `BẢNG ĐIỂM MÔN ${sheet.subject.name.toUpperCase()}`, style: 'title' },
        { text: `Lớp: ${sheet.class.name} | Học kỳ: ${sheet.semester.name} | Năm học: ${sheet.semester.schoolYear.name}`, style: 'subtitle' },
        { text: `Trạng thái: ${sheet.status}`, style: 'subtitle', margin: [0, 0, 0, 12] as [number, number, number, number] },
        {
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: [
              headerRow.map(h => ({ text: h, style: 'tableHeader' })),
              ...dataRows.map(row => row.map(cell => ({ text: cell, style: 'tableCell' }))),
            ],
          },
          layout: 'lightHorizontalLines',
        },
        {
          text: `Tổng: ${sheet.studentScores.length} học sinh | Đạt: ${sheet.studentScores.filter(s => s.passStatus).length}`,
          style: 'footer',
          margin: [0, 12, 0, 0] as [number, number, number, number],
        },
      ],
      styles: {
        title:       { fontSize: 14, bold: true, alignment: 'center', margin: [0, 0, 0, 4] },
        subtitle:    { fontSize: 10, alignment: 'center', color: '#555' },
        tableHeader: { bold: true, fontSize: 9, fillColor: '#f1f5f9', alignment: 'center' },
        tableCell:   { fontSize: 9, alignment: 'center' },
        footer:      { fontSize: 9, color: '#666', alignment: 'right' },
      },
      defaultStyle: { fontSize: 10 },
    };

    return this.buildPdf(docDef);
  }

  /** Xuất phiếu kết quả học sinh (học bạ ngắn) */
  async generateStudentTranscriptPdf(studentId: number, semesterId: number): Promise<Buffer> {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Không tìm thấy học sinh');

    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
      include: { schoolYear: true },
    });
    if (!semester) throw new NotFoundException('Không tìm thấy học kỳ');

    // Enrollment
    const enrollment = await this.prisma.studentClassEnrollment.findFirst({
      where: { studentId, semesterId, status: 'ACTIVE' },
      include: { class: true },
    });

    // Điểm các môn
    const scores = await this.prisma.studentSubjectScore.findMany({
      where: {
        studentId,
        scoreSheet: { semesterId },
        averageScore: { not: null },
      },
      include: {
        scoreSheet: { include: { subject: true } },
        scoreDetails: { include: { testType: true } },
      },
      orderBy: { scoreSheet: { subject: { name: 'asc' } } },
    });

    // Kết quả HK nếu đã chốt
    const result = await this.prisma.semesterStudentResult.findUnique({
      where: { studentId_semesterId: { studentId, semesterId } },
    });

    // Hạnh kiểm nếu có
    const conduct = await this.prisma.conductAssessment.findFirst({
      where: { studentId, semesterId, status: 'FINALIZED' },
    });

    const scoreRows = scores.map(ss => {
      const testTypeCodes = ['ORAL_15M', 'ONE_PERIOD', 'MIDTERM', 'FINAL'];
      const scoreMap = new Map(ss.scoreDetails.map(d => [d.testType.code, d.score]));
      return [
        ss.scoreSheet.subject.name,
        scoreMap.get('ORAL_15M') !== undefined ? String(scoreMap.get('ORAL_15M')) : '-',
        scoreMap.get('ONE_PERIOD') !== undefined ? String(scoreMap.get('ONE_PERIOD')) : '-',
        scoreMap.get('MIDTERM') !== undefined ? String(scoreMap.get('MIDTERM')) : '-',
        scoreMap.get('FINAL') !== undefined ? String(scoreMap.get('FINAL')) : '-',
        ss.averageScore !== null ? String(ss.averageScore) : '-',
        ss.passStatus === true ? 'Đạt' : 'Chưa đạt',
      ];
    });

    const semAvg = result?.semesterAverage ?? (
      scores.length > 0
        ? Math.round(scores.reduce((s, r) => s + (r.averageScore ?? 0), 0) / scores.length * 100) / 100
        : null
    );

    const docDef = {
      content: [
        { text: 'PHIẾU KẾT QUẢ HỌC TẬP', style: 'title' },
        { text: `${semester.schoolYear.name} – ${semester.name}`, style: 'subtitle', margin: [0, 0, 0, 12] as [number, number, number, number] },
        {
          columns: [
            [
              { text: `Họ tên: ${student.fullName}`, style: 'info' },
              { text: `Mã HS: ${student.studentCode}`, style: 'info' },
              { text: `Lớp: ${enrollment?.class.name ?? '—'}`, style: 'info' },
            ],
            [
              { text: `Giới tính: ${student.gender === 'MALE' ? 'Nam' : student.gender === 'FEMALE' ? 'Nữ' : '—'}`, style: 'info' },
              { text: `Ngày sinh: ${student.dateOfBirth.toLocaleDateString('vi-VN')}`, style: 'info' },
            ],
          ],
          margin: [0, 0, 0, 12] as [number, number, number, number],
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: [
              ['Môn học', 'Miệng', '1 tiết', 'Giữa kỳ', 'Cuối kỳ', 'Điểm TB', 'Kết quả'].map(h => ({ text: h, style: 'tableHeader' })),
              ...scoreRows.map(row => row.map(cell => ({ text: cell, style: 'tableCell' }))),
            ],
          },
          layout: 'lightHorizontalLines',
        },
        {
          columns: [
            { text: `Điểm TB học kỳ: ${semAvg !== null ? semAvg : '—'}`, style: 'summary', bold: true },
            { text: `Học lực: ${result ? (ACADEMIC_RATING_VN[result.academicRating] ?? result.academicRating) : '—'}`, style: 'summary' },
            { text: `Hạnh kiểm: ${conduct?.finalRating ? (CONDUCT_VN[conduct.finalRating] ?? conduct.finalRating) : '—'}`, style: 'summary' },
          ],
          margin: [0, 12, 0, 0] as [number, number, number, number],
        },
      ],
      styles: {
        title:       { fontSize: 14, bold: true, alignment: 'center', margin: [0, 0, 0, 4] },
        subtitle:    { fontSize: 11, alignment: 'center', color: '#444' },
        info:        { fontSize: 10, margin: [0, 2, 0, 2] },
        tableHeader: { bold: true, fontSize: 9, fillColor: '#f1f5f9', alignment: 'center' },
        tableCell:   { fontSize: 9, alignment: 'center' },
        summary:     { fontSize: 10, margin: [4, 0, 4, 0] },
      },
      defaultStyle: { fontSize: 10 },
    };

    return this.buildPdf(docDef);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildPdf(docDef: Record<string, any>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const printer = new PdfPrinter(FONTS);
        const doc = printer.createPdfKitDocument(docDef);
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
