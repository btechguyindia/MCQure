// Seed: DSSSB TGT Computer Science exam configuration, syllabus and a bank of
// original practice questions. Idempotent — safe to run repeatedly.
//
// IMPORTANT: every question created here is AI_GENERATED original content. It
// is never labelled or implied to be a real previous-year question.

import { PrismaClient, QuestionSourceType } from "@prisma/client";
import { hash } from "bcryptjs";
import { DSSSB_EXAM, DSSSB_SCORING, SUBJECTS } from "./seed-data/syllabus";
import { QUESTIONS } from "./seed-data/questions";
import { STUDY_NOTES } from "./seed-data/study";
import {
  BLUEPRINT,
  BLUEPRINT_ONLY_SUBJECTS,
  SUBJECT_WEIGHTS,
} from "./seed-data/blueprint";

const prisma = new PrismaClient();

async function main() {
  // 1. Exam
  const exam = await prisma.exam.upsert({
    where: { slug: DSSSB_EXAM.slug },
    update: { name: DSSSB_EXAM.name, description: DSSSB_EXAM.description },
    create: {
      slug: DSSSB_EXAM.slug,
      name: DSSSB_EXAM.name,
      description: DSSSB_EXAM.description,
    },
  });

  // 0b. Default user (created once; existing account is left untouched)
  const DEFAULT_EMAIL = "prathmesh@gmail.com";
  const existingUser = await prisma.user.findUnique({
    where: { email: DEFAULT_EMAIL },
  });
  if (!existingUser) {
    await prisma.user.create({
      data: {
        email: DEFAULT_EMAIL,
        name: "Prathmesh",
        passwordHash: await hash("admin@123", 12),
      },
    });
    console.log(`  ✓ created default user ${DEFAULT_EMAIL}`);
  }

  // 2. Scoring configuration (never hard-coded in application code)
  await prisma.scoringConfig.upsert({
    where: { examId: exam.id },
    update: { ...DSSSB_SCORING },
    create: { examId: exam.id, ...DSSSB_SCORING },
  });

  // 3. Question source (provenance) for the bundled questions
  const aiSource = await prisma.questionSource.upsert({
    where: { id: "src-syllabus-original" },
    update: { name: "Original content written for MCQure (syllabus-based)" },
    create: {
      id: "src-syllabus-original",
      type: QuestionSourceType.AI_GENERATED,
      name: "Original content written for MCQure (syllabus-based)",
      verified: false,
    },
  });

  // 4. Subjects / topics / subtopics
  let questionTopicMap = new Map<
    string,
    { subjectId: string; topicId: string; subtopicId: string | null }
  >();

  for (const subject of SUBJECTS) {
    const dbSubject = await prisma.subject.upsert({
      where: {
        examId_name: { examId: exam.id, name: subject.name },
      },
      update: { order: subject.order },
      create: { examId: exam.id, name: subject.name, order: subject.order },
    });

    for (const topic of subject.topics) {
      const dbTopic = await prisma.topic.upsert({
        where: { subjectId_name: { subjectId: dbSubject.id, name: topic.name } },
        update: { order: topic.order },
        create: { subjectId: dbSubject.id, name: topic.name, order: topic.order },
      });

      for (const subtopic of topic.subtopics) {
        await prisma.subtopic.upsert({
          where: { topicId_name: { topicId: dbTopic.id, name: subtopic.name } },
          update: { order: subtopic.order },
          create: { topicId: dbTopic.id, name: subtopic.name, order: subtopic.order },
        });
      }

      questionTopicMap.set(topic.name, {
        subjectId: dbSubject.id,
        topicId: dbTopic.id,
        subtopicId: null,
      });
    }
  }

  // 5. Questions
  let created = 0;
  let updated = 0;
  for (const q of QUESTIONS) {
    const link = questionTopicMap.get(q.topic);
    if (!link) {
      console.warn(`[seed] skipping question with unknown topic "${q.topic}"`);
      continue;
    }
    let subtopicId: string | null = null;
    if (q.subtopic) {
      const dbSubtopic = await prisma.subtopic.findUnique({
        where: { topicId_name: { topicId: link.topicId, name: q.subtopic } },
      });
      subtopicId = dbSubtopic?.id ?? null;
    }

    const existing = await prisma.question.findFirst({
      where: { examId: exam.id, text: q.text },
    });

    const data = {
      examId: exam.id,
      subjectId: link.subjectId,
      topicId: link.topicId,
      subtopicId,
      sourceType: QuestionSourceType.AI_GENERATED,
      sourceId: aiSource.id,
      text: q.text,
      options: q.options.map((text, i) => ({
        label: String.fromCharCode(65 + i),
        text,
      })),
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      difficulty: q.difficulty,
      examRelevance: q.examRelevance,
      isActive: true,
    };

    if (existing) {
      await prisma.question.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      await prisma.question.create({ data });
      created += 1;
    }
  }

  const counts = await prisma.question.count({ where: { examId: exam.id } });
  const subjectCount = await prisma.subject.count({ where: { examId: exam.id } });

  // 6. Study notes (Phase 3) — keyed by subject -> topic -> notes
  let noteCreated = 0;
  let noteUpdated = 0;
  let noteWarned: string[] = [];
  for (const [subjectName, topics] of Object.entries(STUDY_NOTES)) {
    for (const [topicName, notes] of Object.entries(topics)) {
      const link = questionTopicMap.get(topicName);
      if (!link) {
        noteWarned.push(topicName);
        continue;
      }
      for (let i = 0; i < notes.length; i += 1) {
        const note = notes[i];
        const existing = await prisma.studyNote.findFirst({
          where: { topicId: link.topicId, kind: note.kind, title: note.title },
        });
        if (existing) {
          await prisma.studyNote.update({
            where: { id: existing.id },
            data: { body: note.body, order: i },
          });
          noteUpdated += 1;
        } else {
          await prisma.studyNote.create({
            data: {
              topicId: link.topicId,
              kind: note.kind,
              title: note.title,
              body: note.body,
              order: i,
            },
          });
          noteCreated += 1;
        }
      }
    }
  }
  if (noteWarned.length > 0) {
    console.warn(`[seed] study notes for unknown topics skipped: ${noteWarned.join(", ")}`);
  }

  const noteCount = await prisma.studyNote.count();

  // 7. Exam blueprint (Phase "Foundation"): paper, sections, distribution,
  //    topic weights — all configuration data, never hard-coded.
  const subjectByName = new Map(
    (await prisma.subject.findMany({ where: { examId: exam.id } })).map((s) => [s.name, s])
  );

  // 7a. Blueprint-only subjects (Section A + non-CS Section B categories).
  for (const subj of BLUEPRINT_ONLY_SUBJECTS) {
    await prisma.subject.upsert({
      where: { examId_name: { examId: exam.id, name: subj.name } },
      update: { order: subj.order },
      create: { examId: exam.id, name: subj.name, order: subj.order },
    });
    subjectByName.set(
      subj.name,
      (await prisma.subject.findUnique({
        where: { examId_name: { examId: exam.id, name: subj.name } },
      }))!
    );
  }

  // 7b. Paper + sections + subject distribution.
  const paper = await prisma.paper.upsert({
    where: { examId_name: { examId: exam.id, name: BLUEPRINT.paper.name } },
    update: { year: BLUEPRINT.paper.year, order: BLUEPRINT.paper.order, isActive: true },
    create: {
      examId: exam.id,
      name: BLUEPRINT.paper.name,
      year: BLUEPRINT.paper.year,
      order: BLUEPRINT.paper.order,
      isActive: true,
    },
  });

  for (const section of BLUEPRINT.sections) {
    // No composite unique on Section, so match by name under the paper.
    const existingSection = await prisma.section.findFirst({
      where: { paperId: paper.id, name: section.name },
    });
    const data = {
      paperId: paper.id,
      name: section.name,
      order: section.order,
      questionCount: section.questionCount,
      marksPerQuestion: section.marksPerQuestion,
      negativeMarks: section.negativeMarks,
      timeLimitMinutes: section.timeLimitMinutes,
      weight: section.weight,
    };
    const finalSection = existingSection
      ? await prisma.section.update({ where: { id: existingSection.id }, data })
      : await prisma.section.create({ data });

    for (const share of section.subjects) {
      const subject = subjectByName.get(share.name);
      if (!subject) {
        console.warn(`[seed] blueprint share for unknown subject "${share.name}"`);
        continue;
      }
      await prisma.sectionSubject.upsert({
        where: {
          sectionId_subjectId: { sectionId: finalSection.id, subjectId: subject.id },
        },
        update: { questionShare: share.share },
        create: {
          sectionId: finalSection.id,
          subjectId: subject.id,
          questionShare: share.share,
        },
      });
    }
  }

  // 7c. Per-topic blueprint weights (ESTIMATED unless proven official).
  let weightCreated = 0;
  let weightUpdated = 0;
  for (const [subjectName, meta] of Object.entries(SUBJECT_WEIGHTS)) {
    const subject = subjectByName.get(subjectName);
    if (!subject) {
      console.warn(`[seed] topic weights for unknown subject "${subjectName}"`);
      continue;
    }
    const topics = await prisma.topic.findMany({
      where: { subjectId: subject.id },
    });
    for (const topic of topics) {
      const override = meta.topics?.[topic.name];
      const existing = await prisma.blueprintTopicWeight.findUnique({
        where: { examId_topicId: { examId: exam.id, topicId: topic.id } },
      });
      const data = {
        examId: exam.id,
        topicId: topic.id,
        weight: override?.weight ?? meta.weight,
        estimatedQuestions: override?.estimatedQuestions ?? meta.estimatedQuestions ?? null,
        basis: override?.basis ?? meta.basis,
        basisNote: override?.basisNote ?? meta.basisNote,
      };
      if (existing) {
        await prisma.blueprintTopicWeight.update({ where: { id: existing.id }, data });
        weightUpdated += 1;
      } else {
        await prisma.blueprintTopicWeight.create({ data });
        weightCreated += 1;
      }
    }
  }

  const sectionCount = await prisma.section.count({ where: { paperId: paper.id } });

  console.log(`[seed] exam: ${exam.name}`);
  console.log(`[seed] subjects: ${subjectCount}`);
  console.log(`[seed] questions: ${counts} (created ${created}, updated ${updated})`);
  console.log(`[seed] study notes: ${noteCount} (created ${noteCreated}, updated ${noteUpdated})`);
  console.log(
    `[seed] blueprint: paper "${paper.name}", sections ${sectionCount}, topic weights ${weightCreated} created / ${weightUpdated} updated`
  );
  console.log(
    `[seed] all questions are AI_GENERATED original content (no PYQs fabricated)`
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
