// DSSSB TGT (Computer Science) complete official syllabus structure.
// Covers BOTH sections:
//   Section A — General Awareness, Reasoning, Arithmetic, English, Hindi (100 Q)
//   Section B — Computer Science + Teaching Methodology (100 Q)
// Topics/subtopics are configuration data — they can be edited without
// touching application code. Topic names below marked (existing) are shared
// with the question bank / study notes / topic sources seeds.
//
// HONESTY: this is the syllabus as published by DSSSB. Estimated per-topic
// question counts live in blueprint.ts (marked ESTIMATED), never here.

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
    "Delhi Subordinate Services Selection Board — Trained Graduate Teacher (Computer Science). Paper: 200 marks / 200 questions, 2 hours. Section A (100 Q): General Awareness, Reasoning, Arithmetic, English, Hindi. Section B (100 Q): Computer Science + Teaching Methodology. Scoring: +1 correct, -0.25 incorrect.",
};

export const DSSSB_SCORING = {
  totalMarks: 200,
  correctMarks: 1,
  incorrectPenalty: -0.25,
  unattemptedMarks: 0,
  timeLimitMinutes: 120,
};

export const SUBJECTS: SeedSubject[] = [
  // ── SECTION A (General, 100 marks / 100 questions) ──────────────────────
  {
    name: "General Awareness",
    order: 1,
    topics: [
      { name: "Current Events", order: 1, subtopics: [] },
      { name: "History", order: 2, subtopics: [] },
      { name: "Polity & Constitution", order: 3, subtopics: [] },
      { name: "Sports", order: 4, subtopics: [] },
      { name: "Art & Culture", order: 5, subtopics: [] },
      { name: "Geography", order: 6, subtopics: [] },
      { name: "Economics", order: 7, subtopics: [] },
      { name: "Science & Scientific Research", order: 8, subtopics: [] },
      { name: "National & International Organizations", order: 9, subtopics: [] },
      { name: "Environment & Its Application to Society", order: 10, subtopics: [] },
    ],
  },
  {
    name: "General Intelligence & Reasoning",
    order: 2,
    topics: [
      { name: "Analogy", order: 1, subtopics: [] },
      { name: "Classification", order: 2, subtopics: [] },
      { name: "Series (Alphabet, Number, Letter)", order: 3, subtopics: [] },
      { name: "Coding-Decoding", order: 4, subtopics: [] },
      { name: "Blood Relations", order: 5, subtopics: [] },
      { name: "Direction Sense Test", order: 6, subtopics: [] },
      { name: "Logical Venn Diagrams", order: 7, subtopics: [] },
      { name: "Alphabet Test", order: 8, subtopics: [] },
      { name: "Sitting Arrangements", order: 9, subtopics: [{ name: "Linear Arrangement", order: 1 }, { name: "Circular Arrangement", order: 2 }] },
      { name: "Mathematical Operations", order: 10, subtopics: [] },
      { name: "Arithmetical Reasoning", order: 11, subtopics: [] },
      { name: "Inserting the Missing Character", order: 12, subtopics: [] },
      { name: "Ranking & Time Sequence", order: 13, subtopics: [] },
      { name: "Eligibility Test", order: 14, subtopics: [] },
      { name: "Syllogism", order: 15, subtopics: [] },
      { name: "Statement & Arguments", order: 16, subtopics: [] },
      { name: "Statement & Assumptions", order: 17, subtopics: [] },
      { name: "Statement & Courses of Action", order: 18, subtopics: [] },
      { name: "Statement & Conclusions", order: 19, subtopics: [] },
      { name: "Deriving Conclusions", order: 20, subtopics: [] },
      { name: "Assertion & Reason", order: 21, subtopics: [] },
      { name: "Punch Lines", order: 22, subtopics: [] },
      { name: "Situation Reaction Test", order: 23, subtopics: [] },
      { name: "Cause & Effect", order: 24, subtopics: [] },
      { name: "Analytical Reasoning", order: 25, subtopics: [] },
      { name: "Mirror Images", order: 26, subtopics: [] },
      { name: "Embedded Figures", order: 27, subtopics: [] },
      { name: "Paper Folding & Cutting", order: 28, subtopics: [] },
      { name: "Cubes & Dice", order: 29, subtopics: [] },
      { name: "Figure Series", order: 30, subtopics: [] },
    ],
  },
  {
    name: "Arithmetical & Numerical Ability",
    order: 3,
    topics: [
      { name: "Number Systems", order: 1, subtopics: [] },
      { name: "Simplification & BODMAS", order: 2, subtopics: [] },
      { name: "Decimals & Fractions", order: 3, subtopics: [] },
      { name: "Powers & Roots", order: 4, subtopics: [] },
      { name: "Divisibility Rules", order: 5, subtopics: [] },
      { name: "HCF & LCM", order: 6, subtopics: [] },
      { name: "Ratio & Proportion", order: 7, subtopics: [] },
      { name: "Percentage", order: 8, subtopics: [] },
      { name: "Average", order: 9, subtopics: [] },
      { name: "Profit, Loss & Discount", order: 10, subtopics: [] },
      { name: "Simple & Compound Interest", order: 11, subtopics: [] },
      { name: "Partnership", order: 12, subtopics: [] },
      { name: "Variation", order: 13, subtopics: [] },
      { name: "Mensuration", order: 14, subtopics: [{ name: "Area", order: 1 }, { name: "Volume & Surface Area", order: 2 }] },
      { name: "Time & Work", order: 15, subtopics: [] },
      { name: "Time & Distance", order: 16, subtopics: [] },
      { name: "Data Interpretation", order: 17, subtopics: [{ name: "Tables", order: 1 }, { name: "Line Graphs", order: 2 }, { name: "Bar Graphs", order: 3 }, { name: "Pie Charts", order: 4 }, { name: "Venn Diagrams", order: 5 }] },
    ],
  },
  {
    name: "English Language & Comprehension",
    order: 4,
    topics: [
      { name: "Vocabulary", order: 1, subtopics: [] },
      { name: "Grammar", order: 2, subtopics: [] },
      { name: "Sentence Structure", order: 3, subtopics: [] },
      { name: "Synonyms & Antonyms", order: 4, subtopics: [] },
      { name: "Correct Usage", order: 5, subtopics: [] },
      { name: "Error Spotting", order: 6, subtopics: [] },
      { name: "Sentence Improvement", order: 7, subtopics: [] },
      { name: "Fill in the Blanks", order: 8, subtopics: [] },
      { name: "Articles, Prepositions & Conjunctions", order: 9, subtopics: [] },
      { name: "Spelling", order: 10, subtopics: [] },
      { name: "Idioms & Phrases", order: 11, subtopics: [] },
      { name: "Proverbs", order: 12, subtopics: [] },
      { name: "One-Word Substitution", order: 13, subtopics: [] },
      { name: "Collocations", order: 14, subtopics: [] },
      { name: "Reading Comprehension", order: 15, subtopics: [{ name: "Passage Title", order: 1 }, { name: "Central Idea", order: 2 }, { name: "Inference", order: 3 }, { name: "Word Meaning", order: 4 }] },
      { name: "Para Jumbles", order: 16, subtopics: [] },
    ],
  },
  {
    name: "Hindi Language & Comprehension",
    order: 5,
    topics: [
      { name: "Vocabulary (शब्दावली)", order: 1, subtopics: [] },
      { name: "Grammar (व्याकरण)", order: 2, subtopics: [] },
      { name: "Sentence Structure (वाक्य संरचना)", order: 3, subtopics: [] },
      { name: "Synonyms & Antonyms (पर्यायवाची व विलोम)", order: 4, subtopics: [] },
      { name: "Correct Usage (शुद्ध प्रयोग)", order: 5, subtopics: [] },
      { name: "Comprehension (गद्यांश)", order: 6, subtopics: [] },
    ],
  },

  // ── SECTION B (Computer Science + Teaching Methodology) ─────────────────
  {
    name: "Mathematics",
    order: 6,
    topics: [
      { name: "Algebra", order: 1, subtopics: [] },
      { name: "Calculus", order: 2, subtopics: [] },
      { name: "Trigonometry", order: 3, subtopics: [] },
      { name: "Coordinate Geometry", order: 4, subtopics: [] },
      { name: "Matrices & Determinants", order: 5, subtopics: [] },
      { name: "Differential Equations", order: 6, subtopics: [] },
      { name: "Numerical Methods", order: 7, subtopics: [] },
    ],
  },
  {
    name: "Business Communication, Business Organization & Management, Writing",
    order: 7,
    topics: [
      { name: "Business Communication Principles", order: 1, subtopics: [] },
      { name: "Business Organization Structures", order: 2, subtopics: [] },
      { name: "Management Concepts", order: 3, subtopics: [] },
      { name: "Business Writing Skills", order: 4, subtopics: [] },
      { name: "Report Writing", order: 5, subtopics: [] },
      { name: "Office Correspondence", order: 6, subtopics: [] },
    ],
  },
  {
    name: "Computer Basics and P.C. Software",
    order: 8,
    topics: [
      {
        name: "Computer Basics", // (existing)
        order: 1,
        subtopics: [
          { name: "Generations of Computers", order: 1 },
          { name: "Classification of Computers", order: 2 },
        ],
      },
      { name: "Hardware Components", order: 2, subtopics: [] },
      { name: "Software Concepts", order: 3, subtopics: [] },
      { name: "MS Office", order: 4, subtopics: [{ name: "MS Word", order: 1 }, { name: "MS Excel", order: 2 }, { name: "MS PowerPoint", order: 3 }] },
      { name: "PC Software Applications", order: 5, subtopics: [] },
      { name: "File Management", order: 6, subtopics: [] },
      { name: "Operating System Basics", order: 7, subtopics: [] },
    ],
  },
  {
    name: "Programming with C, Data Structures using C, C++ Programming",
    order: 9,
    topics: [
      {
        name: "C Fundamentals", // (existing)
        order: 1,
        subtopics: [{ name: "Data Types & Operators", order: 1 }],
      },
      {
        name: "Control Structures", // (existing)
        order: 2,
        subtopics: [{ name: "Loops & Conditionals", order: 1 }],
      },
      {
        name: "Functions & Recursion", // (existing)
        order: 3,
        subtopics: [{ name: "Function Calls", order: 1 }, { name: "Call by Value / Reference", order: 2 }],
      },
      {
        name: "Arrays & Pointers", // (existing)
        order: 4,
        subtopics: [{ name: "Pointers", order: 1 }, { name: "Dynamic Memory", order: 2 }],
      },
      {
        name: "Structures & Unions", // (existing)
        order: 5,
        subtopics: [{ name: "Struct Members", order: 1 }],
      },
      { name: "File Handling in C", order: 6, subtopics: [] },
      {
        name: "OOP Concepts (C++)", // (existing)
        order: 7,
        subtopics: [{ name: "Classes & Objects", order: 1 }, { name: "Inheritance & Polymorphism", order: 2 }],
      },
      { name: "Constructors & Destructors", order: 8, subtopics: [] },
      { name: "Function & Operator Overloading", order: 9, subtopics: [] },
      { name: "C++ Templates", order: 10, subtopics: [] },
      { name: "C++ Exception Handling", order: 11, subtopics: [] },
      { name: "C++ STL", order: 12, subtopics: [] },
      {
        name: "Arrays & Strings", // (existing)
        order: 13,
        subtopics: [{ name: "Array Operations", order: 1 }],
      },
      {
        name: "Linked Lists", // (existing)
        order: 14,
        subtopics: [{ name: "Singly Linked List", order: 1 }, { name: "Doubly & Circular Lists", order: 2 }],
      },
      {
        name: "Stacks & Queues", // (existing)
        order: 15,
        subtopics: [{ name: "Stack Operations", order: 1 }, { name: "Queue Types (FIFO, Circular, Deque)", order: 2 }],
      },
      {
        name: "Trees", // (existing)
        order: 16,
        subtopics: [{ name: "Binary Trees", order: 1 }, { name: "BST", order: 2 }, { name: "AVL Trees", order: 3 }, { name: "Traversals", order: 4 }],
      },
      {
        name: "Graphs", // (existing)
        order: 17,
        subtopics: [{ name: "Graph Representations", order: 1 }, { name: "BFS & DFS", order: 2 }],
      },
      {
        name: "Sorting Algorithms", // (existing)
        order: 18,
        subtopics: [{ name: "Comparison Sorts", order: 1 }, { name: "Merge, Quick & Heap Sort", order: 2 }],
      },
      {
        name: "Searching Algorithms", // (existing)
        order: 19,
        subtopics: [{ name: "Linear & Binary Search", order: 1 }],
      },
      {
        name: "Hashing", // (existing)
        order: 20,
        subtopics: [{ name: "Hash Functions", order: 1 }, { name: "Collision Resolution", order: 2 }],
      },
    ],
  },
  {
    name: "Fundamentals of Information Technology",
    order: 10,
    topics: [
      { name: "IT Concepts & Applications", order: 1, subtopics: [] },
      { name: "Data, Information & Knowledge", order: 2, subtopics: [] },
      { name: "Information Systems", order: 3, subtopics: [] },
      { name: "IT Infrastructure", order: 4, subtopics: [] },
      { name: "Emerging Technologies", order: 5, subtopics: [] },
    ],
  },
  {
    name: "Basis of Physics",
    order: 11,
    topics: [
      { name: "Basic Physics Concepts", order: 1, subtopics: [] },
      { name: "Electronics Fundamentals", order: 2, subtopics: [] },
      { name: "Semiconductor Physics", order: 3, subtopics: [] },
      { name: "Digital Electronics Basics", order: 4, subtopics: [] },
    ],
  },
  {
    name: "Digital Electronics / Boolean Logic",
    order: 12,
    topics: [
      {
        name: "Number Systems & Codes", // (existing)
        order: 1,
        subtopics: [{ name: "Conversions", order: 1 }, { name: "Complements (1's, 2's, 9's, 10's)", order: 2 }, { name: "Codes (ASCII, BCD)", order: 3 }, { name: "Binary Arithmetic", order: 4 }],
      },
      {
        name: "Boolean Algebra & Logic Gates", // (existing)
        order: 2,
        subtopics: [{ name: "Basic Gates", order: 1 }, { name: "De Morgan's Theorem", order: 2 }, { name: "Universal Gates", order: 3 }, { name: "Boolean Laws & Theorems", order: 4 }],
      },
      { name: "Minterms, Maxterms & Canonical Forms", order: 3, subtopics: [{ name: "Truth Tables", order: 1 }] },
      { name: "K-Map Simplification", order: 4, subtopics: [{ name: "SOP Form", order: 1 }, { name: "POS Form", order: 2 }] },
      { name: "Combinational Circuits", order: 5, subtopics: [{ name: "Multiplexer & Demultiplexer", order: 1 }, { name: "Decoder & Encoder", order: 2 }, { name: "Adder & Subtractor", order: 3 }] },
      { name: "Sequential Circuits", order: 6, subtopics: [{ name: "Flip-Flops (SR, JK, D, T)", order: 1 }, { name: "Multivibrators", order: 2 }, { name: "Counters", order: 3 }, { name: "Registers", order: 4 }] },
    ],
  },
  {
    name: "Database Management Systems",
    order: 13,
    topics: [
      {
        name: "DBMS Basics", // (existing)
        order: 1,
        subtopics: [
          { name: "Architecture & Data Models", order: 1 },
          { name: "Schema, Instance & Data Independence", order: 2 },
          { name: "ISAM (Indexed Sequential Access Method)", order: 3 },
          { name: "Volatility", order: 4 },
          { name: "Direct Access Storage", order: 5 },
        ],
      },
      {
        name: "Relational Model & Keys", // (existing)
        order: 2,
        subtopics: [{ name: "Keys & Constraints", order: 1 }, { name: "Degree & Cardinality", order: 2 }],
      },
      {
        name: "SQL", // (existing)
        order: 3,
        subtopics: [
          { name: "DDL & DML", order: 1 },
          { name: "Queries & Joins", order: 2 },
          { name: "Data Types", order: 3 },
          { name: "DQL (SELECT, WHERE, ORDER BY, GROUP BY, HAVING)", order: 4 },
          { name: "DCL (GRANT, REVOKE)", order: 5 },
          { name: "Constraints", order: 6 },
          { name: "Subqueries & Nested Queries", order: 7 },
        ],
      },
      {
        name: "Normalization", // (existing)
        order: 4,
        subtopics: [{ name: "1NF to BCNF", order: 1 }, { name: "Functional Dependencies", order: 2 }],
      },
      {
        name: "Transactions & Concurrency", // (existing)
        order: 5,
        subtopics: [{ name: "ACID Properties", order: 1 }],
      },
      { name: "SQL Functions", order: 6, subtopics: [{ name: "Math Functions", order: 1 }, { name: "Text Functions", order: 2 }, { name: "Date Functions", order: 3 }, { name: "Aggregate Functions", order: 4 }] },
      { name: "MySQL Basics", order: 7, subtopics: [{ name: "Creating & Using Database", order: 1 }] },
      { name: "Views & Indexes", order: 8, subtopics: [] },
      { name: "Data Dictionary & Metadata", order: 9, subtopics: [] },
    ],
  },
  {
    name: "Computer Architecture",
    order: 14,
    topics: [
      {
        name: "Computer Organization", // (existing)
        order: 1,
        subtopics: [{ name: "CPU & Registers", order: 1 }, { name: "ALU & Control Unit", order: 2 }, { name: "Buses", order: 3 }],
      },
      {
        name: "Memory & Storage", // (existing)
        order: 2,
        subtopics: [{ name: "Memory Hierarchy", order: 1 }, { name: "Primary vs Secondary Memory", order: 2 }],
      },
      { name: "Instruction Cycle", order: 3, subtopics: [] },
      { name: "Memory Units", order: 4, subtopics: [{ name: "Bit to Terabyte", order: 1 }] },
      { name: "Internal Memory (RAM & ROM)", order: 5, subtopics: [{ name: "SRAM vs DRAM", order: 1 }, { name: "ROM Types", order: 2 }] },
      { name: "Input/Output Modules", order: 6, subtopics: [] },
      { name: "External Interface", order: 7, subtopics: [] },
      { name: "I/O Techniques", order: 8, subtopics: [{ name: "Programmed I/O", order: 1 }, { name: "Interrupt-Driven I/O", order: 2 }, { name: "DMA", order: 3 }, { name: "I/O Channels & Processors", order: 4 }] },
      { name: "Memory Management", order: 9, subtopics: [] },
      { name: "Cache Memory", order: 10, subtopics: [] },
    ],
  },
  {
    name: "Front End Designed Tools",
    order: 15,
    topics: [
      { name: "GUI Design Principles", order: 1, subtopics: [] },
      { name: "Front-End Development Tools", order: 2, subtopics: [] },
      { name: "UI/UX Basics", order: 3, subtopics: [] },
      { name: "Visual Studio & Front-End Frameworks", order: 4, subtopics: [] },
      { name: "Forms & Reports Design", order: 5, subtopics: [] },
    ],
  },
  {
    name: "Financial Accounting",
    order: 16,
    topics: [
      { name: "Basic Accounting Principles", order: 1, subtopics: [] },
      { name: "Double Entry System", order: 2, subtopics: [] },
      { name: "Journal, Ledger & Trial Balance", order: 3, subtopics: [] },
      { name: "Financial Statements", order: 4, subtopics: [{ name: "Profit & Loss Account", order: 1 }, { name: "Balance Sheet", order: 2 }] },
      { name: "Accounting Software Basics", order: 5, subtopics: [] },
      { name: "Computerized Accounting", order: 6, subtopics: [] },
    ],
  },
  {
    name: "Object/Computer Oriented Programming / Numerical Techniques",
    order: 17,
    topics: [
      { name: "OOP Concepts (Class, Object, Inheritance)", order: 1, subtopics: [{ name: "Polymorphism", order: 1 }, { name: "Encapsulation & Abstraction", order: 2 }, { name: "Message Passing", order: 3 }] },
      { name: "Numerical Techniques", order: 2, subtopics: [] },
      { name: "Error Analysis", order: 3, subtopics: [] },
      { name: "Interpolation Methods", order: 4, subtopics: [] },
    ],
  },
  {
    name: "Software Engineering",
    order: 18,
    topics: [
      {
        name: "SDLC & Models", // (existing)
        order: 1,
        subtopics: [{ name: "Waterfall Model", order: 1 }, { name: "Prototype & Spiral Model", order: 2 }, { name: "Agile & RAD", order: 3 }],
      },
      {
        name: "Software Testing", // (existing)
        order: 2,
        subtopics: [{ name: "Testing Levels", order: 1 }, { name: "Black-box & White-box", order: 2 }],
      },
      {
        name: "Software Design", // (existing)
        order: 3,
        subtopics: [{ name: "Coupling & Cohesion", order: 1 }, { name: "Architectural Design", order: 2 }],
      },
      { name: "Software Requirements Specification", order: 4, subtopics: [] },
      { name: "Software Maintenance", order: 5, subtopics: [] },
      { name: "Project Management", order: 6, subtopics: [] },
      { name: "Quality Assurance (ISO, CMMI)", order: 7, subtopics: [] },
      { name: "Risk Management", order: 8, subtopics: [] },
      { name: "Configuration Management", order: 9, subtopics: [] },
    ],
  },
  {
    name: "Java Programming and Website Design",
    order: 19,
    topics: [
      { name: "Java Basics (JVM, JDK, JRE)", order: 1, subtopics: [{ name: "Data Types, Variables & Operators", order: 1 }, { name: "Control Structures", order: 2 }] },
      { name: "Java OOP", order: 2, subtopics: [{ name: "Class & Object", order: 1 }, { name: "Inheritance & Polymorphism", order: 2 }] },
      { name: "Interfaces & Abstract Classes", order: 3, subtopics: [] },
      { name: "Packages & Exception Handling", order: 4, subtopics: [] },
      { name: "Multithreading", order: 5, subtopics: [] },
      { name: "Applets & Swing/AWT", order: 6, subtopics: [] },
      { name: "Java Collections Framework", order: 7, subtopics: [] },
      {
        name: "HTML & CSS", // (existing)
        order: 8,
        subtopics: [{ name: "HTML Elements", order: 1 }, { name: "CSS Basics", order: 2 }, { name: "Web Page Layout & Design Principles", order: 3 }, { name: "Responsive Design", order: 4 }],
      },
      {
        name: "JavaScript", // (existing)
        order: 9,
        subtopics: [{ name: "Client-side Scripting", order: 1 }],
      },
      {
        name: "Web Protocols", // (existing)
        order: 10,
        subtopics: [{ name: "HTTP & HTTPS", order: 1 }],
      },
    ],
  },
  {
    name: "Operating Systems & Linux",
    order: 20,
    topics: [
      {
        name: "OS Fundamentals", // (existing)
        order: 1,
        subtopics: [{ name: "Functions of an OS", order: 1 }, { name: "OS Organization", order: 2 }, { name: "Multiprocessing & Time Sharing", order: 3 }],
      },
      {
        name: "Process Management", // (existing)
        order: 2,
        subtopics: [{ name: "Process States", order: 1 }, { name: "Threads", order: 2 }],
      },
      {
        name: "CPU Scheduling", // (existing)
        order: 3,
        subtopics: [{ name: "FCFS", order: 1 }, { name: "SJF", order: 2 }, { name: "Round Robin", order: 3 }, { name: "Priority Scheduling", order: 4 }],
      },
      {
        name: "Process Synchronization", // (existing)
        order: 4,
        subtopics: [{ name: "Semaphores", order: 1 }],
      },
      {
        name: "Deadlocks", // (existing)
        order: 5,
        subtopics: [{ name: "Conditions & Banker's Algorithm", order: 1 }],
      },
      {
        name: "Memory Management", // (existing)
        order: 6,
        subtopics: [{ name: "Fragmentation", order: 1 }, { name: "Paging & Segmentation", order: 2 }, { name: "Page Fault", order: 3 }, { name: "Page Replacement", order: 4 }],
      },
      {
        name: "File Systems", // (existing)
        order: 7,
        subtopics: [{ name: "File Allocation", order: 1 }, { name: "Directory Structure", order: 2 }],
      },
      { name: "Device Management & Interrupts", order: 8, subtopics: [{ name: "Spooling", order: 1 }, { name: "System Calls", order: 2 }] },
      { name: "Linux Basics & Commands", order: 9, subtopics: [{ name: "Shell Operations", order: 1 }, { name: "Directory Structure", order: 2 }, { name: "Open Source OS Concepts", order: 3 }] },
      { name: "Linux File Permissions", order: 10, subtopics: [{ name: "chmod & chown", order: 1 }] },
      { name: "Linux File System", order: 11, subtopics: [] },
    ],
  },
  {
    name: "Business Economics",
    order: 21,
    topics: [
      { name: "Micro & Macro Economics", order: 1, subtopics: [] },
      { name: "Demand & Supply", order: 2, subtopics: [] },
      { name: "Cost & Production", order: 3, subtopics: [] },
      { name: "Market Structures", order: 4, subtopics: [] },
      { name: "National Income", order: 5, subtopics: [] },
      { name: "Economic Policies", order: 6, subtopics: [] },
      { name: "Business Environment", order: 7, subtopics: [] },
    ],
  },
  {
    name: "Computer Networks, TCP/IP & Network Security",
    order: 22,
    topics: [
      {
        name: "Network Fundamentals", // (existing)
        order: 1,
        subtopics: [{ name: "Topologies & Devices", order: 1 }, { name: "Network Types (LAN, MAN, WAN, PAN)", order: 2 }, { name: "Evolution of Networking (ARPANET, NSFNET)", order: 3 }, { name: "Peer-to-Peer vs Client-Server", order: 4 }],
      },
      {
        name: "OSI & TCP/IP Models", // (existing)
        order: 2,
        subtopics: [{ name: "Layers", order: 1 }, { name: "Layer Functions", order: 2 }],
      },
      {
        name: "Network Layer", // (existing)
        order: 3,
        subtopics: [{ name: "IP Addressing", order: 1 }, { name: "Routing", order: 2 }],
      },
      {
        name: "Transport Layer", // (existing)
        order: 4,
        subtopics: [{ name: "TCP & UDP", order: 1 }, { name: "Ports", order: 2 }],
      },
      {
        name: "Application Layer Protocols", // (existing)
        order: 5,
        subtopics: [{ name: "HTTP, DNS", order: 1 }, { name: "FTP, SMTP", order: 2 }],
      },
      { name: "Transmission Media", order: 6, subtopics: [{ name: "Guided Media", order: 1 }, { name: "Unguided Media", order: 2 }] },
      { name: "Network Devices", order: 7, subtopics: [{ name: "Switch, Router, Hub", order: 1 }, { name: "Bridge, Gateway, Repeater", order: 2 }] },
      { name: "IP Addressing & Subnetting", order: 8, subtopics: [{ name: "IPv4 & IPv6", order: 1 }, { name: "Subnetting", order: 2 }, { name: "MAC Address", order: 3 }, { name: "DNS & DHCP", order: 4 }] },
      { name: "Data Communication & Switching", order: 9, subtopics: [{ name: "Transmission Modes", order: 1 }, { name: "Circuit & Packet Switching", order: 2 }, { name: "Bandwidth & Data Transfer Rate", order: 3 }] },
      { name: "Network Security Basics", order: 10, subtopics: [{ name: "Firewall", order: 1 }, { name: "SSL/TLS", order: 2 }, { name: "Cyber Safety", order: 3 }, { name: "Digital Certificate & PKI", order: 4 }, { name: "Authentication & Non-Repudiation", order: 5 }, { name: "Malware & Phishing", order: 6 }, { name: "E-Commerce Security", order: 7 }] },
    ],
  },
  {
    name: ".NET Programming",
    order: 23,
    topics: [
      { name: ".NET Framework & CLR", order: 1, subtopics: [] },
      { name: ".NET Languages (C#, VB.NET)", order: 2, subtopics: [] },
      { name: "ASP.NET", order: 3, subtopics: [] },
      { name: "ADO.NET", order: 4, subtopics: [] },
      { name: "Web Services in .NET", order: 5, subtopics: [] },
      { name: ".NET Architecture", order: 6, subtopics: [] },
    ],
  },
  {
    name: "Linux Environment",
    order: 24,
    topics: [
      { name: "Linux Installation & Configuration", order: 1, subtopics: [] },
      { name: "Shell Scripting", order: 2, subtopics: [] },
      { name: "Process Management in Linux", order: 3, subtopics: [] },
      { name: "Memory & File System in Linux", order: 4, subtopics: [] },
      { name: "User & Group Administration", order: 5, subtopics: [] },
      { name: "Networking & Security in Linux", order: 6, subtopics: [] },
    ],
  },
  {
    name: "E-Commerce",
    order: 25,
    topics: [
      { name: "Introduction to E-Commerce", order: 1, subtopics: [] },
      { name: "Types of E-Commerce (B2B, B2C, C2C, B2G)", order: 2, subtopics: [] },
      { name: "E-Commerce Infrastructure", order: 3, subtopics: [] },
      { name: "Payment Systems", order: 4, subtopics: [{ name: "Digital Payment & E-Wallets", order: 1 }, { name: "UPI & Cryptocurrency", order: 2 }] },
      { name: "E-Commerce Security", order: 5, subtopics: [] },
      { name: "M-Commerce", order: 6, subtopics: [] },
      { name: "E-Marketing", order: 7, subtopics: [] },
      { name: "Online Shopping & Portals", order: 8, subtopics: [] },
    ],
  },
  {
    name: "Design and Analysis of Algorithms",
    order: 26,
    topics: [
      { name: "Algorithm Complexity", order: 1, subtopics: [{ name: "Time & Space Complexity", order: 1 }, { name: "Big-O, Omega, Theta", order: 2 }] },
      { name: "Divide & Conquer", order: 2, subtopics: [] },
      { name: "Greedy Algorithms", order: 3, subtopics: [] },
      { name: "Dynamic Programming", order: 4, subtopics: [] },
      { name: "Backtracking", order: 5, subtopics: [] },
      { name: "Branch & Bound", order: 6, subtopics: [] },
      { name: "Graph Algorithms", order: 7, subtopics: [{ name: "BFS & DFS", order: 1 }, { name: "Shortest Path", order: 2 }, { name: "Minimum Spanning Tree", order: 3 }] },
      { name: "NP-Completeness & Approximation", order: 8, subtopics: [] },
      { name: "Advanced Sorting & Searching", order: 9, subtopics: [] },
    ],
  },
  {
    name: "Computer Network Security",
    order: 27,
    topics: [
      { name: "Security Threats & Attacks", order: 1, subtopics: [] },
      { name: "Cryptography", order: 2, subtopics: [{ name: "Symmetric & Asymmetric", order: 1 }] },
      { name: "Hash Functions", order: 3, subtopics: [] },
      { name: "Digital Signatures", order: 4, subtopics: [] },
      { name: "Firewall & Intrusion Detection", order: 5, subtopics: [] },
      { name: "VPN (Virtual Private Network)", order: 6, subtopics: [] },
      { name: "Network Security Protocols", order: 7, subtopics: [{ name: "IPSec", order: 1 }, { name: "SSL/TLS & HTTPS", order: 2 }] },
      { name: "Security Policies", order: 8, subtopics: [] },
    ],
  },
  {
    name: "MIS / DSS / Expert Systems",
    order: 28,
    topics: [
      { name: "MIS Concepts & Applications", order: 1, subtopics: [] },
      { name: "Decision Support Systems", order: 2, subtopics: [] },
      { name: "Expert Systems", order: 3, subtopics: [] },
      { name: "Knowledge Management Systems", order: 4, subtopics: [] },
      { name: "Information System Planning", order: 5, subtopics: [] },
      { name: "System Analysis & Design", order: 6, subtopics: [] },
      { name: "ERP (Enterprise Resource Planning)", order: 7, subtopics: [] },
    ],
  },
  {
    name: "Mobile Computing",
    order: 29,
    topics: [
      { name: "Introduction to Mobile Computing", order: 1, subtopics: [] },
      { name: "Mobile Communication Technologies", order: 2, subtopics: [{ name: "GSM & CDMA", order: 1 }, { name: "3G, 4G, 5G", order: 2 }] },
      { name: "Wireless Networks", order: 3, subtopics: [] },
      { name: "Mobile Operating Systems", order: 4, subtopics: [{ name: "Android & iOS", order: 1 }] },
      { name: "Mobile Application Development", order: 5, subtopics: [] },
      { name: "Mobile Security", order: 6, subtopics: [] },
      { name: "Location-Based Services", order: 7, subtopics: [] },
    ],
  },
  {
    name: "Computer Graphics & Multimedia",
    order: 30,
    topics: [
      { name: "Graphics Fundamentals", order: 1, subtopics: [] },
      { name: "Graphics Hardware", order: 2, subtopics: [{ name: "Display Devices", order: 1 }, { name: "Input Devices", order: 2 }] },
      { name: "Raster & Vector Graphics", order: 3, subtopics: [] },
      { name: "Color Models", order: 4, subtopics: [{ name: "RGB", order: 1 }, { name: "CMYK", order: 2 }] },
      { name: "2D & 3D Graphics", order: 5, subtopics: [] },
      { name: "Clipping", order: 6, subtopics: [{ name: "Point Clipping", order: 1 }, { name: "Line Clipping (Cohen-Sutherland, Liang-Barsky)", order: 2 }, { name: "Polygon Clipping (Sutherland-Hodgman)", order: 3 }] },
      { name: "Curves & Surfaces", order: 7, subtopics: [{ name: "Bezier Curves", order: 1 }, { name: "B-Spline & Hermite", order: 2 }, { name: "Surface Modeling", order: 3 }] },
      { name: "Solid Modeling", order: 8, subtopics: [{ name: "B-Rep", order: 1 }, { name: "CSG", order: 2 }, { name: "Sweep Representation", order: 3 }] },
      { name: "Multimedia Elements", order: 9, subtopics: [{ name: "Text, Graphics, Audio, Video", order: 1 }] },
      { name: "Multimedia File Formats & Compression", order: 10, subtopics: [] },
      { name: "Multimedia Authoring Tools", order: 11, subtopics: [] },
      { name: "Virtual Reality Basics", order: 12, subtopics: [] },
    ],
  },
  {
    name: "Internet Programming — Web Server, CSS, Event Model, Data Binding, XML",
    order: 31,
    topics: [
      { name: "Web Server Concepts", order: 1, subtopics: [] },
      { name: "IIS & Apache Web Server", order: 2, subtopics: [{ name: "PWS Setup", order: 1 }, { name: "Publishing Information", order: 2 }] },
      { name: "CSS Syntax & Selectors", order: 3, subtopics: [{ name: "Margins, Padding, Borders", order: 1 }] },
      { name: "CSS Filters & Transitions", order: 4, subtopics: [] },
      { name: "Event Model", order: 5, subtopics: [{ name: "Event Handling & Listeners", order: 1 }, { name: "DOM Events", order: 2 }] },
      { name: "Data Binding (Tabular Data Control)", order: 6, subtopics: [] },
      { name: "XML Basics & Structure", order: 7, subtopics: [{ name: "Naming Rules", order: 1 }, { name: "Element Content Models", order: 2 }, { name: "Element Occurrence Indicators", order: 3 }, { name: "Character Content", order: 4 }, { name: "Viewing XML", order: 5 }] },
      { name: "DTD (Document Type Definition)", order: 8, subtopics: [] },
      { name: "XML with XHTML and CSS", order: 9, subtopics: [] },
      { name: "XML Parsers (SAX, DOM)", order: 10, subtopics: [] },
      { name: "XHTML Rules & Syntax", order: 11, subtopics: [] },
    ],
  },
  {
    name: "Knowledge Management & New Economy",
    order: 32,
    topics: [
      { name: "Knowledge Management Concepts", order: 1, subtopics: [] },
      { name: "Knowledge Creation & Sharing", order: 2, subtopics: [] },
      { name: "Knowledge Management Systems", order: 3, subtopics: [] },
      { name: "New Economy Concepts", order: 4, subtopics: [] },
      { name: "Digital Economy", order: 5, subtopics: [] },
      { name: "Knowledge-based Organizations", order: 6, subtopics: [] },
    ],
  },
  {
    name: "Foundation Course in English",
    order: 33,
    topics: [
      { name: "English Grammar Basics", order: 1, subtopics: [] },
      { name: "Vocabulary Building", order: 2, subtopics: [] },
      { name: "Writing Skills", order: 3, subtopics: [] },
      { name: "Communication Skills", order: 4, subtopics: [] },
      { name: "Comprehension Skills", order: 5, subtopics: [] },
    ],
  },
  {
    name: "Problem Solving & Programming",
    order: 34,
    topics: [
      { name: "Problem-Solving Steps", order: 1, subtopics: [{ name: "Analyzing the Problem", order: 1 }, { name: "Algorithm → Code → Test", order: 2 }] },
      { name: "Flowcharts & Pseudocode", order: 2, subtopics: [] },
      { name: "Decomposition", order: 3, subtopics: [] },
      { name: "Programming Logic", order: 4, subtopics: [] },
      { name: "Algorithm Design", order: 5, subtopics: [] },
      { name: "Data Structures Application", order: 6, subtopics: [] },
    ],
  },
  {
    name: "Statistical Techniques",
    order: 35,
    topics: [
      { name: "Measures of Central Tendency", order: 1, subtopics: [{ name: "Mean, Median, Mode", order: 1 }] },
      { name: "Measures of Dispersion", order: 2, subtopics: [{ name: "Range, Variance, Standard Deviation", order: 1 }] },
      { name: "Skewness & Kurtosis", order: 3, subtopics: [] },
      { name: "Probability Concepts", order: 4, subtopics: [{ name: "Conditional Probability", order: 1 }, { name: "Bayes' Theorem", order: 2 }, { name: "Random Variables", order: 3 }] },
      { name: "Probability Distributions", order: 5, subtopics: [{ name: "Binomial & Poisson", order: 1 }, { name: "Normal & Uniform", order: 2 }, { name: "Exponential", order: 3 }] },
      { name: "Sampling & Estimation", order: 6, subtopics: [{ name: "Point & Interval Estimation", order: 1 }] },
      { name: "Hypothesis Testing", order: 7, subtopics: [{ name: "Confidence Intervals", order: 1 }] },
      { name: "Regression & Correlation", order: 8, subtopics: [] },
    ],
  },
  {
    name: "TCP/Protocols",
    order: 36,
    topics: [
      { name: "TCP", order: 1, subtopics: [{ name: "Connection Management", order: 1 }] },
      { name: "UDP", order: 2, subtopics: [] },
      { name: "IP (Internet Protocol)", order: 3, subtopics: [] },
      { name: "ICMP", order: 4, subtopics: [] },
      { name: "ARP/RARP", order: 5, subtopics: [] },
      { name: "Application Protocols", order: 6, subtopics: [{ name: "HTTP/HTTPS", order: 1 }, { name: "FTP", order: 2 }, { name: "SMTP/POP3", order: 3 }, { name: "Telnet/SSH", order: 4 }, { name: "DNS/DHCP", order: 5 }] },
      { name: "Protocol Stack & Architecture", order: 7, subtopics: [] },
      { name: "TCP/IP vs OSI Model", order: 8, subtopics: [] },
    ],
  },
  {
    name: "Interpolation",
    order: 37,
    topics: [
      { name: "Introduction to Interpolation", order: 1, subtopics: [] },
      { name: "Linear Interpolation", order: 2, subtopics: [] },
      { name: "Polynomial Interpolation", order: 3, subtopics: [] },
      { name: "Lagrange Interpolation", order: 4, subtopics: [] },
      { name: "Newton's Forward & Backward Interpolation", order: 5, subtopics: [] },
      { name: "Finite Differences", order: 6, subtopics: [] },
      { name: "Numerical Methods for Interpolation", order: 7, subtopics: [] },
    ],
  },
  {
    name: "Teaching Methodology / Pedagogy",
    order: 38,
    topics: [
      { name: "Learning & Teaching", order: 1, subtopics: [] },
      { name: "Language Across the Curriculum", order: 2, subtopics: [] },
      { name: "Understanding Discipline & Subject", order: 3, subtopics: [] },
      { name: "Gender, School & Society", order: 4, subtopics: [] },
      { name: "Pedagogy of a School Subject", order: 5, subtopics: [] },
      { name: "Knowledge & Curriculum", order: 6, subtopics: [] },
      { name: "Assessment for Learning", order: 7, subtopics: [] },
      { name: "Creating an Inclusive School", order: 8, subtopics: [] },
      { name: "Childhood & Growing Up", order: 9, subtopics: [] },
      { name: "Drama & Art in Education", order: 10, subtopics: [] },
      { name: "Teaching Methods & Strategies", order: 11, subtopics: [] },
      { name: "Educational Psychology", order: 12, subtopics: [] },
      { name: "Lesson Planning", order: 13, subtopics: [] },
    ],
  },
];
