// DSSSB TGT (Computer Science) syllabus structure.
// Reflected from the commonly published official DSSSB TGT Computer Science
// syllabus. Topics/subtopics are configuration data — they can be edited
// without touching the application code.

export interface SeedSubtopic {
  name: string;
  order: number;
}

export interface SeedTopic {
  name: string;
  order: number;
  subtopics: SeedSubtopic[];
}

export interface SeedSubject {
  name: string;
  order: number;
  topics: SeedTopic[];
}

export const DSSSB_EXAM = {
  slug: "dsssb-tgt-cs",
  name: "DSSSB TGT Computer Science",
  description:
    "Delhi Subordinate Services Selection Board — Trained Graduate Teacher (Computer Science). Paper II covers computer science subject matter. Scoring: +1 correct, -0.25 incorrect.",
};

export const DSSSB_SCORING = {
  totalMarks: 200,
  correctMarks: 1,
  incorrectPenalty: -0.25,
  unattemptedMarks: 0,
  timeLimitMinutes: 120,
};

export const SUBJECTS: SeedSubject[] = [
  {
    name: "Computer Fundamentals & Architecture",
    order: 1,
    topics: [
      {
        name: "Computer Basics",
        order: 1,
        subtopics: [
          { name: "Generations of Computers", order: 1 },
          { name: "Classification of Computers", order: 2 },
        ],
      },
      {
        name: "Number Systems & Codes",
        order: 2,
        subtopics: [
          { name: "Conversions", order: 1 },
          { name: "Codes (ASCII, BCD)", order: 2 },
        ],
      },
      {
        name: "Boolean Algebra & Logic Gates",
        order: 3,
        subtopics: [{ name: "Basic Gates", order: 1 }],
      },
      {
        name: "Computer Organization",
        order: 4,
        subtopics: [
          { name: "CPU & Registers", order: 1 },
          { name: "ALU & Control Unit", order: 2 },
          { name: "Buses", order: 3 },
        ],
      },
      {
        name: "Memory & Storage",
        order: 5,
        subtopics: [
          { name: "Memory Hierarchy", order: 1 },
          { name: "Primary vs Secondary Memory", order: 2 },
        ],
      },
    ],
  },
  {
    name: "Operating Systems",
    order: 2,
    topics: [
      {
        name: "OS Fundamentals",
        order: 1,
        subtopics: [{ name: "Functions of an OS", order: 1 }],
      },
      {
        name: "Process Management",
        order: 2,
        subtopics: [{ name: "Process States", order: 1 }],
      },
      {
        name: "CPU Scheduling",
        order: 3,
        subtopics: [
          { name: "FCFS", order: 1 },
          { name: "SJF", order: 2 },
          { name: "Round Robin", order: 3 },
          { name: "Priority Scheduling", order: 4 },
        ],
      },
      {
        name: "Process Synchronization",
        order: 4,
        subtopics: [{ name: "Semaphores", order: 1 }],
      },
      {
        name: "Deadlocks",
        order: 5,
        subtopics: [{ name: "Conditions & Banker's Algorithm", order: 1 }],
      },
      {
        name: "Memory Management",
        order: 6,
        subtopics: [
          { name: "Paging", order: 1 },
          { name: "Page Replacement", order: 2 },
        ],
      },
      {
        name: "File Systems",
        order: 7,
        subtopics: [{ name: "File Allocation", order: 1 }],
      },
    ],
  },
  {
    name: "Data Structures & Algorithms",
    order: 3,
    topics: [
      {
        name: "Arrays & Strings",
        order: 1,
        subtopics: [{ name: "Array Operations", order: 1 }],
      },
      {
        name: "Linked Lists",
        order: 2,
        subtopics: [{ name: "Singly Linked List", order: 1 }],
      },
      {
        name: "Stacks & Queues",
        order: 3,
        subtopics: [
          { name: "Stack Operations", order: 1 },
          { name: "Queue Types", order: 2 },
        ],
      },
      {
        name: "Trees",
        order: 4,
        subtopics: [
          { name: "Binary Trees", order: 1 },
          { name: "BST", order: 2 },
          { name: "Traversals", order: 3 },
        ],
      },
      {
        name: "Graphs",
        order: 5,
        subtopics: [{ name: "Graph Representations", order: 1 }],
      },
      {
        name: "Sorting Algorithms",
        order: 6,
        subtopics: [{ name: "Comparison Sorts", order: 1 }],
      },
      {
        name: "Searching Algorithms",
        order: 7,
        subtopics: [{ name: "Linear & Binary Search", order: 1 }],
      },
      {
        name: "Hashing",
        order: 8,
        subtopics: [{ name: "Collision Resolution", order: 1 }],
      },
    ],
  },
  {
    name: "Database Management Systems",
    order: 4,
    topics: [
      {
        name: "DBMS Basics",
        order: 1,
        subtopics: [{ name: "Architecture & Data Models", order: 1 }],
      },
      {
        name: "Relational Model & Keys",
        order: 2,
        subtopics: [{ name: "Keys & Constraints", order: 1 }],
      },
      {
        name: "SQL",
        order: 3,
        subtopics: [
          { name: "DDL & DML", order: 1 },
          { name: "Queries & Joins", order: 2 },
        ],
      },
      {
        name: "Normalization",
        order: 4,
        subtopics: [
          { name: "1NF to BCNF", order: 1 },
          { name: "Functional Dependencies", order: 2 },
        ],
      },
      {
        name: "Transactions & Concurrency",
        order: 5,
        subtopics: [{ name: "ACID Properties", order: 1 }],
      },
    ],
  },
  {
    name: "Programming in C & C++",
    order: 5,
    topics: [
      {
        name: "C Fundamentals",
        order: 1,
        subtopics: [{ name: "Data Types & Operators", order: 1 }],
      },
      {
        name: "Control Structures",
        order: 2,
        subtopics: [{ name: "Loops & Conditionals", order: 1 }],
      },
      {
        name: "Functions & Recursion",
        order: 3,
        subtopics: [{ name: "Function Calls", order: 1 }],
      },
      {
        name: "Arrays & Pointers",
        order: 4,
        subtopics: [
          { name: "Pointers", order: 1 },
          { name: "Dynamic Memory", order: 2 },
        ],
      },
      {
        name: "Structures & Unions",
        order: 5,
        subtopics: [{ name: "Struct Members", order: 1 }],
      },
      {
        name: "OOP Concepts (C++)",
        order: 6,
        subtopics: [
          { name: "Classes & Objects", order: 1 },
          { name: "Inheritance & Polymorphism", order: 2 },
        ],
      },
    ],
  },
  {
    name: "Computer Networks",
    order: 6,
    topics: [
      {
        name: "Network Fundamentals",
        order: 1,
        subtopics: [{ name: "Topologies & Devices", order: 1 }],
      },
      {
        name: "OSI & TCP/IP Models",
        order: 2,
        subtopics: [{ name: "Layers", order: 1 }],
      },
      {
        name: "Network Layer",
        order: 3,
        subtopics: [
          { name: "IP Addressing", order: 1 },
          { name: "Routing", order: 2 },
        ],
      },
      {
        name: "Transport Layer",
        order: 4,
        subtopics: [{ name: "TCP & UDP", order: 1 }],
      },
      {
        name: "Application Layer Protocols",
        order: 5,
        subtopics: [
          { name: "HTTP, DNS", order: 1 },
          { name: "Ports", order: 2 },
        ],
      },
    ],
  },
  {
    name: "Software Engineering",
    order: 7,
    topics: [
      {
        name: "SDLC & Models",
        order: 1,
        subtopics: [
          { name: "Waterfall Model", order: 1 },
          { name: "Agile", order: 2 },
        ],
      },
      {
        name: "Software Testing",
        order: 2,
        subtopics: [
          { name: "Testing Levels", order: 1 },
          { name: "Black-box & White-box", order: 2 },
        ],
      },
      {
        name: "Software Design",
        order: 3,
        subtopics: [{ name: "Coupling & Cohesion", order: 1 }],
      },
    ],
  },
  {
    name: "Internet & Web Technologies",
    order: 8,
    topics: [
      {
        name: "HTML & CSS",
        order: 1,
        subtopics: [{ name: "HTML Elements", order: 1 }],
      },
      {
        name: "JavaScript",
        order: 2,
        subtopics: [{ name: "Client-side Scripting", order: 1 }],
      },
      {
        name: "Web Protocols",
        order: 3,
        subtopics: [{ name: "HTTP & HTTPS", order: 1 }],
      },
    ],
  },
];
