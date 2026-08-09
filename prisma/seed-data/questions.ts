// Original practice questions for Phase 1.
// Every question here is AI_GENERATED content written for this project. It is
// NOT claimed to be a real previous-year question. Explanations are written to
// be exam-relevant and accurate.

export interface SeedQuestion {
  text: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "VERY_HARD";
  examRelevance: number; // 0-100
  topic: string; // topic name within its subject
  subtopic?: string; // subtopic name
}

export const QUESTIONS: SeedQuestion[] = [
  // ────────────────────────── Computer Fundamentals & Architecture ──────────
  {
    topic: "Computer Basics",
    subtopic: "Generations of Computers",
    text: "Which generation of computers used vacuum tubes as their main electronic component?",
    options: ["First generation", "Second generation", "Third generation", "Fourth generation"],
    correctIndex: 0,
    explanation:
      "First-generation computers (1940s–1950s, e.g. ENIAC, UNIVAC) used vacuum tubes. Transistors came in the second generation, ICs in the third, and microprocessors/VLSI in the fourth.",
    difficulty: "EASY",
    examRelevance: 80,
  },
  {
    topic: "Computer Basics",
    subtopic: "Generations of Computers",
    text: "Integrated circuits (ICs) are characteristic of which generation of computers?",
    options: ["First generation", "Second generation", "Third generation", "Fourth generation"],
    correctIndex: 2,
    explanation:
      "Third-generation computers (1960s–1970s) used integrated circuits. Second generation used transistors, and fourth generation used microprocessors.",
    difficulty: "EASY",
    examRelevance: 75,
  },
  {
    topic: "Number Systems & Codes",
    subtopic: "Conversions",
    text: "The decimal number 13 is equal to which binary number?",
    options: ["1101", "1011", "1110", "1100"],
    correctIndex: 0,
    explanation:
      "13 = 8 + 4 + 1 = 2^3 + 2^2 + 2^0, which is 1101 in binary.",
    difficulty: "MEDIUM",
    examRelevance: 85,
  },
  {
    topic: "Number Systems & Codes",
    subtopic: "Codes (ASCII, BCD)",
    text: "Standard ASCII is a 7-bit code. How many distinct characters can it represent?",
    options: ["128", "256", "64", "512"],
    correctIndex: 0,
    explanation:
      "7 bits give 2^7 = 128 distinct codes. Extended ASCII uses 8 bits (256 characters).",
    difficulty: "MEDIUM",
    examRelevance: 80,
  },
  {
    topic: "Boolean Algebra & Logic Gates",
    subtopic: "Basic Gates",
    text: "Which gate outputs 1 only when the two inputs are different?",
    options: ["XOR", "AND", "OR", "NAND"],
    correctIndex: 0,
    explanation:
      "XOR (exclusive OR) outputs 1 when inputs differ and 0 when they are equal. It is the basic gate used for bit comparison.",
    difficulty: "MEDIUM",
    examRelevance: 85,
  },
  {
    topic: "Boolean Algebra & Logic Gates",
    subtopic: "Basic Gates",
    text: "In Boolean algebra, what is the value of X + X' (X OR NOT X)?",
    options: ["1", "0", "X", "X'"],
    correctIndex: 0,
    explanation:
      "The complement law states X + X' = 1 (either X or its complement is always true). Similarly X · X' = 0.",
    difficulty: "EASY",
    examRelevance: 80,
  },
  {
    topic: "Boolean Algebra & Logic Gates",
    subtopic: "Basic Gates",
    text: "Which gate is the complement (NOT) of the AND gate?",
    options: ["NAND", "NOR", "XOR", "OR"],
    correctIndex: 0,
    explanation:
      "NAND = NOT AND. It outputs 0 only when all inputs are 1; otherwise it outputs 1.",
    difficulty: "MEDIUM",
    examRelevance: 80,
  },
  {
    topic: "Computer Organization",
    subtopic: "CPU & Registers",
    text: "Which register stores the memory address of the next instruction to be executed?",
    options: ["Program Counter (PC)", "Instruction Register (IR)", "Accumulator (ACC)", "Memory Address Register (MAR)"],
    correctIndex: 0,
    explanation:
      "The Program Counter (PC) holds the address of the next instruction. The IR holds the currently executing instruction, the MAR holds the address for memory access.",
    difficulty: "MEDIUM",
    examRelevance: 75,
  },
  {
    topic: "Computer Organization",
    subtopic: "ALU & Control Unit",
    text: "Which component of the CPU performs arithmetic and logical operations?",
    options: ["ALU", "Control Unit", "Registers", "Cache"],
    correctIndex: 0,
    explanation:
      "The Arithmetic Logic Unit (ALU) performs arithmetic (add, subtract) and logical (AND, OR, compare) operations. The Control Unit directs and coordinates operations.",
    difficulty: "EASY",
    examRelevance: 90,
  },
  {
    topic: "Computer Organization",
    subtopic: "Buses",
    text: "Which system bus carries data between the CPU and memory?",
    options: ["Data bus", "Address bus", "Control bus", "System clock"],
    correctIndex: 0,
    explanation:
      "The data bus carries data, the address bus carries memory addresses, and the control bus carries control signals.",
    difficulty: "MEDIUM",
    examRelevance: 70,
  },
  {
    topic: "Memory & Storage",
    subtopic: "Memory Hierarchy",
    text: "Which of the following is the fastest type of memory?",
    options: ["Registers", "Cache memory", "RAM", "SSD"],
    correctIndex: 0,
    explanation:
      "Registers are inside the CPU and are the fastest. The memory hierarchy from fastest to slowest: Registers > Cache > RAM > SSD/Hard disk.",
    difficulty: "EASY",
    examRelevance: 85,
  },
  {
    topic: "Memory & Storage",
    subtopic: "Primary vs Secondary Memory",
    text: "Which memory is volatile — its contents are lost when power is turned off?",
    options: ["RAM", "ROM", "Hard disk", "SSD"],
    correctIndex: 0,
    explanation:
      "RAM is volatile. ROM, hard disks and SSDs retain data without power (non-volatile).",
    difficulty: "EASY",
    examRelevance: 90,
  },

  // ────────────────────────── Operating Systems ─────────────────────────────
  {
    topic: "OS Fundamentals",
    subtopic: "Functions of an OS",
    text: "Which of the following is NOT a primary function of an operating system?",
    options: ["Memory management", "Process scheduling", "Compiling C programs", "File system management"],
    correctIndex: 2,
    explanation:
      "Compilation is the job of a compiler, not the OS. The OS manages processes, memory, files, devices and security.",
    difficulty: "MEDIUM",
    examRelevance: 80,
  },
  {
    topic: "Process Management",
    subtopic: "Process States",
    text: "Which of the following is a valid state of a process?",
    options: ["Ready", "Deadlocked", "Cached", "Paged"],
    correctIndex: 0,
    explanation:
      "Classic process states are: New, Ready, Running, Blocked/Waiting, and Terminated. Deadlock is a condition processes can be in collectively, not a process state.",
    difficulty: "EASY",
    examRelevance: 85,
  },
  {
    topic: "CPU Scheduling",
    subtopic: "FCFS",
    text: "Which CPU scheduling algorithm is non-preemptive and executes processes in the order they arrive?",
    options: ["FCFS", "Round Robin", "Priority", "Multilevel Queue"],
    correctIndex: 0,
    explanation:
      "First Come First Served (FCFS) schedules in arrival order and is non-preemptive. It can suffer from the convoy effect.",
    difficulty: "EASY",
    examRelevance: 80,
  },
  {
    topic: "CPU Scheduling",
    subtopic: "Round Robin",
    text: "Round Robin scheduling assigns the CPU to each process for a fixed time slice. This policy is best described as:",
    options: ["Preemptive time slicing", "Non-preemptive", "Priority based", "First fit"],
    correctIndex: 0,
    explanation:
      "Round Robin is preemptive: a process runs for one time quantum and is then preempted and placed at the back of the ready queue.",
    difficulty: "MEDIUM",
    examRelevance: 90,
  },
  {
    topic: "CPU Scheduling",
    subtopic: "Round Robin",
    text: "In Round Robin scheduling, if the time quantum is made very large, the behaviour becomes similar to which algorithm?",
    options: ["FCFS", "SJF", "Priority", "LIFO"],
    correctIndex: 0,
    explanation:
      "A large quantum means each process effectively runs to completion in arrival order, so Round Robin degrades to FCFS.",
    difficulty: "HARD",
    examRelevance: 80,
  },
  {
    topic: "CPU Scheduling",
    subtopic: "SJF",
    text: "Which scheduling algorithm is known to give the minimum average waiting time (among non-preemptive algorithms)?",
    options: ["SJF (Shortest Job First)", "FCFS", "Round Robin", "Random"],
    correctIndex: 0,
    explanation:
      "SJF is provably optimal for minimum average waiting time among non-preemptive policies, but it requires knowledge of burst times.",
    difficulty: "MEDIUM",
    examRelevance: 85,
  },
  {
    topic: "Process Synchronization",
    subtopic: "Semaphores",
    text: "Which synchronization mechanism uses wait (down) and signal (up) operations to control access to a critical section?",
    options: ["Semaphore", "Interrupt", "Buffer", "Deadlock"],
    correctIndex: 0,
    explanation:
      "A semaphore is a counter with atomic wait()/signal() operations used to enforce mutual exclusion and control concurrency.",
    difficulty: "MEDIUM",
    examRelevance: 85,
  },
  {
    topic: "Deadlocks",
    subtopic: "Conditions & Banker's Algorithm",
    text: "Mutual exclusion, hold and wait, no preemption, and circular wait are the four conditions that must hold for a ____ to occur.",
    options: ["Deadlock", "Thrashing", "Race condition", "Cache miss"],
    correctIndex: 0,
    explanation:
      "All four conditions (mutual exclusion, hold and wait, no preemption, circular wait) must hold simultaneously for deadlock.",
    difficulty: "MEDIUM",
    examRelevance: 75,
  },
  {
    topic: "Deadlocks",
    subtopic: "Conditions & Banker's Algorithm",
    text: "Which algorithm is used for deadlock avoidance?",
    options: ["Banker's algorithm", "Round Robin", "Bellman-Ford", "Earliest deadline first"],
    correctIndex: 0,
    explanation:
      "The Banker's algorithm avoids deadlock by checking whether allocating resources leaves the system in a safe state.",
    difficulty: "MEDIUM",
    examRelevance: 80,
  },
  {
    topic: "Memory Management",
    subtopic: "Page Replacement",
    text: "Which page replacement algorithm can exhibit Belady's anomaly (more frames leading to more page faults)?",
    options: ["FIFO", "LRU", "Optimal", "MRU"],
    correctIndex: 0,
    explanation:
      "FIFO is the only algorithm among these that can suffer from Belady's anomaly. LRU and Optimal never do.",
    difficulty: "HARD",
    examRelevance: 75,
  },
  {
    topic: "Memory Management",
    subtopic: "Paging",
    text: "A situation in which the system spends more time swapping pages in and out than executing is called:",
    options: ["Thrashing", "Fragmentation", "Spooling", "Pipelining"],
    correctIndex: 0,
    explanation:
      "Thrashing occurs when excessive paging leaves little time for actual execution.",
    difficulty: "MEDIUM",
    examRelevance: 75,
  },

  // ────────────────────────── Data Structures & Algorithms ──────────────────
  {
    topic: "Stacks & Queues",
    subtopic: "Stack Operations",
    text: "A stack follows which access order?",
    options: ["LIFO", "FIFO", "LILO", "Random access"],
    correctIndex: 0,
    explanation:
      "A stack is Last In First Out (LIFO) — the most recently added element is removed first.",
    difficulty: "EASY",
    examRelevance: 90,
  },
  {
    topic: "Stacks & Queues",
    subtopic: "Queue Types",
    text: "A queue follows which access order?",
    options: ["FIFO", "LIFO", "FILO", "Priority by size"],
    correctIndex: 0,
    explanation:
      "A queue is First In First Out (FIFO) — elements are removed in the order they were added.",
    difficulty: "EASY",
    examRelevance: 90,
  },
  {
    topic: "Stacks & Queues",
    subtopic: "Stack Operations",
    text: "Which operation removes and returns the topmost element of a stack?",
    options: ["Pop", "Push", "Peek", "Enqueue"],
    correctIndex: 0,
    explanation:
      "Push adds to the top, Pop removes from the top, Peek inspects without removing, and Enqueue adds to a queue.",
    difficulty: "EASY",
    examRelevance: 80,
  },
  {
    topic: "Stacks & Queues",
    subtopic: "Queue Types",
    text: "A circular queue is primarily used to:",
    options: [
      "Avoid the waste of storage space and unnecessary shifting",
      "Increase the processing speed of the CPU",
      "Implement recursion",
      "Sort elements in O(n log n)",
    ],
    correctIndex: 0,
    explanation:
      "A circular queue reuses the front positions, avoiding the 'queue full but space wasted' problem of a linear array queue.",
    difficulty: "MEDIUM",
    examRelevance: 70,
  },
  {
    topic: "Trees",
    subtopic: "BST",
    text: "Which traversal of a Binary Search Tree (BST) visits elements in sorted (ascending) order?",
    options: ["Inorder", "Preorder", "Postorder", "Level order"],
    correctIndex: 0,
    explanation:
      "Inorder traversal (left, root, right) of a BST yields elements in ascending order.",
    difficulty: "MEDIUM",
    examRelevance: 90,
  },
  {
    topic: "Trees",
    subtopic: "Traversals",
    text: "In which tree traversal is the root node visited before its left and right subtrees?",
    options: ["Preorder", "Inorder", "Postorder", "Reverse level order"],
    correctIndex: 0,
    explanation:
      "Preorder visits root, then left subtree, then right subtree (root-first).",
    difficulty: "MEDIUM",
    examRelevance: 80,
  },
  {
    topic: "Trees",
    subtopic: "Binary Trees",
    text: "The height of a perfectly balanced binary tree with n nodes is approximately:",
    options: ["log2(n)", "n", "n/2", "2n"],
    correctIndex: 0,
    explanation:
      "A balanced binary tree of height h holds about 2^(h+1) - 1 nodes, so height ≈ log2(n).",
    difficulty: "MEDIUM",
    examRelevance: 70,
  },
  {
    topic: "Sorting Algorithms",
    subtopic: "Comparison Sorts",
    text: "Which sorting algorithm has O(n log n) worst-case time complexity?",
    options: ["Merge sort", "Insertion sort", "Bubble sort", "Selection sort"],
    correctIndex: 0,
    explanation:
      "Merge sort guarantees O(n log n). Insertion, bubble and selection sorts are O(n^2) in the worst case.",
    difficulty: "HARD",
    examRelevance: 80,
  },
  {
    topic: "Sorting Algorithms",
    subtopic: "Comparison Sorts",
    text: "Which sorting algorithm runs in O(n) best-case time when the input is already nearly sorted?",
    options: ["Insertion sort", "Merge sort", "Heap sort", "Quick sort"],
    correctIndex: 0,
    explanation:
      "Insertion sort is adaptive: best case (already sorted) is O(n). Merge and heap sort are always O(n log n).",
    difficulty: "HARD",
    examRelevance: 75,
  },
  {
    topic: "Sorting Algorithms",
    subtopic: "Comparison Sorts",
    text: "What is the worst-case time complexity of Quick sort?",
    options: ["O(n^2)", "O(n log n)", "O(n)", "O(log n)"],
    correctIndex: 0,
    explanation:
      "Quick sort is O(n log n) on average but degrades to O(n^2) in the worst case (e.g. already sorted input with a poor pivot).",
    difficulty: "MEDIUM",
    examRelevance: 80,
  },
  {
    topic: "Searching Algorithms",
    subtopic: "Linear & Binary Search",
    text: "Binary search on an array requires that the array be:",
    options: ["Sorted", "Unsorted", "Sparse", "Linked"],
    correctIndex: 0,
    explanation:
      "Binary search halves the search space each step and only works correctly on a sorted array (or requires O(n log n) sort first).",
    difficulty: "MEDIUM",
    examRelevance: 90,
  },
  {
    topic: "Hashing",
    subtopic: "Collision Resolution",
    text: "Which technique resolves hash collisions by storing multiple records at the same index in a linked structure?",
    options: ["Separate chaining", "Linear probing", "Double hashing", "Binary search"],
    correctIndex: 0,
    explanation:
      "Separate chaining links colliding keys in a chain at the same slot. Linear probing and double hashing are open-addressing methods.",
    difficulty: "MEDIUM",
    examRelevance: 80,
  },

  // ────────────────────────── Database Management Systems ───────────────────
  {
    topic: "Relational Model & Keys",
    subtopic: "Keys & Constraints",
    text: "Which property must a primary key always satisfy?",
    options: [
      "Unique and NOT NULL",
      "Always a number",
      "Can be NULL for some rows",
      "Must be indexed externally",
    ],
    correctIndex: 0,
    explanation:
      "A primary key uniquely identifies each row and cannot contain NULL values.",
    difficulty: "MEDIUM",
    examRelevance: 90,
  },
  {
    topic: "Relational Model & Keys",
    subtopic: "Keys & Constraints",
    text: "Which constraint enforces referential integrity between two tables?",
    options: ["Foreign key", "Primary key", "CHECK", "DEFAULT"],
    correctIndex: 0,
    explanation:
      "A foreign key in one table references the primary key of another, enforcing referential integrity.",
    difficulty: "MEDIUM",
    examRelevance: 90,
  },
  {
    topic: "SQL",
    subtopic: "DDL & DML",
    text: "Which SQL statement is used to remove an entire table (structure and data)?",
    options: ["DROP TABLE", "DELETE TABLE", "REMOVE TABLE", "TRUNCATE ROW"],
    correctIndex: 0,
    explanation:
      "DROP TABLE deletes the table structure and all its data. DELETE removes rows only, keeping the table.",
    difficulty: "MEDIUM",
    examRelevance: 80,
  },
  {
    topic: "SQL",
    subtopic: "DDL & DML",
    text: "Which SQL clause eliminates duplicate rows from a result set?",
    options: ["DISTINCT", "UNIQUE", "FILTER", "GROUP BY"],
    correctIndex: 0,
    explanation:
      "SELECT DISTINCT returns only unique values. UNIQUE is a constraint, and GROUP BY groups rows.",
    difficulty: "MEDIUM",
    examRelevance: 80,
  },
  {
    topic: "SQL",
    subtopic: "Queries & Joins",
    text: "Which SQL aggregate function returns the highest value in a column?",
    options: ["MAX()", "TOP()", "LARGEST()", "HIGHEST()"],
    correctIndex: 0,
    explanation:
      "MAX() is the standard aggregate for the maximum value. There is no TOP()/LARGEST() aggregate function.",
    difficulty: "EASY",
    examRelevance: 80,
  },
  {
    topic: "Normalization",
    subtopic: "1NF to BCNF",
    text: "A relation is in Second Normal Form (2NF) if it is in 1NF and has:",
    options: [
      "No partial dependencies on the primary key",
      "No transitive dependencies",
      "Every determinant a candidate key",
      "No NULL values",
    ],
    correctIndex: 0,
    explanation:
      "2NF removes partial dependencies (non-key attributes dependent on part of a composite key). 3NF removes transitive dependencies; BCNF requires every determinant to be a candidate key.",
    difficulty: "MEDIUM",
    examRelevance: 90,
  },
  {
    topic: "Normalization",
    subtopic: "1NF to BCNF",
    text: "Which normal form specifically removes transitive dependency?",
    options: ["3NF", "1NF", "2NF", "0NF"],
    correctIndex: 0,
    explanation:
      "Third Normal Form (3NF) removes transitive dependencies (a non-key attribute depending on another non-key attribute).",
    difficulty: "MEDIUM",
    examRelevance: 90,
  },
  {
    topic: "Normalization",
    subtopic: "1NF to BCNF",
    text: "A relation is in Boyce-Codd Normal Form (BCNF) if it is in 3NF and additionally:",
    options: [
      "Every determinant is a candidate key",
      "All attributes are atomic",
      "No foreign keys",
      "It contains at most two columns",
    ],
    correctIndex: 0,
    explanation:
      "BCNF requires that every determinant (left side of a functional dependency) is a candidate key. It is stricter than 3NF.",
    difficulty: "HARD",
    examRelevance: 85,
  },
  {
    topic: "Transactions & Concurrency",
    subtopic: "ACID Properties",
    text: "The 'A' in ACID refers to:",
    options: [
      "Atomicity — a transaction is fully done or not at all",
      "Accessibility — data is always reachable",
      "Autonomy — transactions run independently",
      "Availability — the database never goes down",
    ],
    correctIndex: 0,
    explanation:
      "Atomicity guarantees that a transaction either completes fully or has no effect at all. C=Consistency, I=Isolation, D=Durability.",
    difficulty: "MEDIUM",
    examRelevance: 80,
  },
  {
    topic: "SQL",
    subtopic: "Queries & Joins",
    text: "Which JOIN returns all rows from the left table and the matching rows from the right table (with NULLs where no match exists)?",
    options: ["LEFT OUTER JOIN", "INNER JOIN", "CROSS JOIN", "SELF JOIN"],
    correctIndex: 0,
    explanation:
      "LEFT OUTER JOIN keeps every row of the left table, filling unmatched right-side columns with NULL.",
    difficulty: "MEDIUM",
    examRelevance: 75,
  },

  // ────────────────────────── Programming in C & C++ ────────────────────────
  {
    topic: "C Fundamentals",
    subtopic: "Data Types & Operators",
    text: "Which C data type is used to store whole numbers?",
    options: ["int", "float", "double", "char"],
    correctIndex: 0,
    explanation:
      "int stores integers. float and double store real numbers, and char stores a single character.",
    difficulty: "EASY",
    examRelevance: 85,
  },
  {
    topic: "C Fundamentals",
    subtopic: "Data Types & Operators",
    text: "In C, what does the % (modulo) operator return?",
    options: ["The remainder of division", "The quotient of division", "A percentage", "A pointer"],
    correctIndex: 0,
    explanation:
      "The modulo operator % returns the remainder, e.g. 10 % 3 = 1.",
    difficulty: "MEDIUM",
    examRelevance: 80,
  },
  {
    topic: "Control Structures",
    subtopic: "Loops & Conditionals",
    text: "Which loop in C is guaranteed to execute its body at least once?",
    options: ["do-while loop", "while loop", "for loop", "foreach loop"],
    correctIndex: 0,
    explanation:
      "A do-while loop checks the condition after the body, so it always runs at least once. (C has no foreach loop.)",
    difficulty: "MEDIUM",
    examRelevance: 85,
  },
  {
    topic: "C Fundamentals",
    subtopic: "Data Types & Operators",
    text: "What is the value of sizeof(char) in standard C?",
    options: ["1 byte", "2 bytes", "4 bytes", "Depends on the compiler"],
    correctIndex: 0,
    explanation:
      "In standard C, sizeof(char) is defined to be exactly 1 byte.",
    difficulty: "MEDIUM",
    examRelevance: 80,
  },
  {
    topic: "Arrays & Pointers",
    subtopic: "Pointers",
    text: "Which operator is used to access a structure member through a pointer in C?",
    options: ["-> (arrow)", ". (dot)", "::", "#"],
    correctIndex: 0,
    explanation:
      "ptr->member is equivalent to (*ptr).member. The dot operator is used with a structure value directly.",
    difficulty: "MEDIUM",
    examRelevance: 75,
  },
  {
    topic: "Arrays & Pointers",
    subtopic: "Dynamic Memory",
    text: "What does malloc() in C return?",
    options: ["A void* pointer", "An int", "A char", "NULL by default on success"],
    correctIndex: 0,
    explanation:
      "malloc() returns a void* to the allocated memory block, which is usually cast to the required type. It returns NULL only on failure.",
    difficulty: "MEDIUM",
    examRelevance: 75,
  },
  {
    topic: "Functions & Recursion",
    subtopic: "Function Calls",
    text: "A function that calls itself is called:",
    options: ["A recursive function", "An inline function", "A static function", "A friend function"],
    correctIndex: 0,
    explanation:
      "Recursion is the technique of a function calling itself, requiring a base case to terminate.",
    difficulty: "EASY",
    examRelevance: 80,
  },
  {
    topic: "OOP Concepts (C++)",
    subtopic: "Classes & Objects",
    text: "By default, members of a C++ class declared without an access specifier are:",
    options: ["private", "public", "protected", "external"],
    correctIndex: 0,
    explanation:
      "C++ class members default to private (unlike struct members, which default to public).",
    difficulty: "MEDIUM",
    examRelevance: 75,
  },
  {
    topic: "OOP Concepts (C++)",
    subtopic: "Inheritance & Polymorphism",
    text: "Function overloading is an example of which kind of polymorphism?",
    options: ["Compile-time polymorphism", "Run-time polymorphism", "Data polymorphism", "Structural polymorphism"],
    correctIndex: 0,
    explanation:
      "Function overloading is resolved at compile time (compile-time polymorphism). Virtual functions give run-time polymorphism.",
    difficulty: "MEDIUM",
    examRelevance: 75,
  },
  {
    topic: "OOP Concepts (C++)",
    subtopic: "Inheritance & Polymorphism",
    text: "Which OOP feature allows a new class to reuse and extend the members of an existing class?",
    options: ["Inheritance", "Encapsulation", "Abstraction", "Overloading"],
    correctIndex: 0,
    explanation:
      "Inheritance lets a derived class acquire the attributes and methods of a base class.",
    difficulty: "EASY",
    examRelevance: 85,
  },

  // ────────────────────────── Computer Networks ─────────────────────────────
  {
    topic: "Transport Layer",
    subtopic: "TCP & UDP",
    text: "Which transport-layer protocol is connection-oriented and provides reliable delivery?",
    options: ["TCP", "UDP", "IP", "ICMP"],
    correctIndex: 0,
    explanation:
      "TCP establishes a connection and guarantees ordered, reliable delivery. UDP is connectionless and unreliable.",
    difficulty: "EASY",
    examRelevance: 90,
  },
  {
    topic: "Transport Layer",
    subtopic: "TCP & UDP",
    text: "Which transport-layer protocol is connectionless and best suited for real-time streaming?",
    options: ["UDP", "TCP", "HTTP", "FTP"],
    correctIndex: 0,
    explanation:
      "UDP has low overhead and no connection setup, making it suitable for real-time applications where occasional loss is acceptable.",
    difficulty: "EASY",
    examRelevance: 85,
  },
  {
    topic: "OSI & TCP/IP Models",
    subtopic: "Layers",
    text: "How many layers are there in the OSI reference model?",
    options: ["7", "5", "4", "6"],
    correctIndex: 0,
    explanation:
      "The OSI model has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, Application.",
    difficulty: "EASY",
    examRelevance: 95,
  },
  {
    topic: "OSI & TCP/IP Models",
    subtopic: "Layers",
    text: "In the original TCP/IP model, how many layers are defined?",
    options: ["4", "7", "5", "3"],
    correctIndex: 0,
    explanation:
      "The original TCP/IP model has 4 layers: Link, Internet, Transport, Application.",
    difficulty: "MEDIUM",
    examRelevance: 80,
  },
  {
    topic: "Network Layer",
    subtopic: "Routing",
    text: "Which OSI layer is responsible for routing packets between networks?",
    options: ["Network layer", "Data link layer", "Transport layer", "Session layer"],
    correctIndex: 0,
    explanation:
      "The Network layer (Layer 3) handles logical addressing and routing. The data link layer forwards frames on a single link.",
    difficulty: "MEDIUM",
    examRelevance: 85,
  },
  {
    topic: "Network Layer",
    subtopic: "IP Addressing",
    text: "How many bits are in an IPv4 address?",
    options: ["32 bits", "64 bits", "48 bits", "128 bits"],
    correctIndex: 0,
    explanation:
      "IPv4 addresses are 32 bits, normally written as four 8-bit octets. IPv6 uses 128 bits.",
    difficulty: "MEDIUM",
    examRelevance: 90,
  },
  {
    topic: "Network Layer",
    subtopic: "IP Addressing",
    text: "How many bits are in an IPv6 address?",
    options: ["128 bits", "32 bits", "64 bits", "256 bits"],
    correctIndex: 0,
    explanation:
      "IPv6 uses 128-bit addresses, written in eight groups of four hex digits.",
    difficulty: "MEDIUM",
    examRelevance: 85,
  },
  {
    topic: "Network Fundamentals",
    subtopic: "Topologies & Devices",
    text: "Which network device operates at the data link layer (Layer 2) of the OSI model?",
    options: ["Switch", "Router", "Hub", "Repeater"],
    correctIndex: 0,
    explanation:
      "A switch works at Layer 2, forwarding frames using MAC addresses. A router works at Layer 3 using IP addresses.",
    difficulty: "MEDIUM",
    examRelevance: 75,
  },
  {
    topic: "Application Layer Protocols",
    subtopic: "Ports",
    text: "HTTP traffic commonly uses which port number?",
    options: ["80", "25", "443", "21"],
    correctIndex: 0,
    explanation:
      "HTTP uses port 80. HTTPS uses 443, SMTP uses 25, and FTP uses 21.",
    difficulty: "EASY",
    examRelevance: 85,
  },
  {
    topic: "Application Layer Protocols",
    subtopic: "HTTP, DNS",
    text: "Which protocol is used to translate a domain name into an IP address?",
    options: ["DNS", "DHCP", "FTP", "SMTP"],
    correctIndex: 0,
    explanation:
      "The Domain Name System (DNS) resolves human-readable domain names to IP addresses.",
    difficulty: "MEDIUM",
    examRelevance: 85,
  },
  {
    topic: "Network Fundamentals",
    subtopic: "Topologies & Devices",
    text: "What is the size of a standard MAC address?",
    options: ["48 bits", "32 bits", "64 bits", "16 bits"],
    correctIndex: 0,
    explanation:
      "MAC (physical) addresses are 48 bits, usually written as six hexadecimal pairs.",
    difficulty: "MEDIUM",
    examRelevance: 75,
  },

  // ────────────────────────── Software Engineering ──────────────────────────
  {
    topic: "SDLC & Models",
    subtopic: "Waterfall Model",
    text: "Which is the correct first phase of the Software Development Life Cycle (SDLC)?",
    options: ["Requirement analysis", "Coding", "Testing", "Deployment"],
    correctIndex: 0,
    explanation:
      "SDLC begins with requirement gathering/analysis, followed by design, implementation, testing, deployment and maintenance.",
    difficulty: "MEDIUM",
    examRelevance: 85,
  },
  {
    topic: "SDLC & Models",
    subtopic: "Waterfall Model",
    text: "The Waterfall model is also known as:",
    options: ["Linear sequential model", "Spiral model", "Incremental model", "Iterative model"],
    correctIndex: 0,
    explanation:
      "The Waterfall model proceeds in strict linear phases and is therefore called the linear-sequential (or classic) life cycle model.",
    difficulty: "MEDIUM",
    examRelevance: 75,
  },
  {
    topic: "SDLC & Models",
    subtopic: "Agile",
    text: "Which development approach emphasizes iterative delivery and close collaboration with customers?",
    options: ["Agile", "Waterfall", "Big bang", "V-model"],
    correctIndex: 0,
    explanation:
      "Agile delivers in small increments with continuous feedback, unlike the strictly sequential Waterfall model.",
    difficulty: "MEDIUM",
    examRelevance: 75,
  },
  {
    topic: "Software Testing",
    subtopic: "Testing Levels",
    text: "Which level of testing verifies individual modules in isolation?",
    options: ["Unit testing", "System testing", "Acceptance testing", "Integration testing"],
    correctIndex: 0,
    explanation:
      "Unit testing checks each module separately. Integration testing combines modules, and acceptance testing validates against user requirements.",
    difficulty: "MEDIUM",
    examRelevance: 85,
  },
  {
    topic: "Software Testing",
    subtopic: "Black-box & White-box",
    text: "Black-box testing focuses on:",
    options: [
      "Inputs and outputs without knowledge of internal code",
      "Internal code paths and branches",
      "Database schema design",
      "Network configuration",
    ],
    correctIndex: 0,
    explanation:
      "Black-box testing validates behaviour from inputs and expected outputs without looking inside the implementation.",
    difficulty: "MEDIUM",
    examRelevance: 70,
  },
  {
    topic: "Software Design",
    subtopic: "Coupling & Cohesion",
    text: "Coupling between modules is a measure of:",
    options: [
      "The degree of interdependence between modules",
      "How well a module hides its internals",
      "The number of lines in a module",
      "The size of the test suite",
    ],
    correctIndex: 0,
    explanation:
      "Coupling measures interdependence between modules (low coupling is desirable). Cohesion measures how related the elements inside one module are.",
    difficulty: "HARD",
    examRelevance: 70,
  },

  // ────────────────────────── Internet & Web Technologies ───────────────────
  {
    topic: "HTML & CSS",
    subtopic: "HTML Elements",
    text: "Which language is used to define the structure and content of a web page?",
    options: ["HTML", "CSS", "SQL", "Assembly"],
    correctIndex: 0,
    explanation:
      "HTML structures web content; CSS handles presentation/styling.",
    difficulty: "EASY",
    examRelevance: 90,
  },
  {
    topic: "HTML & CSS",
    subtopic: "HTML Elements",
    text: "Which HTML tag is used to create a hyperlink?",
    options: ["<a>", "<link>", "<href>", "<url>"],
    correctIndex: 0,
    explanation:
      "The <a> (anchor) tag creates hyperlinks: <a href=\"...\">. <link> is used in the head for stylesheets.",
    difficulty: "EASY",
    examRelevance: 85,
  },
  {
    topic: "HTML & CSS",
    subtopic: "HTML Elements",
    text: "Which HTML tag represents the largest heading?",
    options: ["<h1>", "<h6>", "<heading>", "<p>"],
    correctIndex: 0,
    explanation:
      "<h1> is the largest heading level and <h6> the smallest.",
    difficulty: "EASY",
    examRelevance: 85,
  },
  {
    topic: "HTML & CSS",
    subtopic: "HTML Elements",
    text: "Which attribute specifies the image file in the <img> tag?",
    options: ["src", "href", "alt", "link"],
    correctIndex: 0,
    explanation:
      "src sets the image source URL. alt provides alternative text and href is used on anchors.",
    difficulty: "MEDIUM",
    examRelevance: 80,
  },
  {
    topic: "HTML & CSS",
    subtopic: "HTML Elements",
    text: "CSS is primarily used for:",
    options: ["Styling and layout", "Database queries", "Server-side logic", "Compiling code"],
    correctIndex: 0,
    explanation:
      "Cascading Style Sheets control the presentation — colours, fonts, spacing and layout — of HTML documents.",
    difficulty: "EASY",
    examRelevance: 90,
  },
  {
    topic: "JavaScript",
    subtopic: "Client-side Scripting",
    text: "Which language is executed by the browser on the client side to add interactivity?",
    options: ["JavaScript", "C++", "Java (server-only)", "SQL"],
    correctIndex: 0,
    explanation:
      "JavaScript runs in the browser to handle interactivity. C++ compiles to native code; SQL is for databases.",
    difficulty: "EASY",
    examRelevance: 85,
  },
  {
    topic: "Web Protocols",
    subtopic: "HTTP & HTTPS",
    text: "Which port is used by HTTPS by default?",
    options: ["443", "80", "8080", "25"],
    correctIndex: 0,
    explanation:
      "HTTPS (HTTP over TLS) uses port 443 by default.",
    difficulty: "MEDIUM",
    examRelevance: 80,
  },
  {
    topic: "Web Protocols",
    subtopic: "HTTP & HTTPS",
    text: "Which protocol is used to transfer web pages over the internet?",
    options: ["HTTP", "SMTP", "FTP", "SNMP"],
    correctIndex: 0,
    explanation:
      "HTTP (HyperText Transfer Protocol) transfers web documents. SMTP is for email, FTP for file transfer.",
    difficulty: "MEDIUM",
    examRelevance: 85,
  },
];
