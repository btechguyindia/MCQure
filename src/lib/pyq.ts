// Phase 4 PYQ bank: browse, submit and verify genuine previous-year questions.
// Integrity rule: only authentic questions with disclosed provenance are stored
// here — AI-generated content is never filed as a PYQ. Every entry carries a
// verification status (UNVERIFIED → PENDING → VERIFIED / CONFLICT).

import type { Pyq, VerificationStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";

export const VERIFICATION_STATUS_META: Record<
  VerificationStatus,
  { label: string; className: string }
> = {
  VERIFIED: {
    label: "Verified",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  },
  PENDING: {
    label: "Pending review",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  },
  UNVERIFIED: {
    label: "Unverified",
    className:
      "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
  CONFLICT: {
    label: "Conflict",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  },
};

/** Normalize free-text options into the stored { label, text } shape. */
export function normalizePyqOptions(options: string[]): { label: string; text: string }[] {
  return options.map((text, i) => ({
    label: String.fromCharCode(65 + i),
    text,
  }));
}

export interface PyqListItem {
  id: string;
  year: number;
  paper: string | null;
  questionText: string;
  options: { label: string; text: string }[];
  correctIndex: number;
  explanation: string;
  source: string | null;
  sourceUrl: string | null;
  verificationStatus: VerificationStatus;
}

/** All PYQs for an exam, newest year first, optionally filtered by year. */
export async function listPyqs(examId: string, year?: number): Promise<PyqListItem[]> {
  const rows = await prisma.pyq.findMany({
    where: { examId, ...(year ? { year } : {}) },
    orderBy: [{ year: "desc" }, { id: "asc" }],
  });
  return rows.map((p) => ({
    ...p,
    options: (p.options as unknown as { label: string; text: string }[]) ?? [],
  }));
}

/** Distinct years present in the bank (newest first) for the filter UI. */
export async function listPyqYears(examId: string): Promise<number[]> {
  const rows = await prisma.pyq.findMany({
    where: { examId },
    select: { year: true },
    distinct: ["year"],
    orderBy: { year: "desc" },
  });
  return rows.map((r) => r.year);
}

/** Create a PYQ entry. Always starts UNVERIFIED until checked against the paper. */
export async function createPyq(
  examId: string,
  examName: string,
  data: {
    year: number;
    paper?: string;
    questionText: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
    source: string;
    sourceUrl?: string;
  }
): Promise<Pyq> {
  return prisma.pyq.create({
    data: {
      examId,
      examName,
      year: data.year,
      paper: data.paper ?? null,
      questionText: data.questionText,
      options: normalizePyqOptions(data.options) as unknown as Prisma.JsonObject,
      correctIndex: data.correctIndex,
      explanation: data.explanation ?? "",
      source: data.source,
      sourceUrl: data.sourceUrl ?? null,
      verificationStatus: "UNVERIFIED",
    },
  });
}
