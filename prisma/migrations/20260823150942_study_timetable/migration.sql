-- CreateEnum
CREATE TYPE "ScheduleCycle" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "StudyTimetable" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cycle" "ScheduleCycle" NOT NULL DEFAULT 'WEEKLY',
    "targetQuestions" INTEGER NOT NULL DEFAULT 175,
    "slots" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyTimetable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudyTimetable_userId_idx" ON "StudyTimetable"("userId");

-- AddForeignKey
ALTER TABLE "StudyTimetable" ADD CONSTRAINT "StudyTimetable_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
