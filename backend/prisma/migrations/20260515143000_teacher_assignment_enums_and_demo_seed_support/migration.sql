-- Add enum types used by the Prisma schema.
DO $$ BEGIN
  CREATE TYPE "TeacherAssignmentType" AS ENUM ('HOMEROOM', 'SUBJECT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ScoreSheetStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'LOCKED', 'NEEDS_CORRECTION');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- TeacherAssignment now carries the school year directly and can be deactivated.
ALTER TABLE "teacher_assignments"
  ADD COLUMN IF NOT EXISTS "school_year_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

UPDATE "teacher_assignments" ta
SET "school_year_id" = c."school_year_id"
FROM "classes" c
WHERE ta."class_id" = c."id"
  AND ta."school_year_id" IS NULL;

ALTER TABLE "teacher_assignments"
  ALTER COLUMN "school_year_id" SET NOT NULL;

ALTER TABLE "teacher_assignments"
  ADD CONSTRAINT "teacher_assignments_school_year_id_fkey"
  FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Rebuild assignment constraints/indexes around the enum conversion.
ALTER TABLE "teacher_assignments"
  DROP CONSTRAINT IF EXISTS "teacher_assignments_assignment_type_check",
  DROP CONSTRAINT IF EXISTS "teacher_assignments_assignment_shape_check";

DROP INDEX IF EXISTS "teacher_assignments_one_homeroom_per_class_idx";
DROP INDEX IF EXISTS "teacher_assignments_one_subject_teacher_idx";
DROP INDEX IF EXISTS "teacher_assignments_unique_subject_scope_idx";

UPDATE "teacher_assignments"
SET "assignment_type" = 'SUBJECT'
WHERE "assignment_type" = 'TEACHING';

ALTER TABLE "teacher_assignments"
  ALTER COLUMN "assignment_type" TYPE "TeacherAssignmentType"
  USING "assignment_type"::"TeacherAssignmentType";

ALTER TABLE "teacher_assignments"
  ADD CONSTRAINT "teacher_assignments_assignment_shape_check"
  CHECK (
    ("assignment_type" = 'HOMEROOM' AND "subject_id" IS NULL AND "semester_id" IS NULL)
    OR
    ("assignment_type" = 'SUBJECT' AND "subject_id" IS NOT NULL AND "semester_id" IS NOT NULL)
  );

CREATE UNIQUE INDEX "teacher_assignments_one_active_homeroom_idx"
  ON "teacher_assignments"("class_id", "school_year_id")
  WHERE "assignment_type" = 'HOMEROOM' AND "is_active" = true;

CREATE UNIQUE INDEX "teacher_assignments_one_active_subject_teacher_idx"
  ON "teacher_assignments"("class_id", "subject_id", "semester_id")
  WHERE "assignment_type" = 'SUBJECT' AND "is_active" = true;

CREATE UNIQUE INDEX "teacher_assignments_unique_active_subject_scope_idx"
  ON "teacher_assignments"("teacher_id", "class_id", "subject_id", "semester_id")
  WHERE "assignment_type" = 'SUBJECT' AND "is_active" = true;

CREATE INDEX IF NOT EXISTS "teacher_assignments_school_year_type_active_idx"
  ON "teacher_assignments"("school_year_id", "assignment_type", "is_active");

CREATE INDEX IF NOT EXISTS "teacher_assignments_scope_type_active_idx"
  ON "teacher_assignments"("class_id", "subject_id", "semester_id", "assignment_type", "is_active");

-- ScoreSheet.status should be constrained to the workflow states used by the app.
ALTER TABLE "score_sheets"
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "score_sheets"
  ALTER COLUMN "status" TYPE "ScoreSheetStatus"
  USING "status"::"ScoreSheetStatus";

ALTER TABLE "score_sheets"
  ALTER COLUMN "status" SET DEFAULT 'DRAFT';

CREATE UNIQUE INDEX IF NOT EXISTS "system_parameters_school_year_id_key"
  ON "system_parameters"("school_year_id");
