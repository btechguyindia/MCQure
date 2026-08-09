-- CreateEnum
CREATE TYPE "VisitSource" AS ENUM ('STUDY', 'REVISION');

-- CreateEnum
CREATE TYPE "WeightClass" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "WeightBasis" AS ENUM ('OFFICIAL', 'ESTIMATED', 'UNKNOWN');

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "conceptId" TEXT;

-- CreateTable
CREATE TABLE "Concept" (
    "id" TEXT NOT NULL,
    "subtopicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Concept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paper" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "questionCount" INTEGER NOT NULL,
    "marksPerQuestion" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT -0.25,
    "timeLimitMinutes" INTEGER,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionSubject" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "questionShare" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SectionSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlueprintTopicWeight" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "weight" "WeightClass" NOT NULL,
    "estimatedQuestions" DOUBLE PRECISION,
    "basis" "WeightBasis" NOT NULL,
    "basisNote" TEXT,

    CONSTRAINT "BlueprintTopicWeight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreparation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examId" TEXT,
    "examAttemptYear" INTEGER,
    "prepStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetExamDate" TIMESTAMP(3),
    "targetScore" DOUBLE PRECISION,
    "dailyTarget" INTEGER NOT NULL DEFAULT 25,
    "weeklyTarget" INTEGER NOT NULL DEFAULT 175,
    "stage" TEXT NOT NULL DEFAULT 'starting',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreparation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyVisit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "source" "VisitSource" NOT NULL DEFAULT 'STUDY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Concept_subtopicId_idx" ON "Concept"("subtopicId");

-- CreateIndex
CREATE UNIQUE INDEX "Concept_subtopicId_name_key" ON "Concept"("subtopicId", "name");

-- CreateIndex
CREATE INDEX "Paper_examId_idx" ON "Paper"("examId");

-- CreateIndex
CREATE UNIQUE INDEX "Paper_examId_name_key" ON "Paper"("examId", "name");

-- CreateIndex
CREATE INDEX "Section_paperId_idx" ON "Section"("paperId");

-- CreateIndex
CREATE INDEX "SectionSubject_subjectId_idx" ON "SectionSubject"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "SectionSubject_sectionId_subjectId_key" ON "SectionSubject"("sectionId", "subjectId");

-- CreateIndex
CREATE INDEX "BlueprintTopicWeight_examId_idx" ON "BlueprintTopicWeight"("examId");

-- CreateIndex
CREATE UNIQUE INDEX "BlueprintTopicWeight_examId_topicId_key" ON "BlueprintTopicWeight"("examId", "topicId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreparation_userId_key" ON "UserPreparation"("userId");

-- CreateIndex
CREATE INDEX "StudyVisit_userId_topicId_idx" ON "StudyVisit"("userId", "topicId");

-- CreateIndex
CREATE INDEX "StudyVisit_userId_createdAt_idx" ON "StudyVisit"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Concept" ADD CONSTRAINT "Concept_subtopicId_fkey" FOREIGN KEY ("subtopicId") REFERENCES "Subtopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paper" ADD CONSTRAINT "Paper_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionSubject" ADD CONSTRAINT "SectionSubject_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionSubject" ADD CONSTRAINT "SectionSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlueprintTopicWeight" ADD CONSTRAINT "BlueprintTopicWeight_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlueprintTopicWeight" ADD CONSTRAINT "BlueprintTopicWeight_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreparation" ADD CONSTRAINT "UserPreparation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreparation" ADD CONSTRAINT "UserPreparation_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyVisit" ADD CONSTRAINT "StudyVisit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyVisit" ADD CONSTRAINT "StudyVisit_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
