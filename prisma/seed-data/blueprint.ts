// DSSSB TGT Computer Science exam blueprint (configuration data, never
// hard-coded in the app). The paper/section/weight structure lets the same
// engine serve any exam.
//
// HONESTY: per-section shares and topic weights are marked ESTIMATED and carry
// a basis note. They are derived from user-provided previous-year (2021–2023)
// question counts, mapped onto MCQure's subject taxonomy — NOT an official
// blueprint. Any topic without reliable data must be marked UNKNOWN, never
// fabricated.

import type { WeightBasis, WeightClass } from "@prisma/client";

export interface SeedSubjectShare {
  name: string;
  share: number; // how many of the section's questions come from this subject
}

export interface SeedSection {
  name: string;
  order: number;
  questionCount: number;
  marksPerQuestion: number;
  negativeMarks: number;
  timeLimitMinutes: number | null; // null = inherit exam-level time
  weight: number; // relative emphasis
  subjects: SeedSubjectShare[];
}

export interface SeedTopicWeight {
  weight: WeightClass;
  estimatedQuestions?: number;
  basis: WeightBasis;
  basisNote?: string;
}

// Per-subject default weight for all its topics, plus per-topic overrides.
export interface SeedSubjectWeights {
  weight: WeightClass; // default for topics in this subject
  estimatedQuestions?: number;
  basis: WeightBasis;
  basisNote?: string;
  topics?: Record<string, SeedTopicWeight>;
}

export const BLUEPRINT = {
  paper: { name: "DSSSB TGT CS 2026", year: 2026, order: 1 },
  sections: [
    {
      name: "Section A",
      order: 1,
      questionCount: 100,
      marksPerQuestion: 1,
      negativeMarks: -0.25,
      timeLimitMinutes: null,
      weight: 1,
      subjects: [
        { name: "General Awareness", share: 20 },
        { name: "General Intelligence & Reasoning", share: 20 },
        { name: "Arithmetical & Numerical Ability", share: 20 },
        { name: "English Language & Comprehension", share: 20 },
        { name: "Hindi Language & Comprehension", share: 20 },
      ],
    },
    {
      name: "Section B",
      order: 2,
      questionCount: 100,
      marksPerQuestion: 1,
      negativeMarks: -0.25,
      timeLimitMinutes: null,
      weight: 1,
      subjects: [
        // Estimated from 2021–2023 previous-year counts, mapped onto MCQure's
        // subject taxonomy. Sums to 100 (Computer Science section).
        { name: "Computer Networks", share: 12 },
        { name: "Computer Fundamentals & Architecture", share: 13 },
        { name: "Operating Systems", share: 8 },
        { name: "Data Structures & Algorithms", share: 9 },
        { name: "Database Management Systems", share: 7 },
        { name: "Programming in C & C++", share: 10 },
        { name: "Software Engineering", share: 7 },
        { name: "Internet & Web Technologies", share: 8 },
        { name: "Teaching Methodology & Pedagogy", share: 10 },
        { name: "Mathematics & Statistics", share: 6 },
        { name: "Computer Graphics & Multimedia", share: 4 },
        { name: "Business, Economics & E-Commerce", share: 4 },
        { name: "MIS & Decision Support", share: 2 },
      ],
    },
  ] as SeedSection[],
};

