import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// pdfmake 0.1.x server-side API ─────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require('pdfmake/src/printer') as new (fonts: unknown) => {
  createPdfKitDocument(def: unknown): import('stream').Readable & { end(): void };
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vfsFonts = require('pdfmake/build/vfs_fonts') as {
  pdfMake: { vfs: Record<string, string> };
};

// Roboto supports Vietnamese ─────────────────────────────────────────────────
const FONTS = {
  Roboto: {
    normal:      Buffer.from(vfsFonts.pdfMake.vfs['Roboto-Regular.ttf'],       'base64'),
    bold:        Buffer.from(vfsFonts.pdfMake.vfs['Roboto-Medium.ttf'],        'base64'),
    italics:     Buffer.from(vfsFonts.pdfMake.vfs['Roboto-Italic.ttf'],        'base64'),
    bolditalics: Buffer.from(vfsFonts.pdfMake.vfs['Roboto-MediumItalic.ttf'],  'base64'),
  },
};

const printer = new PdfPrinter(FONTS);

const ACADEMIC_RATING_VN: Record<string, string> = {
  EXCELLENT: 'Giỏi', GOOD: 'Khá', AVERAGE: 'Trung bình', WEAK: 'Yếu', POOR: 'Kém',
};
const CONDUCT_VN: Record<string, string> = {
  EXCELLENT: 'Tốt', GOOD: 'Khá', AVERAGE: 'Trung bình', WEAK: 'Yếu',
};

