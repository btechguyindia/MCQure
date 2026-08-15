// DSSSB TGT Computer Science exam blueprint (configuration data, never
// hard-coded in the app). The paper/section/weight structure lets the same
// engine serve any exam.
//
// HONESTY: per-section shares and topic weights are marked ESTIMATED and carry
// a basis note. They are derived from user-provided previous-year (2021–2023)
// question counts, mapped onto the official subject list in syllabus.ts — NOT
// an official blueprint. Where the official syllabus splits one older
// aggregate into several subjects, the aggregate count is distributed across
// those subjects and the note says so. Any subject with no reliable data has
// no share and no weights (the app reports that honestly as "no data").

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
        // Estimated from 2021–2023 previous-year counts, mapped onto the
        // official subject list (syllabus.ts). Sums to 100. Where one old
        // aggregate splits into several official subjects the total for the
        // group is preserved and the split is noted in the basis note.
        { name: "Computer Networks, TCP/IP & Network Security", share: 8 },
        { name: "TCP/Protocols", share: 1 },
        { name: "Computer Network Security", share: 3 },
        { name: "Computer Basics and P.C. Software", share: 4 },
        { name: "Digital Electronics / Boolean Logic", share: 5 },
        { name: "Computer Architecture", share: 4 },
        { name: "Operating Systems & Linux", share: 6 },
        { name: "Linux Environment", share: 2 },
        { name: "Programming with C, Data Structures using C, C++ Programming", share: 12 },
        { name: "Design and Analysis of Algorithms", share: 3 },
        { name: "Problem Solving & Programming", share: 2 },
        { name: "Database Management Systems", share: 7 },
        { name: "Object/Computer Oriented Programming / Numerical Techniques", share: 2 },
        { name: "Software Engineering", share: 7 },
        { name: "Java Programming and Website Design", share: 3 },
        { name: "Front End Designed Tools", share: 1 },
        { name: ".NET Programming", share: 1 },
        { name: "Internet Programming — Web Server, CSS, Event Model, Data Binding, XML", share: 2 },
        { name: "Mobile Computing", share: 1 },
        { name: "Teaching Methodology / Pedagogy", share: 10 },
        { name: "Mathematics", share: 3 },
        { name: "Statistical Techniques", share: 2 },
        { name: "Interpolation", share: 1 },
        { name: "Computer Graphics & Multimedia", share: 4 },
        { name: "Business Economics", share: 1 },
        { name: "Business Communication, Business Organization & Management, Writing", share: 1 },
        { name: "Financial Accounting", share: 1 },
        { name: "E-Commerce", share: 1 },
        { name: "MIS / DSS / Expert Systems", share: 1 },
        { name: "Knowledge Management & New Economy", share: 1 },
      ],
    },
  ] as SeedSection[],
};

