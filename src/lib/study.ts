// Phase 3 Study module: browser + per-topic study material.
import type { StudyNote, StudyNoteKind, TopicSource } from "@prisma/client";
import { prisma } from "./db";
import { summarizeByGroup } from "./analytics";

// Rendering metadata per note kind (icons/labels used by the UI).
export const STUDY_KIND_META: Record<StudyNoteKind, { label: string; icon: string }> = {
  CONCEPT_NOTES: { label: "Concept notes", icon: "📝" },
  MNEMONICS: { label: "Memory hooks", icon: "🧠" },
  COMPARISON: { label: "Comparison", icon: "⚖️" },
  EXAM_TRAPS: { label: "Exam traps", icon: "⚠️" },
  QUICK_SUMMARY: { label: "One-page revision", icon: "⚡" },
};

// Presentation order: build understanding first, finish with the revision box.
export const STUDY_KIND_ORDER: StudyNoteKind[] = [
  "CONCEPT_NOTES",
  "MNEMONICS",
  "COMPARISON",
  "EXAM_TRAPS",
  "QUICK_SUMMARY",
];

export function bulletLines(body: string): string[] {
  return body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Parse a COMPARISON note body: first line is the header, rest are rows. */
export function parseComparisonTable(body: string): {
  header: string[];
  rows: string[][];
} {
  const lines = bulletLines(body);
  if (lines.length === 0) return { header: [], rows: [] };
  const [header, ...rows] = lines;
  return {
    header: header.split("||").map((c) => c.trim()),
    rows: rows.map((r) => r.split("||").map((c) => c.trim())),
  };
}

export function groupNotesByKind(
  notes: StudyNote[]
): Array<{ kind: StudyNoteKind; notes: StudyNote[] }> {
  return STUDY_KIND_ORDER.map((kind) => ({
    kind,
    notes: notes
      .filter((n) => n.kind === kind)
      .sort((a, b) => a.order - b.order),
  })).filter((g) => g.notes.length > 0);
}

export function isWeakTopic(accuracy: number | null, attempts: number): boolean {
  return attempts >= 3 && accuracy !== null && accuracy < 60;
}

export interface StudyTopicOverview {
  id: string;
  name: string;
  order: number;
  noteCount: number;
  sourceCount: number;
  attempts: number;
  accuracy: number | null;
  weak: boolean;
}

export interface StudySubjectOverview {
  id: string;
  name: string;
  order: number;
  topics: StudyTopicOverview[];
}

/**
 * Full study browser: subjects with topics, each enriched with the current
 * user's per-topic accuracy so weak topics can be flagged for priority review.
 */
export async function getStudyOverview(userId: string): Promise<StudySubjectOverview[]> {
  const subjects = await prisma.subject.findMany({
    orderBy: { order: "asc" },
    include: {
      topics: {
        orderBy: { order: "asc" },
        include: { _count: { select: { studyNotes: true, topicSources: true } } },
      },
    },
  });

  const attempts = await prisma.attempt.findMany({
    where: { userId },
    select: { isCorrect: true, score: true, responseTimeMs: true, confidence: true, question: { select: { topicId: true } } },
  });

  const perTopic = new Map(
    summarizeByGroup(
      attempts.map((a) => ({
        group: a.question.topicId,
        isCorrect: a.isCorrect,
        score: a.score,
        responseTimeMs: a.responseTimeMs,
        confidence: a.confidence,
      }))
    ).map((g) => [g.group, g])
  );

  return subjects.map((s) => ({
    id: s.id,
    name: s.name,
    order: s.order,
    topics: s.topics.map((t) => {
      const stats = perTopic.get(t.id);
      const attemptsCount = stats?.attempts ?? 0;
      const accuracy = stats?.accuracy ?? null;
      return {
        id: t.id,
        name: t.name,
        order: t.order,
        noteCount: t._count.studyNotes,
        sourceCount: t._count.topicSources,
        attempts: attemptsCount,
        accuracy,
        weak: isWeakTopic(accuracy, attemptsCount),
      };
    }),
  }));
}

export interface TopicStudy {
  topic: { id: string; name: string; order: number; subjectName: string };
  notes: StudyNote[];
  sources: TopicSource[];
  questionCount: number;
}

export async function getTopicStudy(topicId: string): Promise<TopicStudy | null> {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      subject: { select: { name: true } },
      studyNotes: { orderBy: { order: "asc" } },
      topicSources: { orderBy: { order: "asc" } },
    },
  });
  if (!topic) return null;
  const questionCount = await prisma.question.count({
    where: { topicId: topic.id, isActive: true },
  });
  return {
    topic: { id: topic.id, name: topic.name, order: topic.order, subjectName: topic.subject.name },
    notes: topic.studyNotes,
    sources: topic.topicSources,
    questionCount,
  };
}
