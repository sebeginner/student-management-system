import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type {
  SchoolClass,
  SchoolYear,
  Semester,
  Subject,
  Teacher,
  TeacherAssignment,
  TeacherAssignmentPayload,
  TeacherAssignmentType,
} from '../../lib/academic-api';
import { commonLabels } from '../../lib/uiText';

interface TeacherAssignmentFormProps {
  assignment?: TeacherAssignment | null;
  classes: SchoolClass[];
  isSaving: boolean;
  schoolYears: SchoolYear[];
  semesters: Semester[];
  subjects: Subject[];
  teachers: Teacher[];
  onCancel: () => void;
  onSubmit: (payload: TeacherAssignmentPayload) => Promise<void>;
}

const fieldClass = 'space-y-1.5 text-sm font-medium text-slate-700';
const selectClass =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500';

export const TeacherAssignmentForm = ({
  assignment,
  classes,
  isSaving,
  onCancel,
  onSubmit,
  schoolYears,
  semesters,
  subjects,
  teachers,
}: TeacherAssignmentFormProps) => {
  const [teacherId, setTeacherId] = useState(String(assignment?.teacherId ?? ''));
  const [classId, setClassId] = useState(String(assignment?.classId ?? ''));
  const [assignmentType, setAssignmentType] =
    useState<TeacherAssignmentType>(assignment?.assignmentType ?? 'HOMEROOM');
  const [schoolYearId, setSchoolYearId] = useState(
    String(
      assignment?.schoolYearId ??
        schoolYears.find((year) => year.isActive)?.id ??
        '',
    ),
  );
  const [semesterId, setSemesterId] = useState(
    String(assignment?.semesterId ?? ''),
  );
  const [subjectId, setSubjectId] = useState(String(assignment?.subjectId ?? ''));
  const [isActive, setIsActive] = useState(assignment?.isActive ?? true);

  const selectedClass = useMemo(
    () => classes.find((classItem) => classItem.id === Number(classId)),
    [classId, classes],
  );
  const availableSemesters = semesters.filter(
    (semester) => semester.schoolYearId === Number(schoolYearId),
  );
  const isSubjectAssignment = assignmentType === 'SUBJECT';

  useEffect(() => {
    if (!selectedClass) {
      return;
    }

    setSchoolYearId(String(selectedClass.schoolYearId));
  }, [selectedClass]);

  useEffect(() => {
    if (assignmentType === 'HOMEROOM') {
      setSubjectId('');
      setSemesterId('');
    }
  }, [assignmentType]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: TeacherAssignmentPayload = {
      teacherId: Number(teacherId),
      classId: Number(classId),
      schoolYearId: Number(schoolYearId),
      assignmentType,
      isActive,
      subjectId: isSubjectAssignment ? Number(subjectId) : null,
      semesterId: isSubjectAssignment ? Number(semesterId) : null,
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
        Chọn “Chủ nhiệm” để phân công GVCN theo năm học. Chọn “Bộ môn” để phân
        công GVBM theo lớp, môn học và học kỳ.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className={fieldClass}>
          <span>Năm học</span>
          <select
            required
            value={schoolYearId}
            onChange={(event) => setSchoolYearId(event.target.value)}
            className={selectClass}
          >
            <option value="">Chọn năm học</option>
            {schoolYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
        </label>

        <label className={fieldClass}>
          <span>Học kỳ</span>
          <select
            required={isSubjectAssignment}
            disabled={!isSubjectAssignment}
            value={semesterId}
            onChange={(event) => setSemesterId(event.target.value)}
            className={selectClass}
          >
            <option value="">
              {isSubjectAssignment
                ? 'Chọn học kỳ'
                : 'Không áp dụng cho chủ nhiệm'}
            </option>
            {availableSemesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.name}
              </option>
            ))}
          </select>
          {!isSubjectAssignment ? (
            <span className="text-xs font-normal text-slate-500">
              Phân công chủ nhiệm áp dụng theo năm học.
            </span>
          ) : null}
        </label>

        <label className={fieldClass}>
          <span>Lớp</span>
          <select
            required
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
            className={selectClass}
          >
            <option value="">Chọn lớp</option>
            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name} - {classItem.schoolYear?.name}
              </option>
            ))}
          </select>
        </label>

        <label className={fieldClass}>
          <span>Môn học</span>
          <select
            required={isSubjectAssignment}
            disabled={!isSubjectAssignment}
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            className={selectClass}
          >
            <option value="">
              {isSubjectAssignment
                ? 'Chọn môn học'
                : 'Không áp dụng cho chủ nhiệm'}
            </option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>

        <label className={fieldClass}>
          <span>Giáo viên</span>
          <select
            required
            value={teacherId}
            onChange={(event) => setTeacherId(event.target.value)}
            className={selectClass}
          >
            <option value="">Chọn giáo viên</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.teacherCode} - {teacher.fullName}
              </option>
            ))}
          </select>
        </label>

        <label className={fieldClass}>
          <span>Loại phân công</span>
          <select
            value={assignmentType}
            onChange={(event) =>
              setAssignmentType(event.target.value as TeacherAssignmentType)
            }
            className={selectClass}
          >
            <option value="HOMEROOM">Chủ nhiệm</option>
            <option value="SUBJECT">Bộ môn</option>
          </select>
        </label>
      </div>

      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600"
        />
        Phân công đang hiệu lực
      </label>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {commonLabels.cancel}
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isSaving ? commonLabels.saving : commonLabels.save}
        </button>
      </div>
    </form>
  );
};