export const SUBJECT_WEIGHTS: Record<string, SeedSubjectWeights> = {
  "Computer Networks": {
    weight: "HIGH",
    estimatedQuestions: 12,
    basis: "ESTIMATED",
    basisNote: "2021–2023 average of ~10.5 questions/paper (rank #1 in weightage).",
  },
  "Computer Fundamentals & Architecture": {
    weight: "HIGH",
    estimatedQuestions: 13,
    basis: "ESTIMATED",
    basisNote:
      "Combines Digital Electronics/Boolean Logic (~10 avg) with Computer Fundamentals & Architecture (~8 avg); overlap accounted for.",
    topics: {
      "Computer Basics": { weight: "MEDIUM", basis: "ESTIMATED" },
      "Number Systems & Codes": { weight: "HIGH", basis: "ESTIMATED" },
      "Boolean Algebra & Logic Gates": { weight: "HIGH", basis: "ESTIMATED" },
      "Computer Organization": { weight: "MEDIUM", basis: "ESTIMATED" },
      "Memory & Storage": { weight: "MEDIUM", basis: "ESTIMATED" },
    },
  },
  "Operating Systems": {
    weight: "HIGH",
    estimatedQuestions: 8,
    basis: "ESTIMATED",
    basisNote: "2021–2023 average of ~6.2 questions/paper; OS & Linux listed as high priority.",
  },
  "Data Structures & Algorithms": {
    weight: "HIGH",
    estimatedQuestions: 9,
    basis: "ESTIMATED",
    basisNote: "Part of Programming/DS/OOP category (~8.5 avg).",
  },
  "Database Management Systems": {
    weight: "HIGH",
    estimatedQuestions: 7,
    basis: "ESTIMATED",
    basisNote: "2021–2023 average of ~5.8 questions/paper; high priority per analysis.",
  },
  "Programming in C & C++": {
    weight: "HIGH",
    estimatedQuestions: 10,
    basis: "ESTIMATED",
    basisNote: "Part of Programming/DS/OOP category (~8.5 avg).",
  },
  "Software Engineering": {
    weight: "MEDIUM",
    estimatedQuestions: 7,
    basis: "ESTIMATED",
    basisNote: "2021–2023 average of ~5.4 questions/paper.",
  },
  "Internet & Web Technologies": {
    weight: "MEDIUM",
    estimatedQuestions: 8,
    basis: "ESTIMATED",
    basisNote: "Covers Web/Front-end/Internet/.NET category (~5.8 avg).",
  },
  "Teaching Methodology & Pedagogy": {
    weight: "HIGH",
    estimatedQuestions: 10,
    basis: "ESTIMATED",
    basisNote: "2021–2023 average of ~9.8 questions/paper.",
  },
  "Mathematics & Statistics": {
    weight: "MEDIUM",
    estimatedQuestions: 6,
    basis: "ESTIMATED",
    basisNote: "2021–2023 average of ~5.8 questions/paper.",
  },
  "Computer Graphics & Multimedia": {
    weight: "LOW",
    estimatedQuestions: 4,
    basis: "ESTIMATED",
    basisNote: "2021–2023 average of ~6.8 questions/paper (varies widely by year).",
  },
  "Business, Economics & E-Commerce": {
    weight: "LOW",
    estimatedQuestions: 4,
    basis: "ESTIMATED",
    basisNote: "Business/Accounting/Economics/E-Commerce group (~9 avg across group).",
  },
  "MIS & Decision Support": {
    weight: "LOW",
    estimatedQuestions: 2,
    basis: "ESTIMATED",
    basisNote: "2021–2023 average of ~1.8 questions/paper.",
  },
};

// Subjects in the blueprint that are not part of the core CS seed; created so
// the blueprint/distribution is complete. They start with no questions — the
// app reports 0 coverage honestly.
export const BLUEPRINT_ONLY_SUBJECTS: { name: string; order: number }[] = [
  { name: "General Awareness", order: 10 },
  { name: "General Intelligence & Reasoning", order: 11 },
  { name: "Arithmetical & Numerical Ability", order: 12 },
  { name: "English Language & Comprehension", order: 13 },
  { name: "Hindi Language & Comprehension", order: 14 },
  { name: "Teaching Methodology & Pedagogy", order: 15 },
  { name: "Mathematics & Statistics", order: 16 },
  { name: "Computer Graphics & Multimedia", order: 17 },
  { name: "Business, Economics & E-Commerce", order: 18 },
  { name: "MIS & Decision Support", order: 19 },
];