@Injectable()
export class PdfService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Bảng điểm lớp ────────────────────────────────────────────────────────

  async generateScoreSheetPdf(sheetId: number): Promise<Buffer> {
    const sheet = await this.prisma.scoreSheet.findUnique({
      where: { id: sheetId },
      include: {
        class:   { include: { schoolYear: true } },
        subject: true,
        semester: { include: { schoolYear: true } },
        studentScores: {
          include: {
            student:      { select: { studentCode: true, fullName: true } },
            scoreDetails: { include: { testType: true } },
          },
          orderBy: { student: { studentCode: 'asc' } },
        },
      },
    });
    if (!sheet) throw new NotFoundException('Không tìm thấy bảng điểm');

    const ttCodes  = ['ORAL_15M', 'ONE_PERIOD', 'MIDTERM', 'FINAL'];
    const ttLabels: Record<string, string> = {
      ORAL_15M: 'Miệng', ONE_PERIOD: '1 tiết', MIDTERM: 'Giữa kỳ', FINAL: 'Cuối kỳ',
    };

    const header = [
      { text: 'STT',    bold: true, fillColor: '#f1f5f9', alignment: 'center' },
      { text: 'Mã HS',  bold: true, fillColor: '#f1f5f9', alignment: 'center' },
      { text: 'Họ tên', bold: true, fillColor: '#f1f5f9' },
      ...ttCodes.map(c => ({ text: ttLabels[c], bold: true, fillColor: '#f1f5f9', alignment: 'center' })),
      { text: 'Điểm TB',  bold: true, fillColor: '#f1f5f9', alignment: 'center' },
      { text: 'Kết quả', bold: true, fillColor: '#f1f5f9', alignment: 'center' },
    ];

    const rows = sheet.studentScores.map((ss, idx) => {
      const sm = new Map(ss.scoreDetails.map(d => [d.testType.code, d.score]));
      return [
        { text: String(idx + 1), alignment: 'center' },
        { text: ss.student.studentCode },
        { text: ss.student.fullName },
        ...ttCodes.map(c => ({ text: sm.has(c) ? String(sm.get(c)) : '—', alignment: 'center' })),
        { text: ss.averageScore != null ? String(ss.averageScore) : '—', alignment: 'center', bold: true },
        { text: ss.passStatus === true ? 'Đạt' : ss.passStatus === false ? 'Chưa đạt' : '—', alignment: 'center',
          color: ss.passStatus === true ? '#166534' : ss.passStatus === false ? '#991b1b' : '#64748b' },
      ];
    });

    const passCount = sheet.studentScores.filter(s => s.passStatus).length;

    const def = {
      pageOrientation: 'landscape',
      defaultStyle: { font: 'Roboto', fontSize: 9 },
      content: [
        { text: `BẢNG ĐIỂM MÔN ${sheet.subject.name.toUpperCase()}`, style: 'title' },
        { text: `Lớp: ${sheet.class.name}  |  Học kỳ: ${sheet.semester.name}  |  Năm học: ${sheet.semester.schoolYear.name}  |  Trạng thái: ${sheet.status}`, style: 'sub' },
        { text: ' ' },
        {
          table: {
            headerRows: 1,
            widths: [25, 50, '*', 45, 45, 50, 50, 50, 50],
            body: [header, ...rows],
          },
          layout: { hLineWidth: () => 0.5, vLineWidth: () => 0, hLineColor: () => '#e2e8f0', paddingTop: () => 4, paddingBottom: () => 4 },
        },
        { text: `\nTổng: ${sheet.studentScores.length} học sinh  |  Đạt: ${passCount}  |  Chưa đạt: ${sheet.studentScores.length - passCount}`, style: 'footer' },
      ],
      styles: {
        title:  { fontSize: 13, bold: true, alignment: 'center', margin: [0, 0, 0, 4] },
        sub:    { fontSize: 9,  alignment: 'center', color: '#475569', margin: [0, 0, 0, 8] },
        footer: { fontSize: 9,  color: '#475569', alignment: 'right' },
      },
    };

    return this.buildPdf(def);
  }

  // ─── Phiếu kết quả học sinh ────────────────────────────────────────────────

  async generateStudentTranscriptPdf(studentId: number, semesterId: number): Promise<Buffer> {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Không tìm thấy học sinh');

    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
      include: { schoolYear: true },
    });
    if (!semester) throw new NotFoundException('Không tìm thấy học kỳ');

    const enrollment = await this.prisma.studentClassEnrollment.findFirst({
      where: { studentId, semesterId, status: 'ACTIVE' },
      include: { class: true },
    });

    const scores = await this.prisma.studentSubjectScore.findMany({
      where: { studentId, scoreSheet: { semesterId }, averageScore: { not: null } },
      include: {
        scoreSheet: { include: { subject: true } },
        scoreDetails: { include: { testType: true } },
      },
      orderBy: { scoreSheet: { subject: { name: 'asc' } } },
    });

    const result = await this.prisma.semesterStudentResult.findUnique({
      where: { studentId_semesterId: { studentId, semesterId } },
    });
    const conduct = await this.prisma.conductAssessment.findFirst({
      where: { studentId, semesterId, status: 'FINALIZED' },
    });

    const ttCodes  = ['ORAL_15M', 'ONE_PERIOD', 'MIDTERM', 'FINAL'];
    const ttLabels: Record<string, string> = {
      ORAL_15M: 'Miệng', ONE_PERIOD: '1 tiết', MIDTERM: 'Giữa kỳ', FINAL: 'Cuối kỳ',
    };

    const scoreRows = scores.map(ss => {
      const sm = new Map(ss.scoreDetails.map(d => [d.testType.code, d.score]));
      const avg = ss.averageScore;
      return [
        { text: ss.scoreSheet.subject.name },
        ...ttCodes.map(c => ({ text: sm.has(c) ? String(sm.get(c)) : '—', alignment: 'center' })),
        { text: avg != null ? String(avg) : '—', alignment: 'center', bold: true },
        { text: ss.passStatus === true ? 'Đạt' : ss.passStatus === false ? 'Chưa đạt' : '—',
          alignment: 'center', color: ss.passStatus === true ? '#166534' : '#991b1b' },
      ];
    });

    const semAvg = result?.semesterAverage ??
      (scores.length > 0
        ? Math.round(scores.reduce((s, r) => s + (r.averageScore ?? 0), 0) / scores.length * 100) / 100
        : null);

    const dobStr = student.dateOfBirth.toLocaleDateString('vi-VN');
    const genderStr = student.gender === 'MALE' ? 'Nam' : student.gender === 'FEMALE' ? 'Nữ' : '—';

    const def = {
      defaultStyle: { font: 'Roboto', fontSize: 10 },
      content: [
        { text: 'PHIẾU KẾT QUẢ HỌC TẬP', style: 'title' },
        { text: `${semester.schoolYear.name}  –  ${semester.name}`, style: 'sub' },
        { text: ' ' },
        {
          columns: [
            [
              { text: [{ text: 'Họ tên: ', bold: true }, student.fullName] },
              { text: [{ text: 'Mã học sinh: ', bold: true }, student.studentCode] },
              { text: [{ text: 'Lớp: ', bold: true }, enrollment?.class.name ?? '—'] },
            ],
            [
              { text: [{ text: 'Giới tính: ', bold: true }, genderStr] },
              { text: [{ text: 'Ngày sinh: ', bold: true }, dobStr] },
              { text: [{ text: 'Địa chỉ: ', bold: true }, student.address ?? '—'] },
            ],
          ],
          margin: [0, 0, 0, 12],
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 45, 45, 50, 50, 50, 55],
            body: [
              [
                { text: 'Môn học',   bold: true, fillColor: '#f1f5f9' },
                ...ttCodes.map(c => ({ text: ttLabels[c], bold: true, fillColor: '#f1f5f9', alignment: 'center' })),
                { text: 'Điểm TB',  bold: true, fillColor: '#f1f5f9', alignment: 'center' },
                { text: 'Kết quả',  bold: true, fillColor: '#f1f5f9', alignment: 'center' },
              ],
              ...scoreRows,
            ],
          },
          layout: { hLineWidth: () => 0.5, vLineWidth: () => 0, hLineColor: () => '#e2e8f0', paddingTop: () => 4, paddingBottom: () => 4 },
        },
        { text: ' ' },
        {
          columns: [
            { text: [{ text: 'Điểm TB học kỳ: ', bold: true }, semAvg != null ? String(semAvg) : '—'] },
            { text: [{ text: 'Học lực: ', bold: true }, result ? (ACADEMIC_RATING_VN[result.academicRating] ?? result.academicRating) : '—'] },
            { text: [{ text: 'Hạnh kiểm: ', bold: true }, conduct?.finalRating ? (CONDUCT_VN[conduct.finalRating] ?? conduct.finalRating) : '—'] },
          ],
        },
      ],
      styles: {
        title: { fontSize: 14, bold: true, alignment: 'center', margin: [0, 0, 0, 4] },
        sub:   { fontSize: 11, alignment: 'center', color: '#475569', margin: [0, 0, 0, 12] },
      },
    };

    return this.buildPdf(def);
  }

  // ─── Helper ────────────────────────────────────────────────────────────────

  private buildPdf(def: unknown): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = printer.createPdfKitDocument(def);
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
