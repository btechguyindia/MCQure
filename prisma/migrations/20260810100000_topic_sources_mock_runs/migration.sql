-- TopicSource: curated external reading links per topic
CREATE TABLE "TopicSource" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "author" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicSource_pkey" PRIMARY KEY ("id")
);

-- MockRun: a completed mock test run linked to its immutable practice session
CREATE TABLE "MockRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "paperId" TEXT,
    "sectionId" TEXT,
    "topicId" TEXT,
    "questionCount" INTEGER NOT NULL,
    "answered" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "incorrect" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "timeSpentMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MockRun_sessionId_key" ON "MockRun"("sessionId");
CREATE INDEX "TopicSource_topicId_idx" ON "TopicSource"("topicId");
CREATE INDEX "MockRun_userId_createdAt_idx" ON "MockRun"("userId", "createdAt");

ALTER TABLE "TopicSource" ADD CONSTRAINT "TopicSource_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MockRun" ADD CONSTRAINT "MockRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MockRun" ADD CONSTRAINT "MockRun_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PracticeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MockRun" ADD CONSTRAINT "MockRun_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MockRun" ADD CONSTRAINT "MockRun_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MockRun" ADD CONSTRAINT "MockRun_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
