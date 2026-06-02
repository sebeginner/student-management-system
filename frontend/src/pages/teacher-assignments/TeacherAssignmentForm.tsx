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
      subjectId: assignmentType === 'SUBJECT' ? Number(subjectId) : null,
      semesterId: assignmentType === 'SUBJECT' ? Number(semesterId) : null,
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Teacher</span>
          <select
            required
            value={teacherId}
            onChange={(event) => setTeacherId(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.teacherCode} - {teacher.fullName}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Class</span>
          <select
            required
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select class</option>
            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name} - {classItem.schoolYear?.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Assignment type</span>
          <select
            value={assignmentType}
            onChange={(event) =>
              setAssignmentType(event.target.value as TeacherAssignmentType)
            }
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="HOMEROOM">HOMEROOM</option>
            <option value="SUBJECT">SUBJECT</option>
          </select>
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>School year</span>
          <select
            required
            value={schoolYearId}
            onChange={(event) => setSchoolYearId(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select school year</option>
            {schoolYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
        </label>

        {assignmentType === 'SUBJECT' ? (
          <>
            <label className="space-y-1 text-sm font-medium text-slate-700">
              <span>Subject</span>
              <select
                required
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm font-medium text-slate-700">
              <span>Semester</span>
              <select
                required
                value={semesterId}
                onChange={(event) => setSemesterId(event.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Select semester</option>
                {availableSemesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}
      </div>

      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        Active assignment
      </label>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-blue-300"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
};
