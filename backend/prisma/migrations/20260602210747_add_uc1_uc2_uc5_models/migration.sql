-- DropForeignKey
ALTER TABLE "teacher_assignments" DROP CONSTRAINT "teacher_assignments_semester_id_fkey";

-- DropForeignKey
ALTER TABLE "teacher_assignments" DROP CONSTRAINT "teacher_assignments_subject_id_fkey";

-- DropIndex
DROP INDEX "teacher_assignments_class_id_subject_id_semester_id_assignment_";

-- CreateTable
CREATE TABLE "semester_student_results" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "semester_id" INTEGER NOT NULL,
    "class_id" INTEGER NOT NULL,
    "semester_average" DOUBLE PRECISION NOT NULL,
    "academic_rating" TEXT NOT NULL,
    "subject_count" INTEGER NOT NULL,
    "failed_subject_count" INTEGER NOT NULL,
    "finalized_at" TIMESTAMP(3) NOT NULL,
    "finalized_by_id" INTEGER NOT NULL,

    CONSTRAINT "semester_student_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "year_end_results" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "school_year_id" INTEGER NOT NULL,
    "class_id" INTEGER NOT NULL,
    "hk1_average" DOUBLE PRECISION NOT NULL,
    "hk2_average" DOUBLE PRECISION NOT NULL,
    "year_average" DOUBLE PRECISION NOT NULL,
    "academic_rating" TEXT NOT NULL,
    "conduct_rating" TEXT,
    "decision" TEXT NOT NULL,
    "decision_note" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalized_by_id" INTEGER NOT NULL,

    CONSTRAINT "year_end_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conduct_assessments" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "semester_id" INTEGER NOT NULL,
    "class_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "final_rating" TEXT,
    "teacher_note" TEXT,
    "review_note" TEXT,
    "submitted_by_id" INTEGER NOT NULL,
    "reviewed_by_id" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conduct_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conduct_criteria" (
    "id" SERIAL NOT NULL,
    "assessment_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "conduct_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable_slots" (
    "id" SERIAL NOT NULL,
    "semester_id" INTEGER NOT NULL,
    "class_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "room" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "timetable_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "semester_student_results_student_id_semester_id_key" ON "semester_student_results"("student_id", "semester_id");

-- CreateIndex
CREATE UNIQUE INDEX "year_end_results_student_id_school_year_id_key" ON "year_end_results"("student_id", "school_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "conduct_assessments_student_id_semester_id_key" ON "conduct_assessments"("student_id", "semester_id");

-- CreateIndex
CREATE UNIQUE INDEX "timetable_slots_semester_id_class_id_day_of_week_period_key" ON "timetable_slots"("semester_id", "class_id", "day_of_week", "period");

-- CreateIndex
CREATE UNIQUE INDEX "timetable_slots_semester_id_teacher_id_day_of_week_period_key" ON "timetable_slots"("semester_id", "teacher_id", "day_of_week", "period");

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semester_student_results" ADD CONSTRAINT "semester_student_results_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semester_student_results" ADD CONSTRAINT "semester_student_results_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semester_student_results" ADD CONSTRAINT "semester_student_results_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semester_student_results" ADD CONSTRAINT "semester_student_results_finalized_by_id_fkey" FOREIGN KEY ("finalized_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "year_end_results" ADD CONSTRAINT "year_end_results_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "year_end_results" ADD CONSTRAINT "year_end_results_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "year_end_results" ADD CONSTRAINT "year_end_results_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "year_end_results" ADD CONSTRAINT "year_end_results_finalized_by_id_fkey" FOREIGN KEY ("finalized_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conduct_assessments" ADD CONSTRAINT "conduct_assessments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conduct_assessments" ADD CONSTRAINT "conduct_assessments_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conduct_assessments" ADD CONSTRAINT "conduct_assessments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conduct_assessments" ADD CONSTRAINT "conduct_assessments_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conduct_assessments" ADD CONSTRAINT "conduct_assessments_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conduct_criteria" ADD CONSTRAINT "conduct_criteria_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "conduct_assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "teacher_assignments_school_year_type_active_idx" RENAME TO "teacher_assignments_school_year_id_assignment_type_is_activ_idx";

-- RenameIndex
ALTER INDEX "teacher_assignments_scope_type_active_idx" RENAME TO "teacher_assignments_class_id_subject_id_semester_id_assignm_idx";
