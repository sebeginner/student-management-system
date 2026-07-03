-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "class_id" INTEGER;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
