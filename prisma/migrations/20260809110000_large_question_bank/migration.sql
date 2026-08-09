-- CreateEnum
CREATE TYPE "QuestionQualityStatus" AS ENUM ('PENDING', 'APPROVED', 'QUARANTINED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DuplicateMethod" AS ENUM ('EXACT', 'NEAR', 'SEMANTIC');

-- CreateEnum
CREATE TYPE "IngestionJobKind" AS ENUM ('PYQ_IMPORT', 'ORIGINAL_GENERATION', 'VARIANT_GENERATION', 'DEDUP_SCAN');

-- CreateEnum
CREATE TYPE "IngestionJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- AlterEnum
ALTER TYPE "QuestionSourceType" ADD VALUE 'OFFICIAL';
ALTER TYPE "QuestionSourceType" ADD VALUE 'LICENSED';
ALTER TYPE "QuestionSourceType" ADD VALUE 'WEB_DERIVED_ORIGINAL';
ALTER TYPE "QuestionSourceType" ADD VALUE 'USER_CREATED';

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "answeredCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "avgResponseTimeMs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "duplicateGroupId" TEXT,
ADD COLUMN     "fingerprint" TEXT,
ADD COLUMN     "lastAttemptedAt" TIMESTAMP(3),
ADD COLUMN     "normalizedText" TEXT,
ADD COLUMN     "qualityNote" TEXT,
ADD COLUMN     "qualityStatus" "QuestionQualityStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "reportCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "searchText" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "timesAttempted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timesCorrect" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timesIncorrect" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timesSkipped" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "QuestionDuplicate" (
    "id" TEXT NOT NULL,
    "questionAId" TEXT NOT NULL,
    "questionBId" TEXT NOT NULL,
    "method" "DuplicateMethod" NOT NULL,
    "similarity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionDuplicate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionJob" (
    "id" TEXT NOT NULL,
    "kind" "IngestionJobKind" NOT NULL,
    "status" "IngestionJobStatus" NOT NULL DEFAULT 'QUEUED',
    "userId" TEXT,
    "examId" TEXT,
    "params" JSONB,
    "requested" INTEGER NOT NULL DEFAULT 0,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "accepted" INTEGER NOT NULL DEFAULT 0,
    "rejected" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "IngestionJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuestionDuplicate_questionAId_idx" ON "QuestionDuplicate"("questionAId");

-- CreateIndex
CREATE INDEX "QuestionDuplicate_questionBId_idx" ON "QuestionDuplicate"("questionBId");

-- CreateIndex
CREATE INDEX "QuestionDuplicate_similarity_idx" ON "QuestionDuplicate"("similarity");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionDuplicate_questionAId_questionBId_key" ON "QuestionDuplicate"("questionAId", "questionBId");

-- CreateIndex
CREATE INDEX "IngestionJob_status_idx" ON "IngestionJob"("status");

-- CreateIndex
CREATE INDEX "IngestionJob_createdAt_idx" ON "IngestionJob"("createdAt");

-- CreateIndex
CREATE INDEX "Question_subtopicId_idx" ON "Question"("subtopicId");

-- CreateIndex
CREATE INDEX "Question_conceptId_idx" ON "Question"("conceptId");

-- CreateIndex
CREATE INDEX "Question_qualityStatus_idx" ON "Question"("qualityStatus");

-- CreateIndex
CREATE INDEX "Question_examRelevance_idx" ON "Question"("examRelevance");

-- CreateIndex
CREATE INDEX "Question_fingerprint_idx" ON "Question"("fingerprint");

-- CreateIndex
CREATE INDEX "Question_duplicateGroupId_idx" ON "Question"("duplicateGroupId");

-- CreateIndex
CREATE INDEX "Question_sourceId_idx" ON "Question"("sourceId");

-- AddForeignKey
ALTER TABLE "QuestionDuplicate" ADD CONSTRAINT "QuestionDuplicate_questionAId_fkey" FOREIGN KEY ("questionAId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionDuplicate" ADD CONSTRAINT "QuestionDuplicate_questionBId_fkey" FOREIGN KEY ("questionBId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestionJob" ADD CONSTRAINT "IngestionJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestionJob" ADD CONSTRAINT "IngestionJob_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Enable trigram support so the question-bank explorer can use a GIN index
-- for scalable ILIKE '%term%' search over searchText (the pool targets 1M+).
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "Question_searchText_trgm_idx" ON "Question" USING GIN ("searchText" gin_trgm_ops);
