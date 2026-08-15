// Curated external reading ("net article sources") per topic. Every URL below is
// a well-known, stable reference (Wikipedia, GeeksforGeeks, W3Schools, Oracle,
// official docs). No guessed or fabricated links. Topic names match the syllabus
// seed exactly; any topic without an entry simply renders an empty state.

export interface TopicSourceSeed {
  title: string;
  url: string;
  author?: string;
  description?: string;
}

export const TOPIC_SOURCES: Record<string, TopicSourceSeed[]> = {
  "Computer Basics": [
    { title: "Computer — Wikipedia", url: "https://en.wikipedia.org/wiki/Computer", author: "Wikipedia", description: "History, classification and components of computers." },
    { title: "Computer Fundamentals — GeeksforGeeks", url: "https://www.geeksforgeeks.org/computer-fundamentals-tutorial/", author: "GeeksforGeeks", description: "Generation of computers, hardware and software basics." },
  ],
  "Number Systems & Codes": [
    { title: "Numeral system — Wikipedia", url: "https://en.wikipedia.org/wiki/Numeral_system", author: "Wikipedia", description: "Decimal, binary, octal, hexadecimal and conversions." },
    { title: "Number System in Digital Electronics — GeeksforGeeks", url: "https://www.geeksforgeeks.org/number-system-in-digital-electronics/", author: "GeeksforGeeks", description: "Conversions and 1's/2's complement arithmetic." },
  ],
  "Boolean Algebra & Logic Gates": [
    { title: "Boolean algebra — Wikipedia", url: "https://en.wikipedia.org/wiki/Boolean_algebra", author: "Wikipedia", description: "Laws, theorems and simplification of Boolean expressions." },
    { title: "Logic gates — Wikipedia", url: "https://en.wikipedia.org/wiki/Logic_gate", author: "Wikipedia", description: "AND, OR, NOT, NAND, NOR, XOR and truth tables." },
  ],
  "Computer Organization": [
    { title: "Computer architecture — Wikipedia", url: "https://en.wikipedia.org/wiki/Computer_architecture", author: "Wikipedia", description: "CPU, ALU, control unit, registers and buses." },
    { title: "Computer Organization and Architecture Tutorials — GeeksforGeeks", url: "https://www.geeksforgeeks.org/computer-organization-and-architecture-tutorials/", author: "GeeksforGeeks", description: "Instruction cycle, memory hierarchy and I/O techniques." },
  ],
  "Memory & Storage": [
    { title: "Computer memory — Wikipedia", url: "https://en.wikipedia.org/wiki/Computer_memory", author: "Wikipedia", description: "Memory hierarchy, RAM, ROM and storage units." },
    { title: "Memory Hierarchy Design and its Characteristics — GeeksforGeeks", url: "https://www.geeksforgeeks.org/memory-hierarchy-design-and-its-characteristics/", author: "GeeksforGeeks", description: "Cache, main and secondary memory characteristics." },
  ],
  "OS Fundamentals": [
    { title: "Operating system — Wikipedia", url: "https://en.wikipedia.org/wiki/Operating_system", author: "Wikipedia", description: "Functions and organization of an operating system." },
    { title: "Operating Systems Tutorial — GeeksforGeeks", url: "https://www.geeksforgeeks.org/operating-systems/", author: "GeeksforGeeks", description: "Process, memory, file and device management overview." },
  ],
  "Process Management": [
    { title: "Process (computing) — Wikipedia", url: "https://en.wikipedia.org/wiki/Process_(computing)", author: "Wikipedia", description: "Process states, PCB, threads and context switch." },
    { title: "Process states in Operating System — GeeksforGeeks", url: "https://www.geeksforgeeks.org/states-of-a-process-in-operating-systems/", author: "GeeksforGeeks", description: "New, ready, running, blocked and terminated states." },
  ],
  "CPU Scheduling": [
    { title: "Scheduling (computing) — Wikipedia", url: "https://en.wikipedia.org/wiki/Scheduling_(computing)", author: "Wikipedia", description: "FCFS, SJF, Round Robin and priority scheduling." },
    { title: "CPU Scheduling in Operating Systems — GeeksforGeeks", url: "https://www.geeksforgeeks.org/cpu-scheduling-in-operating-systems/", author: "GeeksforGeeks", description: "Scheduling criteria, algorithms and examples." },
  ],
  "Process Synchronization": [
    { title: "Synchronization (computer science) — Wikipedia", url: "https://en.wikipedia.org/wiki/Synchronization_(computer_science)", author: "Wikipedia", description: "Semaphores, mutexes and the critical-section problem." },
    { title: "Semaphores in Operating System — GeeksforGeeks", url: "https://www.geeksforgeeks.org/semaphores-in-process-synchronization/", author: "GeeksforGeeks", description: "Binary/counting semaphores and producer-consumer." },
  ],
  Deadlocks: [
    { title: "Deadlock — Wikipedia", url: "https://en.wikipedia.org/wiki/Deadlock", author: "Wikipedia", description: "Necessary conditions and handling strategies." },
    { title: "Banker's algorithm — Wikipedia", url: "https://en.wikipedia.org/wiki/Banker%27s_algorithm", author: "Wikipedia", description: "Deadlock avoidance with the Banker's algorithm." },
  ],
  "Memory Management": [
    { title: "Memory management (operating systems) — Wikipedia", url: "https://en.wikipedia.org/wiki/Memory_management_(operating_systems)", author: "Wikipedia", description: "Paging, segmentation and fragmentation." },
    { title: "Page replacement algorithms — GeeksforGeeks", url: "https://www.geeksforgeeks.org/page-replacement-algorithms-in-operating-systems/", author: "GeeksforGeeks", description: "FIFO, LRU, Optimal and Belady's anomaly." },
  ],
  "File Systems": [
    { title: "File system — Wikipedia", url: "https://en.wikipedia.org/wiki/File_system", author: "Wikipedia", description: "Directory structure and file allocation methods." },
    { title: "File Systems in Operating System — GeeksforGeeks", url: "https://www.geeksforgeeks.org/file-systems-in-operating-system/", author: "GeeksforGeeks", description: "File attributes, operations and allocation." },
  ],
  "Arrays & Strings": [
    { title: "Array (data structure) — Wikipedia", url: "https://en.wikipedia.org/wiki/Array_(data_structure)", author: "Wikipedia", description: "Array operations, addressing and multi-dimensional arrays." },
    { title: "Arrays in C/C++ — GeeksforGeeks", url: "https://www.geeksforgeeks.org/arrays-in-c-cpp/", author: "GeeksforGeeks", description: "Declaration, initialization and string handling." },
  ],
  "Linked Lists": [
    { title: "Linked list — Wikipedia", url: "https://en.wikipedia.org/wiki/Linked_list", author: "Wikipedia", description: "Singly, doubly and circular linked lists." },
    { title: "Linked List Data Structure — GeeksforGeeks", url: "https://www.geeksforgeeks.org/data-structures/linked-list/", author: "GeeksforGeeks", description: "Insertion, deletion, traversal and reversal." },
  ],
  "Stacks & Queues": [
    { title: "Stack (abstract data type) — Wikipedia", url: "https://en.wikipedia.org/wiki/Stack_(abstract_data_type)", author: "Wikipedia", description: "LIFO, push/pop and applications." },
    { title: "Queue (abstract data type) — Wikipedia", url: "https://en.wikipedia.org/wiki/Queue_(abstract_data_type)", author: "Wikipedia", description: "FIFO, circular queue and deque." },
  ],
  Trees: [
    { title: "Tree (data structure) — Wikipedia", url: "https://en.wikipedia.org/wiki/Tree_(data_structure)", author: "Wikipedia", description: "Binary trees, BST and traversals." },
    { title: "Binary Search Tree — GeeksforGeeks", url: "https://www.geeksforgeeks.org/binary-search-tree-data-structure/", author: "GeeksforGeeks", description: "Insert, search, delete and properties of BST." },
  ],
  Graphs: [
    { title: "Graph (discrete mathematics) — Wikipedia", url: "https://en.wikipedia.org/wiki/Graph_(discrete_mathematics)", author: "Wikipedia", description: "Graph representations, BFS and DFS." },
    { title: "Graph Data Structure — GeeksforGeeks", url: "https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/", author: "GeeksforGeeks", description: "Adjacency list/matrix, traversal and shortest paths." },
  ],
  "Sorting Algorithms": [
    { title: "Sorting algorithm — Wikipedia", url: "https://en.wikipedia.org/wiki/Sorting_algorithm", author: "Wikipedia", description: "Bubble, selection, insertion, merge, quick and heap sort." },
    { title: "Sorting Algorithms — GeeksforGeeks", url: "https://www.geeksforgeeks.org/sorting-algorithms/", author: "GeeksforGeeks", description: "Stability, complexity and comparisons." },
  ],
  "Searching Algorithms": [
    { title: "Search algorithm — Wikipedia", url: "https://en.wikipedia.org/wiki/Search_algorithm", author: "Wikipedia", description: "Linear and binary search." },
    { title: "Linear Search vs Binary Search — GeeksforGeeks", url: "https://www.geeksforgeeks.org/linear-search-vs-binary-search/", author: "GeeksforGeeks", description: "Complexities and when to use each." },
  ],
  Hashing: [
    { title: "Hash table — Wikipedia", url: "https://en.wikipedia.org/wiki/Hash_table", author: "Wikipedia", description: "Hash functions, collision resolution and load factor." },
    { title: "Hashing Data Structure — GeeksforGeeks", url: "https://www.geeksforgeeks.org/hashing-data-structure/", author: "GeeksforGeeks", description: "Chaining, open addressing and rehashing." },
  ],
  "DBMS Basics": [
    { title: "Database — Wikipedia", url: "https://en.wikipedia.org/wiki/Database", author: "Wikipedia", description: "DBMS concepts, data models and architecture." },
    { title: "Introduction of DBMS — GeeksforGeeks", url: "https://www.geeksforgeeks.org/introduction-of-dbms-database-management-system-set-1/", author: "GeeksforGeeks", description: "Advantages, three-schema architecture and independence." },
  ],
  "Relational Model & Keys": [
    { title: "Relational model — Wikipedia", url: "https://en.wikipedia.org/wiki/Relational_model", author: "Wikipedia", description: "Tables, tuples, attributes, keys and integrity." },
    { title: "Types of Keys in Relational Model — GeeksforGeeks", url: "https://www.geeksforgeeks.org/types-of-keys-in-relational-model-candidate-super-primary-alternate-and-foreign/", author: "GeeksforGeeks", description: "Candidate, super, primary, alternate and foreign keys." },
  ],
  SQL: [
    { title: "SQL — Wikipedia", url: "https://en.wikipedia.org/wiki/SQL", author: "Wikipedia", description: "DDL, DML, DQL and DCL statements." },
    { title: "SQL Tutorial — W3Schools", url: "https://www.w3schools.com/sql/", author: "W3Schools", description: "SELECT, JOIN, GROUP BY, subqueries and functions." },
  ],
  Normalization: [
    { title: "Database normalization — Wikipedia", url: "https://en.wikipedia.org/wiki/Database_normalization", author: "Wikipedia", description: "1NF, 2NF, 3NF and BCNF." },
    { title: "Normal Forms in DBMS — GeeksforGeeks", url: "https://www.geeksforgeeks.org/normal-forms-in-dbms/", author: "GeeksforGeeks", description: "Anomalies and normalization examples." },
  ],
  "Transactions & Concurrency": [
    { title: "Database transaction — Wikipedia", url: "https://en.wikipedia.org/wiki/Database_transaction", author: "Wikipedia", description: "ACID properties and transaction states." },
    { title: "Concurrency Control in DBMS — GeeksforGeeks", url: "https://www.geeksforgeeks.org/concurrency-control-in-dbms/", author: "GeeksforGeeks", description: "Locks, isolation levels and schedules." },
  ],
  "C Fundamentals": [
    { title: "C (programming language) — Wikipedia", url: "https://en.wikipedia.org/wiki/C_(programming_language)", author: "Wikipedia", description: "Data types, operators and program structure." },
    { title: "C Programming Language — GeeksforGeeks", url: "https://www.geeksforgeeks.org/c-programming-language/", author: "GeeksforGeeks", description: "Basics, decision control and loops." },
  ],
  "Control Structures": [
    { title: "Control flow — Wikipedia", url: "https://en.wikipedia.org/wiki/Control_flow", author: "Wikipedia", description: "if, switch, for, while and do-while." },
    { title: "Decision Making in C — GeeksforGeeks", url: "https://www.geeksforgeeks.org/decision-making-c-cpp/", author: "GeeksforGeeks", description: "if-else, switch and ternary operators." },
  ],
  "Functions & Recursion": [
    { title: "Subroutine — Wikipedia", url: "https://en.wikipedia.org/wiki/Subroutine", author: "Wikipedia", description: "Call by value/reference and the stack." },
    { title: "Recursion — GeeksforGeeks", url: "https://www.geeksforgeeks.org/recursion/", author: "GeeksforGeeks", description: "Base case, recursion tree and examples." },
  ],
  "Arrays & Pointers": [
    { title: "Pointer (computer programming) — Wikipedia", url: "https://en.wikipedia.org/wiki/Pointer_(computer_programming)", author: "Wikipedia", description: "Pointer arithmetic and arrays of pointers." },
    { title: "Pointers in C — GeeksforGeeks", url: "https://www.geeksforgeeks.org/pointers-in-c-and-c-set-1-introduction-arithmetic-and-array/", author: "GeeksforGeeks", description: "Pointer basics and array-pointer equivalence." },
  ],
  "Structures & Unions": [
    { title: "Struct (C programming language) — Wikipedia", url: "https://en.wikipedia.org/wiki/Struct_(C_programming_language)", author: "Wikipedia", description: "Structures, unions and memory layout." },
    { title: "Structures in C — GeeksforGeeks", url: "https://www.geeksforgeeks.org/structures-c/", author: "GeeksforGeeks", description: "Declaration, initialization, nested structures and unions." },
  ],
  "OOP Concepts (C++)": [
    { title: "Object-oriented programming — Wikipedia", url: "https://en.wikipedia.org/wiki/Object-oriented_programming", author: "Wikipedia", description: "Classes, objects, inheritance, polymorphism, encapsulation." },
    { title: "Object Oriented Programming in C++ — GeeksforGeeks", url: "https://www.geeksforgeeks.org/object-oriented-programming-in-cpp/", author: "GeeksforGeeks", description: "Access modifiers, constructors, overloading, templates, STL." },
  ],
  "Network Fundamentals": [
    { title: "Computer network — Wikipedia", url: "https://en.wikipedia.org/wiki/Computer_network", author: "Wikipedia", description: "LAN, MAN, WAN, topologies and transmission media." },
    { title: "Basics of Computer Networking — GeeksforGeeks", url: "https://www.geeksforgeeks.org/basics-computer-networking/", author: "GeeksforGeeks", description: "Network devices, modes and data communication." },
  ],
  "OSI & TCP/IP Models": [
    { title: "OSI model — Wikipedia", url: "https://en.wikipedia.org/wiki/OSI_model", author: "Wikipedia", description: "The seven layers and their functions." },
    { title: "TCP/IP Model — GeeksforGeeks", url: "https://www.geeksforgeeks.org/tcp-ip-model/", author: "GeeksforGeeks", description: "Application, transport, internet and network access layers." },
  ],
  "Network Layer": [
    { title: "Internet Protocol — Wikipedia", url: "https://en.wikipedia.org/wiki/Internet_Protocol", author: "Wikipedia", description: "IPv4, IPv6, addressing and subnetting." },
    { title: "IP Addressing and Subnetting — GeeksforGeeks", url: "https://www.geeksforgeeks.org/what-is-subnetting/", author: "GeeksforGeeks", description: "IP classes, subnet masks and CIDR." },
  ],
  "Transport Layer": [
    { title: "Transmission Control Protocol — Wikipedia", url: "https://en.wikipedia.org/wiki/Transmission_Control_Protocol", author: "Wikipedia", description: "TCP segments, handshake and reliability." },
    { title: "TCP vs UDP — GeeksforGeeks", url: "https://www.geeksforgeeks.org/differences-tcp-udp/", author: "GeeksforGeeks", description: "Comparison of connection-oriented vs connectionless transport." },
  ],
  "Application Layer Protocols": [
    { title: "Application layer — Wikipedia", url: "https://en.wikipedia.org/wiki/Application_layer", author: "Wikipedia", description: "HTTP, FTP, SMTP, DNS and their roles." },
    { title: "HTTP — Wikipedia", url: "https://en.wikipedia.org/wiki/HTTP", author: "Wikipedia", description: "Request/response model and status codes." },
  ],
  "SDLC & Models": [
    { title: "Software development process — Wikipedia", url: "https://en.wikipedia.org/wiki/Software_development_process", author: "Wikipedia", description: "Waterfall, spiral, agile and RAD models." },
    { title: "Software Engineering Tutorial — GeeksforGeeks", url: "https://www.geeksforgeeks.org/software-engineering/", author: "GeeksforGeeks", description: "SDLC phases, SRS and design." },
  ],
  "Software Testing": [
    { title: "Software testing — Wikipedia", url: "https://en.wikipedia.org/wiki/Software_testing", author: "Wikipedia", description: "Unit, integration, system and acceptance testing." },
    { title: "Levels of Software Testing — GeeksforGeeks", url: "https://www.geeksforgeeks.org/levels-of-software-testing/", author: "GeeksforGeeks", description: "White-box vs black-box and test levels." },
  ],
  "Software Design": [
    { title: "Software design — Wikipedia", url: "https://en.wikipedia.org/wiki/Software_design", author: "Wikipedia", description: "Architectural and detailed design." },
    { title: "Software Design Process — GeeksforGeeks", url: "https://www.geeksforgeeks.org/software-design-process/", author: "GeeksforGeeks", description: "Design concepts, principles and diagrams." },
  ],
  "HTML & CSS": [
    { title: "HTML — Wikipedia", url: "https://en.wikipedia.org/wiki/HTML", author: "Wikipedia", description: "Elements, attributes and document structure." },
    { title: "HTML Tutorial — W3Schools", url: "https://www.w3schools.com/html/", author: "W3Schools", description: "HTML and CSS basics with examples." },
    { title: "CSS — Wikipedia", url: "https://en.wikipedia.org/wiki/CSS", author: "Wikipedia", description: "Selectors, box model and layout." },
  ],
  JavaScript: [
    { title: "JavaScript — Wikipedia", url: "https://en.wikipedia.org/wiki/JavaScript", author: "Wikipedia", description: "The language, DOM and event model." },
    { title: "JavaScript Tutorial — W3Schools", url: "https://www.w3schools.com/js/", author: "W3Schools", description: "JS fundamentals with interactive examples." },
  ],
  "Web Protocols": [
    { title: "HTTPS — Wikipedia", url: "https://en.wikipedia.org/wiki/HTTPS", author: "Wikipedia", description: "HTTP over TLS and secure browsing." },
    { title: "What is DNS? — Cloudflare", url: "https://www.cloudflare.com/learning/dns/what-is-dns/", author: "Cloudflare", description: "How domain name resolution works." },
  ],
};
