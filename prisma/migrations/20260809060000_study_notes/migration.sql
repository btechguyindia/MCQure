-- CreateEnum
CREATE TYPE "StudyNoteKind" AS ENUM ('CONCEPT_NOTES', 'MNEMONICS', 'EXAM_TRAPS', 'COMPARISON', 'QUICK_SUMMARY');

-- CreateTable
CREATE TABLE "StudyNote" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "kind" "StudyNoteKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudyNote_topicId_idx" ON "StudyNote"("topicId");

-- AddForeignKey
ALTER TABLE "StudyNote" ADD CONSTRAINT "StudyNote_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
