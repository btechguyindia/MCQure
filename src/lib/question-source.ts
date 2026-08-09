// Category/provenance metadata for every question in the bank. The badge
// labels render verbatim in the UI — an AI-generated question is never shown
// as a real PYQ, and genuine sources are clearly distinguished.

import type { QuestionQualityStatus, QuestionSourceType } from "@prisma/client";

export interface SourceMeta {
  label: string;
  shortLabel: string;
  description: string;
  badge: "pyq" | "variant" | "ai" | "web" | "official" | "licensed" | "user";
  genuine: boolean; // real exam/source-derived content (not AI-written)
}

export const QUESTION_SOURCE_META: Record<QuestionSourceType, SourceMeta> = {
  PYQ: {
    label: "VERIFIED PYQ",
    shortLabel: "PYQ",
    description: "Genuine previous-year question with verifiable provenance",
    badge: "pyq",
    genuine: true,
  },
  OFFICIAL: {
    label: "OFFICIAL",
    shortLabel: "Official",
    description: "From an official exam or government source",
    badge: "official",
    genuine: true,
  },
  LICENSED: {
    label: "LICENSED",
    shortLabel: "Licensed",
    description: "Legally licensed question content",
    badge: "licensed",
    genuine: true,
  },
  PYQ_VARIANT: {
    label: "PYQ VARIANT",
    shortLabel: "Variant",
    description: "New original question derived from a PYQ concept or pattern",
    badge: "variant",
    genuine: false,
  },
  AI_GENERATED: {
    label: "AI GENERATED",
    shortLabel: "AI",
    description: "Original question generated from the syllabus and concepts",
    badge: "ai",
    genuine: false,
  },
  WEB_DERIVED_ORIGINAL: {
    label: "WEB-DERIVED ORIGINAL",
    shortLabel: "Web orig.",
    description: "Original question created from concepts found via web research",
    badge: "web",
    genuine: false,
  },
  WEB_SOURCED: {
    label: "WEB-SOURCED",
    shortLabel: "Web",
    description: "Question traced to a web source (verification tracked separately)",
    badge: "web",
    genuine: false,
  },
  USER_CREATED: {
    label: "USER CREATED",
    shortLabel: "User",
    description: "Added by a user or admin",
    badge: "user",
    genuine: false,
  },
};

/** Canonical ordering of source types for explorer filters and sort. */
export const SOURCE_TYPE_ORDER: QuestionSourceType[] = [
  "PYQ",
  "OFFICIAL",
  "LICENSED",
  "PYQ_VARIANT",
  "AI_GENERATED",
  "WEB_DERIVED_ORIGINAL",
  "WEB_SOURCED",
  "USER_CREATED",
];

export function sourceLabel(type: QuestionSourceType): string {
  return QUESTION_SOURCE_META[type].label;
}

/** True when the source represents genuine exam-derived content. */
export function isGenuineSource(type: QuestionSourceType): boolean {
  return QUESTION_SOURCE_META[type].genuine;
}

export const QUALITY_STATUS_META: Record<
  QuestionQualityStatus,
  { label: string; badge: "ok" | "warn" | "bad" | "idle" }
> = {
  PENDING: { label: "Pending review", badge: "idle" },
  APPROVED: { label: "Approved", badge: "ok" },
  QUARANTINED: { label: "Quarantined", badge: "warn" },
  REJECTED: { label: "Rejected", badge: "bad" },
};