export const SUBJECT_WEIGHTS: Record<string, SeedSubjectWeights> = {
  "Computer Networks, TCP/IP & Network Security": {
    weight: "HIGH",
    estimatedQuestions: 8,
    basis: "ESTIMATED",
    basisNote:
      "2021–2023 'Computer Networks' average of ~10.5 questions/paper, distributed across the official network subjects (TCP/Protocols 1, Network Security 3).",
  },
  "TCP/Protocols": {
    weight: "LOW",
    estimatedQuestions: 1,
    basis: "ESTIMATED",
    basisNote: "Split of the 2021–2023 Computer Networks average (~10.5).",
  },
  "Computer Network Security": {
    weight: "MEDIUM",
    estimatedQuestions: 3,
    basis: "ESTIMATED",
    basisNote: "Split of the 2021–2023 Computer Networks average (~10.5).",
  },
  "Computer Basics and P.C. Software": {
    weight: "MEDIUM",
    estimatedQuestions: 4,
    basis: "ESTIMATED",
    basisNote:
      "Split of Computer Fundamentals & Architecture (~8 avg) onto the official subject list.",
    topics: {
      "Computer Basics": { weight: "MEDIUM", basis: "ESTIMATED" },
    },
  },
  "Digital Electronics / Boolean Logic": {
    weight: "HIGH",
    estimatedQuestions: 5,
    basis: "ESTIMATED",
    basisNote: "Digital Electronics/Boolean Logic ~10 avg, overlap accounted for.",
    topics: {
      "Number Systems & Codes": { weight: "HIGH", basis: "ESTIMATED" },
      "Boolean Algebra & Logic Gates": { weight: "HIGH", basis: "ESTIMATED" },
    },
  },
  "Computer Architecture": {
    weight: "MEDIUM",
    estimatedQuestions: 4,
    basis: "ESTIMATED",
    basisNote:
      "Computer Fundamentals & Architecture ~8 avg, split onto the official subject list.",
    topics: {
      "Computer Organization": { weight: "MEDIUM", basis: "ESTIMATED" },
      "Memory & Storage": { weight: "MEDIUM", basis: "ESTIMATED" },
    },
  },
  "Operating Systems & Linux": {
    weight: "HIGH",
    estimatedQuestions: 6,
    basis: "ESTIMATED",
    basisNote: "2021–2023 average of ~6.2 questions/paper; OS & Linux high priority.",
  },
  "Linux Environment": {
    weight: "LOW",
    estimatedQuestions: 2,
    basis: "ESTIMATED",
    basisNote: "Split of the OS & Linux estimate onto the official subject list.",
  },
  "Programming with C, Data Structures using C, C++ Programming": {
    weight: "HIGH",
    estimatedQuestions: 12,
    basis: "ESTIMATED",
    basisNote:
      "Programming/DS/OOP category ~8.5 avg plus C & C++ programming coverage, combined into one official subject.",
  },
  "Design and Analysis of Algorithms": {
    weight: "MEDIUM",
    estimatedQuestions: 3,
    basis: "ESTIMATED",
    basisNote: "Split of the Programming/DS/OOP category estimate.",
  },
  "Problem Solving & Programming": {
    weight: "LOW",
    estimatedQuestions: 2,
    basis: "ESTIMATED",
    basisNote: "Split of the Programming/DS/OOP category estimate.",
  },
  "Database Management Systems": {
    weight: "HIGH",
    estimatedQuestions: 7,
    basis: "ESTIMATED",
    basisNote: "2021–2023 average of ~5.8 questions/paper; high priority per analysis.",
  },
  "Object/Computer Oriented Programming / Numerical Techniques": {
    weight: "LOW",
    estimatedQuestions: 2,
    basis: "ESTIMATED",
    basisNote: "Split of the Programming/DS/OOP category estimate.",
  },
  "Software Engineering": {
    weight: "MEDIUM",
    estimatedQuestions: 7,
    basis: "ESTIMATED",
    basisNote: "2021–2023 average of ~5.4 questions/paper.",
  },
  "Java Programming and Website Design": {
    weight: "MEDIUM",
    estimatedQuestions: 3,
    basis: "ESTIMATED",
    basisNote: "Web/Front-end/Internet/.NET category ~5.8 avg, distributed.",
  },
  "Front End Designed Tools": {
    weight: "LOW",
    estimatedQuestions: 1,
    basis: "ESTIMATED",
    basisNote: "Web/Front-end/Internet/.NET category ~5.8 avg, distributed.",
  },
  ".NET Programming": {
    weight: "LOW",
    estimatedQuestions: 1,
    basis: "ESTIMATED",
    basisNote: "Web/Front-end/Internet/.NET category ~5.8 avg, distributed.",
  },
  "Internet Programming — Web Server, CSS, Event Model, Data Binding, XML": {
    weight: "LOW",
    estimatedQuestions: 2,
    basis: "ESTIMATED",
    basisNote: "Web/Front-end/Internet/.NET category ~5.8 avg, distributed.",
  },
  "Mobile Computing": {
    weight: "LOW",
    estimatedQuestions: 1,
    basis: "ESTIMATED",
    basisNote: "Web/Front-end/Internet/.NET category ~5.8 avg, distributed.",
  },
  "Teaching Methodology / Pedagogy": {
    weight: "HIGH",
    estimatedQuestions: 10,
    basis: "ESTIMATED",
    basisNote: "2021–2023 average of ~9.8 questions/paper.",
  },
  Mathematics: {
    weight: "MEDIUM",
    estimatedQuestions: 3,
    basis: "ESTIMATED",
    basisNote: "Mathematics & Statistics ~5.8 avg, split onto official subjects.",
  },
  "Statistical Techniques": {
    weight: "LOW",
    estimatedQuestions: 2,
    basis: "ESTIMATED",
    basisNote: "Mathematics & Statistics ~5.8 avg, split onto official subjects.",
  },
  Interpolation: {
    weight: "LOW",
    estimatedQuestions: 1,
    basis: "ESTIMATED",
    basisNote: "Mathematics & Statistics ~5.8 avg, split onto official subjects.",
  },
  "Computer Graphics & Multimedia": {
    weight: "LOW",
    estimatedQuestions: 4,
    basis: "ESTIMATED",
    basisNote: "2021–2023 average of ~6.8 questions/paper (varies widely by year).",
  },
  "Business Economics": {
    weight: "LOW",
    estimatedQuestions: 1,
    basis: "ESTIMATED",
    basisNote: "Business/Accounting/Economics/E-Commerce group ~9 avg, distributed.",
  },
  "Business Communication, Business Organization & Management, Writing": {
    weight: "LOW",
    estimatedQuestions: 1,
    basis: "ESTIMATED",
    basisNote: "Business/Accounting/Economics/E-Commerce group ~9 avg, distributed.",
  },
  "Financial Accounting": {
    weight: "LOW",
    estimatedQuestions: 1,
    basis: "ESTIMATED",
    basisNote: "Business/Accounting/Economics/E-Commerce group ~9 avg, distributed.",
  },
  "E-Commerce": {
    weight: "LOW",
    estimatedQuestions: 1,
    basis: "ESTIMATED",
    basisNote: "Business/Accounting/Economics/E-Commerce group ~9 avg, distributed.",
  },
  "MIS / DSS / Expert Systems": {
    weight: "LOW",
    estimatedQuestions: 1,
    basis: "ESTIMATED",
    basisNote: "2021–2023 average of ~1.8 questions/paper.",
  },
  "Knowledge Management & New Economy": {
    weight: "LOW",
    estimatedQuestions: 1,
    basis: "ESTIMATED",
    basisNote: "Grouped with MIS/Knowledge systems estimates.",
  },
  "General Awareness": {
    weight: "HIGH",
    estimatedQuestions: 20,
    basis: "ESTIMATED",
    basisNote: "Section A fixed share: 20 questions per the paper pattern.",
  },
  "General Intelligence & Reasoning": {
    weight: "HIGH",
    estimatedQuestions: 20,
    basis: "ESTIMATED",
    basisNote: "Section A fixed share: 20 questions per the paper pattern.",
  },
  "Arithmetical & Numerical Ability": {
    weight: "HIGH",
    estimatedQuestions: 20,
    basis: "ESTIMATED",
    basisNote: "Section A fixed share: 20 questions per the paper pattern.",
  },
  "English Language & Comprehension": {
    weight: "HIGH",
    estimatedQuestions: 20,
    basis: "ESTIMATED",
    basisNote: "Section A fixed share: 20 questions per the paper pattern.",
  },
  "Hindi Language & Comprehension": {
    weight: "HIGH",
    estimatedQuestions: 20,
    basis: "ESTIMATED",
    basisNote: "Section A fixed share: 20 questions per the paper pattern.",
  },
  "Fundamentals of Information Technology": {
    weight: "LOW",
    estimatedQuestions: 2,
    basis: "ESTIMATED",
    basisNote: "Split of the Computer Fundamentals & Architecture estimate onto the official subject list.",
  },
  "Basis of Physics": {
    weight: "LOW",
    estimatedQuestions: 2,
    basis: "ESTIMATED",
    basisNote: "Split of the Computer Fundamentals & Architecture estimate onto the official subject list.",
  },
  "Foundation Course in English": {
    weight: "LOW",
    estimatedQuestions: 2,
    basis: "ESTIMATED",
    basisNote: "Grouped with the English/Communication category estimates.",
  },
};
