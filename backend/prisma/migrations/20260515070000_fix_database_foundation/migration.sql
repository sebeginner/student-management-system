-- Normalize old demo assignment type before tightening assignment rules.
UPDATE "teacher_assignments"
SET "assignment_type" = 'SUBJECT'
WHERE "assignment_type" = 'TEACHING';

-- Teacher assignments need to represent both homeroom and subject teaching scopes.
DROP INDEX IF EXISTS "teacher_assignments_teacher_id_class_id_subject_id_semester_key";

ALTER TABLE "teacher_assignments"
  ALTER COLUMN "subject_id" DROP NOT NULL,
  ALTER COLUMN "semester_id" DROP NOT NULL;

ALTER TABLE "teacher_assignments"
  ADD CONSTRAINT "teacher_assignments_assignment_type_check"
  CHECK ("assignment_type" IN ('HOMEROOM', 'SUBJECT'));

ALTER TABLE "teacher_assignments"
  ADD CONSTRAINT "teacher_assignments_assignment_shape_check"
  CHECK (
    ("assignment_type" = 'HOMEROOM' AND "subject_id" IS NULL AND "semester_id" IS NULL)
    OR
    ("assignment_type" = 'SUBJECT' AND "subject_id" IS NOT NULL AND "semester_id" IS NOT NULL)
  );

CREATE INDEX "teacher_assignments_assignment_type_idx"
  ON "teacher_assignments"("assignment_type");

CREATE INDEX "teacher_assignments_teacher_id_assignment_type_idx"
  ON "teacher_assignments"("teacher_id", "assignment_type");

CREATE INDEX "teacher_assignments_class_id_assignment_type_idx"
  ON "teacher_assignments"("class_id", "assignment_type");

CREATE INDEX "teacher_assignments_class_id_subject_id_semester_id_assignment_idx"
  ON "teacher_assignments"("class_id", "subject_id", "semester_id", "assignment_type");

CREATE UNIQUE INDEX "teacher_assignments_one_homeroom_per_class_idx"
  ON "teacher_assignments"("class_id")
  WHERE "assignment_type" = 'HOMEROOM';

CREATE UNIQUE INDEX "teacher_assignments_one_subject_teacher_idx"
  ON "teacher_assignments"("class_id", "subject_id", "semester_id")
  WHERE "assignment_type" = 'SUBJECT';

CREATE UNIQUE INDEX "teacher_assignments_unique_subject_scope_idx"
  ON "teacher_assignments"("teacher_id", "class_id", "subject_id", "semester_id")
  WHERE "assignment_type" = 'SUBJECT';

-- Score change requests support the locked score correction workflow.
CREATE TABLE "score_change_requests" (
    "id" SERIAL NOT NULL,
    "score_sheet_id" INTEGER NOT NULL,
    "student_subject_score_id" INTEGER NOT NULL,
    "score_detail_id" INTEGER,
    "test_type_id" INTEGER NOT NULL,
    "attempt_no" INTEGER NOT NULL DEFAULT 1,
    "old_score" DOUBLE PRECISION NOT NULL,
    "new_score" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requested_by_id" INTEGER NOT NULL,
    "reviewed_by_id" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "review_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "score_change_requests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "score_change_requests_status_check" CHECK ("status" IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE INDEX "score_change_requests_status_idx"
  ON "score_change_requests"("status");

CREATE INDEX "score_change_requests_score_sheet_id_status_idx"
  ON "score_change_requests"("score_sheet_id", "status");

CREATE INDEX "score_change_requests_requested_by_id_idx"
  ON "score_change_requests"("requested_by_id");

CREATE INDEX "score_change_requests_reviewed_by_id_idx"
  ON "score_change_requests"("reviewed_by_id");

CREATE UNIQUE INDEX "score_change_requests_one_pending_per_score_idx"
  ON "score_change_requests"("score_sheet_id", "student_subject_score_id", "test_type_id", "attempt_no")
  WHERE "status" = 'PENDING';

ALTER TABLE "score_change_requests"
  ADD CONSTRAINT "score_change_requests_score_sheet_id_fkey"
  FOREIGN KEY ("score_sheet_id") REFERENCES "score_sheets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "score_change_requests"
  ADD CONSTRAINT "score_change_requests_student_subject_score_id_fkey"
  FOREIGN KEY ("student_subject_score_id") REFERENCES "student_subject_scores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "score_change_requests"
  ADD CONSTRAINT "score_change_requests_score_detail_id_fkey"
  FOREIGN KEY ("score_detail_id") REFERENCES "score_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "score_change_requests"
  ADD CONSTRAINT "score_change_requests_test_type_id_fkey"
  FOREIGN KEY ("test_type_id") REFERENCES "test_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "score_change_requests"
  ADD CONSTRAINT "score_change_requests_requested_by_id_fkey"
  FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "score_change_requests"
  ADD CONSTRAINT "score_change_requests_reviewed_by_id_fkey"
  FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
