-- Add unique constraints to keep syllabus configuration idempotent.
-- There is no existing data, so this is safe.
CREATE UNIQUE INDEX "Subject_examId_name_key" ON "Subject"("examId", "name");
CREATE UNIQUE INDEX "Topic_subjectId_name_key" ON "Topic"("subjectId", "name");
CREATE UNIQUE INDEX "Subtopic_topicId_name_key" ON "Subtopic"("topicId", "name");
