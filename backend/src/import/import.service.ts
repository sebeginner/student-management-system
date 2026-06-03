import { BadRequestException, Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';

export interface ImportError { row: number; field: string; message: string; }

export interface StudentImportRow {
  studentCode: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  admissionDate?: string;
  address?: string;
  email?: string;
  note?: string;
}

export interface ScoreImportRow {
  studentCode: string;
  ORAL_15M?: number;
  ONE_PERIOD?: number;
  MIDTERM?: number;
  FINAL?: number;
}

@Injectable()
export class ImportService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Student Import ─────────────────────────────────────────────────────────

  async previewStudentImport(buffer: Buffer): Promise<{
    valid: StudentImportRow[];
    errors: ImportError[];
  }> {
    const rows = this.parseXlsx<Record<string, string>>(buffer);
    const valid: StudentImportRow[] = [];
    const errors: ImportError[] = [];

    const existingCodes = new Set(
      (await this.prisma.student.findMany({ select: { studentCode: true } })).map(s => s.studentCode),
    );

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 2; // row 1 = header

      if (!r['Mã HS'] && !r['studentCode']) {
        errors.push({ row: rowNum, field: 'studentCode', message: 'Thiếu mã học sinh' });
        continue;
      }

      const studentCode = String(r['Mã HS'] ?? r['studentCode'] ?? '').trim();
      const fullName    = String(r['Họ tên']  ?? r['fullName']    ?? '').trim();
      const gender      = String(r['Giới tính'] ?? r['gender']    ?? '').trim().toUpperCase();
      const dob         = String(r['Ngày sinh'] ?? r['dateOfBirth'] ?? '').trim();

      if (!studentCode) { errors.push({ row: rowNum, field: 'studentCode', message: 'Mã HS trống' }); continue; }
      if (!fullName)    { errors.push({ row: rowNum, field: 'fullName',    message: 'Họ tên trống' }); continue; }
      if (!['MALE', 'FEMALE', 'OTHER', 'NAM', 'NỮ'].includes(gender)) {
        errors.push({ row: rowNum, field: 'gender', message: `Giới tính không hợp lệ: ${gender}` }); continue;
      }
      if (!dob || isNaN(Date.parse(dob))) {
        errors.push({ row: rowNum, field: 'dateOfBirth', message: `Ngày sinh không hợp lệ: ${dob}` }); continue;
      }
      if (existingCodes.has(studentCode)) {
        errors.push({ row: rowNum, field: 'studentCode', message: `Mã HS ${studentCode} đã tồn tại` }); continue;
      }

      const normalizedGender = gender === 'NAM' ? 'MALE' : gender === 'NỮ' ? 'FEMALE' : gender;
      const admDate = String(r['Ngày vào trường'] ?? r['admissionDate'] ?? new Date().toISOString().slice(0, 10)).trim();

      valid.push({ studentCode, fullName, gender: normalizedGender, dateOfBirth: dob, admissionDate: admDate,
        address: String(r['Địa chỉ'] ?? r['address'] ?? '').trim() || undefined,
        email:   String(r['Email']    ?? r['email']    ?? '').trim() || undefined,
        note:    String(r['Ghi chú']  ?? r['note']     ?? '').trim() || undefined,
      });
    }

    return { valid, errors };
  }

  async commitStudentImport(rows: StudentImportRow[]): Promise<{ created: number }> {
    let created = 0;
    for (const row of rows) {
      await this.prisma.student.create({
        data: {
          studentCode: row.studentCode,
          fullName: row.fullName,
          gender: row.gender,
          dateOfBirth: new Date(row.dateOfBirth),
          admissionDate: new Date(row.admissionDate ?? new Date()),
          address: row.address,
          email: row.email,
          status: 'PENDING_CLASS_ASSIGNMENT',
          note: row.note ?? 'Imported from Excel',
        },
      });
      created++;
    }
    return { created };
  }

  // ─── Score Import ────────────────────────────────────────────────────────────

  async previewScoreImport(buffer: Buffer, sheetId: number): Promise<{
    valid: ScoreImportRow[];
    errors: ImportError[];
    sheetInfo: { className: string; subjectName: string; semesterName: string };
  }> {
    const sheet = await this.prisma.scoreSheet.findUnique({
      where: { id: sheetId },
      include: {
        class: true, subject: true,
        semester: { include: { schoolYear: true } },
        studentScores: { include: { student: { select: { studentCode: true } } } },
      },
    });
    if (!sheet) throw new BadRequestException('Bảng điểm không tồn tại');
    if (sheet.status !== 'DRAFT') throw new BadRequestException('Chỉ import khi bảng điểm ở trạng thái DRAFT');

    const params = await this.prisma.systemParameter.findUnique({ where: { schoolYearId: sheet.semester.schoolYearId } });
    const minScore = params?.minScore ?? 0;
    const maxScore = params?.maxScore ?? 10;

    const enrolledCodes = new Set(sheet.studentScores.map(ss => ss.student.studentCode));
    const rows = this.parseXlsx<Record<string, string | number>>(buffer);
    const valid: ScoreImportRow[] = [];
    const errors: ImportError[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 2;
      const studentCode = String(r['Mã HS'] ?? r['studentCode'] ?? '').trim();

      if (!studentCode) { errors.push({ row: rowNum, field: 'studentCode', message: 'Thiếu mã HS' }); continue; }
      if (!enrolledCodes.has(studentCode)) {
        errors.push({ row: rowNum, field: 'studentCode', message: `${studentCode} không có trong danh sách lớp` }); continue;
      }

      const parsed: ScoreImportRow = { studentCode };
      let hasError = false;

      for (const code of ['ORAL_15M', 'ONE_PERIOD', 'MIDTERM', 'FINAL'] as const) {
        const label: Record<string, string> = { ORAL_15M: 'Miệng', ONE_PERIOD: '1 tiết', MIDTERM: 'Giữa kỳ', FINAL: 'Cuối kỳ' };
        const raw = r[label[code]] ?? r[code];
        if (raw === undefined || raw === '' || raw === null) continue;
        const val = Number(raw);
        if (isNaN(val) || val < minScore || val > maxScore) {
          errors.push({ row: rowNum, field: code, message: `${label[code]}: ${raw} ngoài phạm vi [${minScore}, ${maxScore}]` });
          hasError = true;
        } else {
          parsed[code] = val;
        }
      }

      if (!hasError) valid.push(parsed);
    }

    return {
      valid, errors,
      sheetInfo: { className: sheet.class.name, subjectName: sheet.subject.name, semesterName: `${sheet.semester.schoolYear.name} ${sheet.semester.name}` },
    };
  }

  async commitScoreImport(rows: ScoreImportRow[], sheetId: number): Promise<{ updated: number }> {
    const sheet = await this.prisma.scoreSheet.findUnique({
      where: { id: sheetId },
      include: {
        semester: true,
        studentScores: {
          include: {
            student: { select: { studentCode: true } },
            scoreDetails: { include: { testType: true } },
          },
        },
      },
    });
    if (!sheet) throw new BadRequestException('Bảng điểm không tồn tại');
    if (sheet.status !== 'DRAFT') throw new BadRequestException('Chỉ import khi DRAFT');

    const testTypes = await this.prisma.testType.findMany();
    const ttByCode = new Map(testTypes.map(t => [t.code, t]));

    let updated = 0;
    for (const row of rows) {
      const ss = sheet.studentScores.find(s => s.student.studentCode === row.studentCode);
      if (!ss) continue;

      for (const [code, value] of Object.entries(row) as [string, number][]) {
        if (code === 'studentCode' || value === undefined) continue;
        const testType = ttByCode.get(code);
        if (!testType) continue;

        await this.prisma.scoreDetail.upsert({
          where: {
            studentSubjectScoreId_testTypeId_attemptNo: {
              studentSubjectScoreId: ss.id,
              testTypeId: testType.id,
              attemptNo: 1,
            },
          },
          update: { score: value, weightSnapshot: testType.defaultWeight },
          create: {
            studentSubjectScoreId: ss.id,
            testTypeId: testType.id,
            attemptNo: 1,
            score: value,
            weightSnapshot: testType.defaultWeight,
          },
        });
      }
      updated++;
    }
    return { updated };
  }

  // ─── Template generation ─────────────────────────────────────────────────────

  async generateStudentTemplate(): Promise<Buffer> {
    const wb = XLSX.utils.book_new();
    const headers = ['Mã HS', 'Họ tên', 'Giới tính', 'Ngày sinh', 'Ngày vào trường', 'Địa chỉ', 'Email', 'Ghi chú'];
    const sample = ['HS999', 'Nguyễn Văn A', 'MALE', '2009-01-15', '2025-09-01', 'TP.HCM', 'example@school.com', ''];
    const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách học sinh');
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as ArrayBuffer);
  }

  async generateScoreSheetTemplate(sheetId: number): Promise<Buffer> {
    const sheet = await this.prisma.scoreSheet.findUnique({
      where: { id: sheetId },
      include: {
        class: true, subject: true,
        studentScores: {
          include: { student: { select: { studentCode: true, fullName: true } } },
          orderBy: { student: { studentCode: 'asc' } },
        },
      },
    });
    if (!sheet) throw new BadRequestException('Bảng điểm không tồn tại');

    const wb = XLSX.utils.book_new();
    const headers = ['Mã HS', 'Họ tên', 'Miệng', '1 tiết', 'Giữa kỳ', 'Cuối kỳ'];
    const data = sheet.studentScores.map(ss => [ss.student.studentCode, ss.student.fullName, '', '', '', '']);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    XLSX.utils.book_append_sheet(wb, ws, `${sheet.class.name}-${sheet.subject.name}`);
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as ArrayBuffer);
  }

  private parseXlsx<T>(buffer: Buffer): T[] {
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json<T>(ws, { defval: '' });
  }
}
