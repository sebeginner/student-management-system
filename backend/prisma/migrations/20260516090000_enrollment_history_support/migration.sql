-- Allow preserving enrollment history when a student transfers classes in the same semester.
DROP INDEX IF EXISTS "student_class_enrollments_student_id_semester_id_key";

ALTER TABLE "student_class_enrollments"
  ADD COLUMN IF NOT EXISTS "ended_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reason" TEXT;

CREATE INDEX IF NOT EXISTS "student_class_enrollments_student_id_semester_id_status_idx"
  ON "student_class_enrollments"("student_id", "semester_id", "status");

CREATE INDEX IF NOT EXISTS "student_class_enrollments_class_id_semester_id_status_idx"
  ON "student_class_enrollments"("class_id", "semester_id", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "student_class_enrollments_one_active_per_semester_idx"
  ON "student_class_enrollments"("student_id", "semester_id")
  WHERE "status" = 'ACTIVE';
