// Phase 3 Study module content: concise, exam-focused notes per topic.
// Keyed by subject name -> topic name -> list of notes. `body` is newline-
// separated bullet lines; for COMPARISON notes the first line is the table
// header and following lines are rows (cells joined with " || ").
//
// Everything here is original, written-for-MCQure material (never fabricated
// as PYQ content).

export type SeedStudyKind =
  | "CONCEPT_NOTES"
  | "MNEMONICS"
  | "EXAM_TRAPS"
  | "COMPARISON"
  | "QUICK_SUMMARY";

export interface SeedStudyNote {
  kind: SeedStudyKind;
  title: string;
  body: string;
}

type SubjectStudy = Record<string, SeedStudyNote[]>;

export const STUDY_NOTES: Record<string, SubjectStudy> = {
  "Computer Fundamentals & Architecture": {
    "Computer Basics": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Generations: 1st vacuum tubes, 2nd transistors, 3rd ICs, 4th microprocessors, 5th AI / parallel processing.
Von Neumann architecture: stored-program concept — instructions and data share one memory.
System bus = data bus + address bus + control bus.
System software (OS, compilers, assemblers) vs application software (word processors, browsers).
A bit is the smallest unit; 8 bits = 1 byte; 1024 bytes = 1 KB.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `Generations 1-4: "Vacuum, Transistor, IC, Micro" — V-T-I-M, like the four upgrades of a machine's heart.
System bus trio: "DAC" — Data, Address, Control.`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `4th generation = microprocessors (NOT transistors — that is 2nd generation).
1st generation machines used vacuum tubes and magnetic drums, not keyboards/monitors.
2nd generation (transistors) is when high-level languages like FORTRAN/COBOL appeared.`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `5 generations: tubes → transistors → ICs → microprocessors → AI/parallel.
Von Neumann: single memory for instructions + data (stored program).
Bus: Data (moves data), Address (carries address), Control (co-ordinates).
Compiler/assembler/OS = system software; browsers/apps = application software.`,
      },
    ],
    "Number Systems & Codes": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Bases: binary (2), octal (8), decimal (10), hexadecimal (16).
2's complement range for n bits: -(2^(n-1)) to +(2^(n-1) - 1).
2's complement = invert all bits then add 1; MSB is the sign bit.
BCD: each decimal digit stored in 4 bits; 1010-1111 are invalid BCD.
ASCII: 7-bit (0-127); 'A'=65, 'a'=97, '0'=48.
Gray code: consecutive values differ in exactly one bit.
1's complement of n bits: flip all bits; range -(2^(n-1) - 1) to +(2^(n-1) - 1), has two zeros.`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `BCD 1010 is invalid, but the same bit pattern is valid hex A — don't mix the two.
-0 exists in 1's complement but not in 2's complement.
'0' = 48, 'A' = 65, 'a' = 97 — memorize the gaps (A→a is 32).`,
      },
      {
        kind: "COMPARISON",
        title: "1's vs 2's complement",
        body: `Feature || 1's complement || 2's complement
Definition || Flip every bit || Flip every bit + 1
Range (n bits) || -(2^(n-1)-1) to +(2^(n-1)-1) || -(2^(n-1)) to +(2^(n-1)-1)
Number of zeros || Two (+0, -0) || One
Addition end-around carry || Required || Not required
Subtraction || More complex || Simple (add 2's complement)`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Octal digit = 3 binary bits; hex digit = 4 binary bits (0-9, A-F).
2's complement: invert + add 1; used because it has a single zero and simplifies arithmetic.
BCD = 4 bits per decimal digit; max valid digit is 9.
ASCII values: '0'=48, 'A'=65, 'a'=97.`,
      },
    ],
    "Boolean Algebra & Logic Gates": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Basic gates: AND, OR, NOT. Universal gates: NAND, NOR (can build every other gate).
XOR outputs 1 when inputs differ (odd-parity detector); XNOR = equality.
De Morgan's laws: NOT(A AND B) = (NOT A) OR (NOT B); NOT(A OR B) = (NOT A) AND (NOT B).
Identity law: A+0=A, A*1=A; complement: A+NOT A=1, A*NOT A=0; absorption: A+(A*B)=A.
XOR of n inputs = 1 when an odd number of inputs are 1.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `De Morgan: "break the bar, change the sign" — complement everything and swap AND/OR.
Universal gates: "NAND + NOR = build everything".`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `NAND is NOT "NOT of OR" — NAND = NOT of AND. NOR = NOT of OR.
XNOR outputs 1 when inputs are EQUAL; XOR when they DIFFER.
XOR and XNOR are NOT universal gates.
3-input XOR: output 1 for odd number of 1s (1,1,1 gives 1).`,
      },
      {
        kind: "COMPARISON",
        title: "Gate reference table",
        body: `Gate || Output 1 when || Symbol property
AND || All inputs 1 || Multiplication
OR || At least one input 1 || Addition
NAND || NOT all inputs 1 || Universal
NOR || All inputs 0 || Universal
XOR || Odd number of 1s || Parity checker
XNOR || Even number of 1s (equal) || Equality check`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `AND/OR/NOT basic; NAND/NOR universal; XOR/XNOR used for parity and equality.
De Morgan: break the bar, flip the operator, complement each term.
Simplify with identity, complement, idempotent (A+A=A, A*A=A) and absorption laws.`,
      },
    ],
    "Computer Organization": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `CPU = ALU + Control Unit + Registers.
Key registers: MAR (address), MBR/MDR (data), PC (next instruction), IR (current instruction), AC (accumulator).
Instruction cycle: fetch → decode → execute.
Control unit: hardwired (fast, fixed) vs microprogrammed (flexible).
Interrupts let I/O devices grab the CPU; vector table stores handler addresses.
RISC: few simple instructions, load/store, pipelining-friendly. CISC: complex instructions, fewer steps per task.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `"PC points, IR holds": PC = next instruction address, IR = current instruction.
"MAR = Memory Address, MDR = Memory Data" — address vs data register.`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `MAR holds an ADDRESS; MDR/MBR holds DATA (often one MDR = one memory word).
PC points to the NEXT instruction, not the current one.
ALU performs arithmetic/logic; the Control Unit does NOT compute — it directs.`,
      },
      {
        kind: "COMPARISON",
        title: "RISC vs CISC",
        body: `Feature || RISC || CISC
Instruction set || Few, simple, fixed-length || Many, complex, variable-length
Addressing modes || Few || Many
Registers || More (general purpose) || Fewer (specialized)
Typical execution || 1 cycle per instruction || Multiple cycles
Pipelining || Easy || Hard
Example || ARM, RISC-V || x86`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `CPU = ALU (compute) + CU (direct) + registers (fast storage).
Registers: PC/IR/MAR/MDR/AC — know each role.
Cycle: fetch (PC→MAR→MDR→IR) then decode then execute.
Interrupts improve CPU utilization; DMA lets devices transfer without CPU.`,
      },
    ],
    "Memory & Storage": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Hierarchy (top to bottom): registers → cache → RAM → secondary storage (SSD/HDD).
Speed and cost decrease down the hierarchy; capacity increases.
SRAM: fast, flip-flops, used for cache. DRAM: slower, capacitors, used for main memory, needs refresh.
Cache exploits locality of reference; hit ratio = fraction of accesses served by cache.
Primary memory (RAM, ROM) is directly accessible by CPU; secondary (SSD, HDD) is not.
Volatile: registers, cache, RAM. Non-volatile: ROM, SSD, HDD.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `"SRAM = Static (flip-flops), DRAM = Dynamic (refreshed)".
"Cache is the CPU's short-term memory — volatile like RAM."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `CACHE IS VOLATILE — only ROM/SSD/HDD survive power loss among common chips.
SSD is SECONDARY storage, not primary, even though it is fast.
Registers are the fastest but smallest; they are part of the CPU, not memory hierarchy per se.`,
      },
      {
        kind: "COMPARISON",
        title: "Primary vs Secondary memory",
        body: `Feature || Primary (RAM/ROM) || Secondary (SSD/HDD)
CPU access || Direct || Indirect (via I/O)
Speed || Fast || Slow
Volatility || RAM volatile, ROM not || Non-volatile
Cost per bit || High || Low
Capacity || Small || Large`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Hierarchy: registers → cache → RAM → SSD/HDD (fast→slow, small→large).
SRAM = cache (fast, costly); DRAM = main memory (dense, refreshed).
Locality + hit ratio = cache fundamentals.
Only non-volatile chips: ROM, plus SSDs/HDDs.`,
      },
    ],
  },

  "Operating Systems": {
    "OS Fundamentals": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `An OS is a resource manager: CPU, memory, I/O devices and files.
Core functions: process management, memory management, file management, device management, security.
Kernel = core of the OS; shell = user interface (CLI/GUI); syscalls bridge apps and kernel.
Multiprogramming: many jobs in memory, one at a time per CPU. Multitasking: CPU time-sliced among processes. Multiprocessing: multiple CPUs/cores.
Batch processing runs jobs without interaction; time-sharing gives interactive response; real-time systems must meet deadlines.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `OS functions: "PMMFD" — Processes, Memory, Files, Devices, (Security/interface).
"Multiprogramming = many in RAM, one running; Multiprocessing = many CPUs."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `Real-time does NOT mean "very fast" — it means meeting hard deadlines.
Multiprogramming uses ONE CPU; multiprocessing uses SEVERAL CPUs.
System call is the only way an app requests OS services (e.g. read, fork, exec).`,
      },
      {
        kind: "COMPARISON",
        title: "Multi-* terms",
        body: `Term || Definition || CPU count
Multiprogramming || Multiple jobs in memory, CPU idle-avoidance || 1
Multitasking || Rapidly switch processes for interactive feel || 1
Multiprocessing || True parallel execution || 2+
Multithreading || Multiple threads within one process || 1+`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `OS = resource manager + interface between user and hardware.
Functions: process, memory, file, device management + security.
Kernel vs shell; system calls are the kernel API.
Types: batch, time-sharing, real-time, distributed.`,
      },
    ],
    "Process Management": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Process = program in execution; its metadata lives in the PCB (process control block).
States: new → ready → running → (blocked/waiting) → terminated.
Only one process runs per core at a time; ready queue holds candidates.
Context switch = saving/loading process state; has CPU overhead.
Thread = lightweight process sharing address space; context switch cheaper.
Zombie: terminated but not yet reaped by parent. Orphan: parent terminated before child.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `State ladder: "New → Ready → Running → Blocked → Terminated" (N-R-R-B-T).
"Zombie = dead but not buried (parent hasn't wait()ed); Orphan = parent died first."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `A process in Ready is waiting for CPU, NOT for I/O (that is Blocked).
Zombie process uses no CPU but still has a PCB.
Threads share the process address space; processes do not.`,
      },
      {
        kind: "COMPARISON",
        title: "Process vs Thread",
        body: `Feature || Process || Thread
Address space || Separate || Shared
Creation/switch cost || High || Low
Failure isolation || Yes || No (kills process)
Communication || IPC (pipes, shared memory) || Direct (shared memory)
Relationship || Contains threads || Lives inside a process`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Process = program + PCB + resources; thread = unit of execution inside a process.
States: New, Ready, Running, Blocked, Terminated (N-R-R-B-T).
Context switch overhead; threads cheaper than processes.
Zombie (parent hasn't reaped) vs orphan (parent died).`,
      },
    ],
    "CPU Scheduling": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `FCFS: first come, first served; non-preemptive; convoy effect possible.
SJF: shortest job first; non-preemptive; optimal average waiting; causes starvation.
SRTF: preemptive SJF (arrivals can preempt); optimal among preemptive algorithms.
Round Robin: time quantum; good response time; quantum too large → FCFS, too small → heavy overhead.
Priority scheduling: higher priority runs; starvation → solved by aging.
Metrics: turnaround time, waiting time, response time, throughput, CPU utilization.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `"RR quantum: too big = FCFS, too small = overhead."
"SJF minimizes waiting; starving the long jobs — that's the catch."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `SJF is optimal for average WAITING time but can starve long jobs.
Priority with aging raises a waiting process's priority to prevent starvation.
RR is preemptive; FCFS is non-preemptive by default.
Turnaround = completion − arrival; waiting = turnaround − burst.`,
      },
      {
        kind: "COMPARISON",
        title: "Scheduler comparison",
        body: `Algorithm || Preemptive || Optimal metric || Weakness
FCFS || No || Simplicity || Convoy effect, poor response
SJF || No || Avg waiting || Starvation of long jobs
SRTF || Yes || Avg waiting (preemptive) || Starvation, overhead
Round Robin || Yes || Response time || Too many switches
Priority || Optional || Meeting priorities || Starvation (aging fixes)`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `FCFS: simple, non-preemptive. SJF/SRTF: shortest-first, optimal waiting, starves long jobs.
RR: time-sliced for interactivity; pick quantum wisely.
Aging prevents starvation in priority/SJF.
Know formulas: turnaround = completion − arrival; waiting = turnaround − burst.`,
      },
    ],
    "Process Synchronization": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Critical section: code accessing shared data; must guarantee mutual exclusion.
Three requirements: mutual exclusion, progress, bounded waiting.
Semaphore: wait()/P() decrements, signal()/V() increments; binary (0/1) vs counting.
Mutex ≈ binary semaphore with ownership.
Producer-consumer, reader-writer, dining philosophers are classic synchronization problems.
Spinlock: busy-waits (good for short CS on multicore); mutex sleeps the thread.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `CS requirements: "MPB" — Mutual exclusion, Progress, Bounded waiting.
"P = wait (down, Potentially blocks), V = signal (up, Vale/vakker)."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `wait() DECREMENTS the semaphore; signal() INCREMENTS it — easy to invert under pressure.
Binary semaphore locks to 0/1; counting semaphore allows N resources.
A mutex tracks ownership; a binary semaphore does not (used for signaling too).`,
      },
      {
        kind: "COMPARISON",
        title: "Semaphore vs Mutex",
        body: `Feature || Semaphore || Mutex
Value || 0/1 (binary) or N (counting) || 0/1 only
Ownership || Not tracked || Tracked (only owner releases)
Use || Signaling, resource counting || Mutual exclusion / locking
Blocking || Can busy-wait or sleep || Typically sleeps`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Critical section needs mutual exclusion + progress + bounded waiting.
Semaphores: P/wait decrements, V/signal increments; binary vs counting.
Classic problems: producer-consumer, reader-writer, dining philosophers.
Spinlock busy-waits; mutex/semaphore can block.`,
      },
    ],
    Deadlocks: [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Four necessary conditions: mutual exclusion, hold & wait, no preemption, circular wait.
Prevention: break one condition (e.g. request all at once, allow preemption).
Avoidance: Banker's algorithm — only grant if resulting state is safe.
Detection: resource allocation graph; cycle implies deadlock (single-instance resources).
Recovery: kill processes or preempt resources (rollback).
Safe state: there exists an order to finish all processes.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `Four conditions: "M-H-N-C" — Mutual exclusion, Hold & wait, No preemption, Circular wait.
"Prevention breaks a condition; avoidance checks safety; detection finds & recovers."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `A cycle in the resource allocation graph implies deadlock only for single-instance resources.
Circular wait is necessary but alone insufficient — all four must hold.
Preemption is allowed in deadlock recovery; it violates the no-preemption condition.`,
      },
      {
        kind: "COMPARISON",
        title: "Strategy comparison",
        body: `Approach || What it does || Cost
Prevention || Deny one of the 4 conditions || Low utilization, conservative
Avoidance || Banker's algorithm, check safe state || Needs future knowledge
Detection || Build resource graph, find cycles || Runtime overhead
Recovery || Kill / preempt / rollback || Data loss, work loss`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Deadlock needs: mutual exclusion, hold & wait, no preemption, circular wait.
Break any one to prevent; use Banker's algorithm to avoid; detect via graph, recover by killing/preempting.
Safe state = a completion order exists for all processes.`,
      },
    ],
    "Memory Management": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Paging: fixed-size pages/frames; no external fragmentation (some internal); page table maps logical→physical.
Segmentation: variable-size segments; external fragmentation possible; segment table.
Page replacement: FIFO, LRU, Optimal (Belady's), Clock (second chance).
Belady's anomaly: more frames can INCREASE faults — happens with FIFO, never with LRU/Optimal.
Thrashing: too many processes, constant page faults, low CPU utilization.
Working set = pages a process needs; keeps fault rate down.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `Replacement algorithms: "FLOC" — FIFO, LRU, Optimal, Clock.
"FIFO can Belady; LRU and Optimal cannot."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `Paging → internal fragmentation (wasted space inside a page); segmentation → external fragmentation.
Belady's anomaly applies to FIFO, not to LRU or Optimal.
Optimal replacement is theoretical (needs future knowledge) — used as benchmark.`,
      },
      {
        kind: "COMPARISON",
        title: "Paging vs Segmentation",
        body: `Feature || Paging || Segmentation
Unit size || Fixed || Variable
Fragmentation || Internal || External
User view || One flat address space || Multiple logical segments
Hardware || Page table || Segment table (+ offset)`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Paging = fixed pages, page table, internal fragmentation.
Segmentation = variable segments, external fragmentation.
Replacement: FIFO (can Belady), LRU, Optimal, Clock.
Thrashing = constant faulting; cure with working-set control / fewer processes.`,
      },
    ],
    "File Systems": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Allocation methods: contiguous (fast, external fragmentation), linked (no fragmentation, slow random access), indexed (fast random access, index block overhead).
Directory: single-level, two-level, tree, acyclic-graph.
inode (Unix) stores metadata + block pointers; FAT stores chain in a table.
Free-space management: bit vector, linked list, grouping, counting.
Access methods: sequential, direct/random, indexed.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `Allocation: "CLI" — Contiguous, Linked, Indexed.
"Linked = chain pointers; Indexed = a table of pointers; Contiguous = one big run."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `Contiguous allocation causes EXTERNAL fragmentation as files grow/free.
Linked allocation has poor random access (must walk the chain).
Indexed allocation adds one block of index pointers per file.`,
      },
      {
        kind: "COMPARISON",
        title: "Allocation methods",
        body: `Feature || Contiguous || Linked || Indexed
Random access || O(1) || O(n) || O(1)
External fragmentation || Yes || No || No
Overhead || None || Pointer per block || Index block per file
Reliability || — || Lost pointer = broken chain || Index corruption = lost file`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Contiguous: fast but external fragmentation. Linked: flexible, slow random. Indexed: fast random, extra block.
inode vs FAT: inode keeps metadata+pointers in place; FAT centralizes chains in a table.
Free space via bit vector is simplest to read/write.`,
      },
    ],
  },

  "Data Structures & Algorithms": {
    "Arrays & Strings": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Array = fixed-size, contiguous memory, O(1) random access by index.
Insert/delete in the middle: O(n) (shift elements).
Row-major: elements of a row stored together; address = base + (row*cols + col)*size.
Strings in C are char arrays ending in '\\0'; in C++ std::string is length-managed.
Static arrays have fixed size; dynamic arrays (e.g. std::vector) grow geometrically.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `"Array reads: instant (O(1)); array writes in the middle: shift (O(n))."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `Row-major address questions: count from base, include the current row's full preceding rows.
Array index in C/C++ starts at 0.
Accessing an out-of-bounds index is undefined behavior (not an automatic exception).`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Contiguous + O(1) index access; O(n) for middle insertion/deletion.
Row-major vs column-major for address arithmetic (row-major standard in C).
Strings: '\\0'-terminated in C; length-prefixed in higher-level languages.`,
      },
    ],
    "Linked Lists": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Singly: node = data + next pointer. Doubly: also prev. Circular: tail→head.
O(1) insert/delete at the head (and tail with tail pointer); O(n) search.
No random access — finding the k-th node is O(n).
Floyd's cycle detection: slow & fast pointers meet if a cycle exists.
Reversal, merging, detecting the middle node are classic list problems.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `"Linked list = train cars: easy to add/remove a car, hard to jump to car #5."
"Floyd = tortoise & hare meet in a cycle."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `Accessing the k-th element is O(n), NOT O(1) — that's the array's job.
Deleting a node given only that node needs the next node's copy (singly list) or a prev pointer.
Doubly linked lists trade memory for easier backwards traversal.`,
      },
      {
        kind: "COMPARISON",
        title: "Array vs Linked List",
        body: `Operation || Array || Linked list
Random access || O(1) || O(n)
Insert/delete at head || O(n) (shift) || O(1)
Memory || Contiguous, fixed || Scattered, dynamic
Extra space || None || Pointer per node
Cache locality || Good || Poor`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Linked lists: dynamic size, O(1) head ops, O(n) search, no random access.
Singly / doubly / circular variants; Floyd's algorithm detects cycles.
Choose arrays for index-heavy reads, lists for frequent insert/delete.`,
      },
    ],
    "Stacks & Queues": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Stack: LIFO — push/pop/peek at one end (top).
Queue: FIFO — enqueue at rear, dequeue at front.
Applications: stack — function calls, undo, expression evaluation, DFS; queue — scheduling, BFS, buffers.
Circular queue reuses array space; front/rear advance modulo size.
Deque: insert/delete at both ends. Priority queue: highest-priority first (heap).`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `"Stack = Last In First Out (LIFO); Queue = First In First Out (FIFO)."
"DFS uses a stack, BFS uses a queue."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `Priority queue pops by priority, not FIFO order.
Deque allows operations at BOTH ends.
In a circular queue, (rear+1) % n == front means the queue is full.`,
      },
      {
        kind: "COMPARISON",
        title: "Stack vs Queue",
        body: `Feature || Stack || Queue
Order || LIFO || FIFO
Insert || push (top) || enqueue (rear)
Delete || pop (top) || dequeue (front)
Traversal use || DFS || BFS
Example || Undo, function calls || Print spooling, buffers`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Stack = LIFO (push/pop); Queue = FIFO (enqueue/dequeue).
Circular queue: modulo arithmetic, full when (rear+1)%n == front.
DFS↔stack, BFS↔queue; deque both ends; priority queue is heap-based.`,
      },
    ],
    Trees: [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Binary tree: each node ≤ 2 children. Full: every node has 0 or 2 children. Complete: all levels filled except possibly the last, filled left-to-right. Perfect: all leaves at same level.
BST: left < node < right; in-order traversal gives sorted order; search/insert O(h).
Traversals: in (L-Root-R), pre (Root-L-R), post (L-R-Root), level order (BFS).
Height of a perfect binary tree with n leaves = log2(n). Max nodes in level i = 2^i.
Binary heap: complete tree, min/max-heap property; insert/delete O(log n).`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `Traversal prefixes: "in = Left Root Right; pre = Root first; post = Root last."
"BST + in-order = sorted output."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `Complete ≠ full: complete is left-packed; full means 0 or 2 children; perfect = all leaves full AND at same depth.
A skewed BST degenerates to a linked list — search becomes O(n).
In-order of a BST is sorted; pre/post are not.`,
      },
      {
        kind: "COMPARISON",
        title: "BST vs Heap",
        body: `Feature || BST || Heap
Ordering || Left < node < right || Parent ≥/≤ children (property)
Search || O(h) avg || O(n)
Min/max access || Find via traversal || O(1) at root
In-order traversal || Sorted || Not meaningful
Use || Ordered search || Priority queue`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Binary tree types: full, complete, perfect — know the differences.
BST property + in-order = sorted; balance keeps height ~log n.
Traversals: in/pre/post/level — recall what visits first.
Heap = complete tree satisfying heap property; backs priority queues.`,
      },
    ],
    Graphs: [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Graph = vertices + edges; directed/undirected, weighted/unweighted.
Adjacency matrix: O(V^2) space, O(1) edge lookup. Adjacency list: O(V+E) space, iterates neighbors fast.
BFS (queue): shortest path in unweighted graphs, level order.
DFS (stack/recursion): path finding, cycle detection, topological sort.
MST: Kruskal (sort edges, union-find) and Prim (grow from a vertex).
Shortest path: Dijkstra (non-negative weights), Bellman-Ford (negative, detects cycles).`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `"BFS = queue (broad), DFS = stack (deep)."
"Dijkstra fails on negative weights; Bellman-Ford handles them."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `BFS finds shortest path only when edges are UNweighted.
Dijkstra assumes non-negative weights; negative edges → Bellman-Ford.
Dense graph (many edges) → matrix may be fine; sparse → adjacency list is better.`,
      },
      {
        kind: "COMPARISON",
        title: "Adjacency Matrix vs List",
        body: `Feature || Matrix || List
Space || O(V^2) || O(V+E)
Edge check || O(1) || O(degree)
Neighbor iteration || O(V) || O(degree)
Best for || Dense graphs || Sparse graphs`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Representations: matrix (O(V^2) space) vs list (O(V+E)).
BFS=queue→shortest unweighted path; DFS=stack→search/cycles.
Dijkstra (non-negative) vs Bellman-Ford (negative).
Kruskal (edge-sort) vs Prim (vertex-grow) for MST.`,
      },
    ],
    "Sorting Algorithms": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Quadratic: bubble, selection, insertion — good for small arrays.
Linearithmic: merge (stable, O(n) extra space), heap (in-place, unstable), quick (avg O(n log n), worst O(n^2)).
Stable sorts: bubble, insertion, merge. Unstable: selection, quick, heap.
Quick's worst case (sorted input + bad pivot) is O(n^2); random/median pivot mitigates.
Linear-time sorts: counting, radix, bucket (for integers/special keys).`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `"Bubble = adjacent swaps; Selection = pick the min each pass; Insertion = like cards."
"Stable trio: Bubble, Insertion, Merge."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `Merge sort is stable; quick sort is NOT stable.
Quick's worst case is O(n^2), not O(n log n).
Selection sort does the fewest swaps (n-1) — often asked.`,
      },
      {
        kind: "COMPARISON",
        title: "Complexity table",
        body: `Algorithm || Best || Average || Worst || Stable || Extra space
Bubble || O(n) || O(n^2) || O(n^2) || Yes || O(1)
Selection || O(n^2) || O(n^2) || O(n^2) || No || O(1)
Insertion || O(n) || O(n^2) || O(n^2) || Yes || O(1)
Merge || O(n log n) || O(n log n) || O(n log n) || Yes || O(n)
Quick || O(n log n) || O(n log n) || O(n^2) || No || O(log n)
Heap || O(n log n) || O(n log n) || O(n log n) || No || O(1)`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Bubble/selection/insertion = O(n^2) and simple; insertion best of the three in practice.
Merge/heap = O(n log n) worst; quick fastest on average but worst O(n^2).
Stable = bubble, insertion, merge. Heap is in-place; merge needs O(n) space.`,
      },
    ],
    "Searching Algorithms": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Linear search: O(n), works on unsorted data.
Binary search: O(log n), requires a SORTED array; repeatedly halves the range via mid.
mid = low + (high - low)/2 avoids overflow.
Variants: first/last occurrence, lower/upper bound (bisect).
Interpolation search: estimates position by value; O(log log n) avg on uniform data, O(n) worst.`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `Binary search on an UNSORTED array is meaningless (order matters).
Recursive binary search uses O(log n) stack space; iterative uses O(1).
Ternary search is not a general improvement over binary (log3 n vs log2 n — negligible).`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Linear: O(n) any data. Binary: O(log n) sorted only, halve by mid.
Use iterative binary search for O(1) space.
Interpolation = value-guided; good uniform data, bad worst case.`,
      },
    ],
    Hashing: [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Hash function maps a key to a slot; ideal is O(1) average lookup.
Collisions resolved by chaining (linked lists per slot) or open addressing.
Open addressing probes: linear (i+1), quadratic (i+k^2), double hashing (two functions).
Load factor α = n/slots; high α → more collisions, slower ops.
Good hash: deterministic, uniform, fast, low collision rate.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `"Chaining = buckets of lists; Open addressing = probe to the next free slot."
"Double hashing jumps by a second hash — avoids clustering."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `Hash tables are O(1) AVERAGE; worst case with bad hashing is O(n).
Linear probing suffers primary clustering; quadratic suffers secondary clustering; double hashing minimizes both.
Deleting from open addressing needs tombstones to keep probes valid.`,
      },
      {
        kind: "COMPARISON",
        title: "Chaining vs Open Addressing",
        body: `Feature || Chaining || Open addressing
Space || Extends beyond table || Fixed array
Deletion || Easy (unlink) || Needs tombstones
Cache locality || Poor || Good
Load factor || Can exceed 1 || Must stay < 1
Worst lookup || O(n) || O(n)`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Hash = key → slot, O(1) average lookup.
Collisions: chaining (lists) vs open addressing (probe: linear/quadratic/double).
Keep load factor low; know clustering behavior of each probe method.`,
      },
    ],
  },

  "Database Management Systems": {
    "DBMS Basics": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `DBMS vs file system: central control, querying, concurrency, recovery, integrity.
Three-level architecture: external (views), conceptual (global schema), internal (physical storage).
Data independence: logical (change schema w/o views) and physical (change storage w/o schema).
Data models: relational (tables), hierarchical (tree), network (graph), object-oriented.
Languages: DDL (schema), DML (data), DCL (privileges), plus DQL (SELECT).`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `Levels: "External, Conceptual, Internal" — like a zoom from the user's view to the disk.
"Logical independence = change tables, keep views; Physical = change files, keep tables."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `Logical data independence protects VIEWS when the conceptual schema changes.
Physical data independence protects the SCHEMA when storage changes — they're easy to swap in MCQs.
Relational model stores data in TABLES (relations), not files or graphs.`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `DBMS advantages: reduce redundancy, concurrency control, integrity, recovery.
3-level architecture: external → conceptual → internal.
Two kinds of data independence: logical and physical.
Relational model = tables (relations) with rows (tuples) and columns (attributes).`,
      },
    ],
    "Relational Model & Keys": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Relation = table; tuple = row; attribute = column; domain = set of allowed values.
Super key: set of attributes that uniquely identifies rows.
Candidate key: minimal super key (no subset is a key).
Primary key: chosen candidate key; unique + NOT NULL.
Alternate key: candidate key not chosen. Foreign key: references a primary key elsewhere.
Constraints: entity (PK), referential (FK), domain (values), key (uniqueness).`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `"Super ⊇ Candidate ⊇ Primary": Super is the superset, Candidate is minimal, Primary is the pick.
"Composite key = many columns; Foreign key = a key borrowed from another table."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `A SUPER key need NOT be minimal; a CANDIDATE key is a minimal super key.
Primary key cannot be NULL; candidate keys CAN be (before selection).
Every key must be unique, but unique ≠ key (unique may be redundant/minimality not required... actually unique constraint IS a key candidate in practice — remember candidate = minimal).`,
      },
      {
        kind: "COMPARISON",
        title: "Key types",
        body: `Key || Defines || Can be NULL
Super key || Unique row ID (may be non-minimal) || Yes
Candidate key || Minimal super key || Yes
Primary key || Chosen candidate || No
Alternate key || Unchosen candidate || Yes
Foreign key || References another PK || Yes (often)`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Relation/tuple/attribute/domain terminology.
Super (unique, maybe big) → Candidate (minimal) → Primary (picked, not null).
FK = reference to another table's PK; enforces referential integrity.
Constraints: entity, referential, domain, key.`,
      },
    ],
    SQL: [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `SELECT ... FROM ... WHERE ... GROUP BY ... HAVING ... ORDER BY — execution order matters.
WHERE filters rows; HAVING filters groups AFTER aggregation.
JOIN types: INNER, LEFT, RIGHT, FULL OUTER, CROSS, SELF.
Aggregates: COUNT, SUM, AVG, MIN, MAX; NULLs ignored by most.
DDL: CREATE, ALTER, DROP, TRUNCATE. DML: INSERT, UPDATE, DELETE. SELECT = DQL.
UNION removes duplicates; UNION ALL keeps them.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `Clause order: "S-W-G-H-O" — SELECT, WHERE, GROUP BY, HAVING, ORDER BY.
"WHERE kills rows, HAVING kills groups."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `TRUNCATE removes all rows but keeps the table (fast, minimal logging); DROP removes the table itself.
WHERE with aggregates is invalid — use HAVING.
LEFT JOIN keeps all left rows; RIGHT JOIN keeps all right rows; FULL keeps both.
COUNT(*) counts NULLs; COUNT(col) skips NULLs.`,
      },
      {
        kind: "COMPARISON",
        title: "DDL vs DML",
        body: `Feature || DDL || DML
Examples || CREATE, ALTER, DROP, TRUNCATE || INSERT, UPDATE, DELETE
Changes || Structure/schema || Data inside tables
Transaction impact || Auto-commit (often) || Can be rolled back (before commit)
Statement || Data Definition Language || Data Manipulation Language`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY.
JOINs: inner/left/right/full/cross/self — know row preservation.
Aggregates ignore NULLs (COUNT(*) counts them).
DDL = structure, DML = data; TRUNCATE vs DROP trap.`,
      },
    ],
    Normalization: [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Functional dependency X→Y: X determines Y.
1NF: atomic (single-valued) attributes.
2NF: 1NF + no partial dependency (non-key attribute depends on part of a composite key).
3NF: 2NF + no transitive dependency (non-key → non-key).
BCNF: for every FD X→Y, X is a superkey (stricter than 3NF).
Denormalization trades some integrity for query speed.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `NF ladder: "Atomic, Partial, Transitive, Every-FD's-determinant-is-a-key" → 1NF, 2NF, 3NF, BCNF.
"2NF kills partial deps; 3NF kills transitive deps; BCNF fixes leftover anomalies."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `3NF allows a dependency where a NON-key determines the primary key... no: 3NF still forbids non-key→non-key transitives; BCNF goes further.
Every BCNF is 3NF, but NOT every 3NF is BCNF (the classic textbook exception).
Boyce-Codd condition: every determinant must be a candidate key.`,
      },
      {
        kind: "COMPARISON",
        title: "Normal forms",
        body: `Form || Requirement || Removes
1NF || Atomic attributes || Repeating groups
2NF || 1NF + no partial dependency || Partial dependency
3NF || 2NF + no transitive dependency || Transitive dependency
BCNF || Every determinant is a superkey || Remaining anomalies`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `FD: X→Y means X determines Y.
1NF atomic → 2NF no partial → 3NF no transitive → BCNF determinants are keys.
Higher forms reduce redundancy/update anomalies; BCNF ⊂ 3NF ⊂ 2NF ⊂ 1NF.
Denormalize only for read-heavy performance.`,
      },
    ],
    "Transactions & Concurrency": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `ACID: Atomicity (all-or-nothing), Consistency (valid state to valid state), Isolation (concurrent → serial), Durability (persists after commit).
Transaction states: active → (partially committed) → committed | aborted.
Concurrency problems: lost update, dirty read (uncommitted), non-repeatable read, phantom read.
Isolation levels: Read Uncommitted < Read Committed < Repeatable Read < Serializable.
Locks: shared (read) vs exclusive (write); two-phase locking for serializability.
Deadlock in DB handled by detection + abort, or timeouts.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `"ACID: Atomic, Consistent, Isolated, Durable."
"Read uncommitted = dirtiest; Serializable = safest but slowest."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `Dirty read = reading UNCOMMITTED data; fixed by Read Committed.
Non-repeatable read = same row differs between reads (fixed by Repeatable Read).
Phantom = new rows appear in range (only Serializable fully prevents).
Commit is NOT undoable; rollback discards uncommitted changes.`,
      },
      {
        kind: "COMPARISON",
        title: "Isolation levels",
        body: `Level || Dirty read || Non-repeatable || Phantom
Read Uncommitted || Possible || Possible || Possible
Read Committed || Prevented || Possible || Possible
Repeatable Read || Prevented || Prevented || Possible
Serializable || Prevented || Prevented || Prevented`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `ACID = Atomicity, Consistency, Isolation, Durability.
Problems: lost update, dirty read, non-repeatable read, phantom read.
Isolation ladder: Read Uncommitted → RC → RR → Serializable.
2PL and locks guarantee serializability; deadlocks need detection/abort.`,
      },
    ],
  },

  "Programming in C & C++": {
    "C Fundamentals": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Sizes are implementation-defined: int ≥ 16 bits (usually 4 bytes), char = 1 byte, float/double IEEE-ish.
Storage classes: auto (default, local), static (persists), extern (another file), register (hint to CPU).
const makes a value read-only; volatile tells the compiler the value may change externally.
Operator precedence: (), unary, *, /, %, +, -, <, >, ==, !=, &&, ||, = (rough order).
Short-circuit evaluation: && and || stop early.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `"char = 1 byte always; sizeof(int) varies."
"Short-circuit: && stops at first false, || stops at first true."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `sizeof('A') in C is 1 (char); in C++ it is also 1 for char literal.
sizeof is a compile-time operator, not a function.
In C, int size depends on the platform — never assume 4 bytes in portability questions.
static local keeps its value between calls; extern shares across files.`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Know type sizes (char=1, int usually 4, depends on platform).
Storage classes: auto/static/extern/register.
const vs volatile. Precedence & short-circuit behavior.
printf format specifiers: %d %f %c %s %p.`,
      },
    ],
    "Control Structures": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `if/else-if/else for branching; switch for multi-way on integral values.
for / while / do-while loops; do-while executes the body at least once.
break exits the nearest loop/switch; continue skips to the next iteration.
Nested loops: break/continue only affect the innermost.
Ternary ?: is an expression, not a statement.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `"do-while: check at the door AFTER doing — runs at least once."
"break = exit; continue = skip the rest of this round."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `Missing break in switch causes fall-through to the next case.
Infinite loops: while(1) is valid; a for loop with no condition runs forever.
continue inside a for loop still executes the increment expression.`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Branching: if/else, switch (use break). Loops: for, while, do-while.
do-while ≥ 1 execution. break/continue semantics.
Ternary ?: for simple expressions.`,
      },
    ],
    "Functions & Recursion": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Function = reusable block; prototype declares, definition implements.
C passes by VALUE (a copy); to modify the caller's variable, pass a pointer.
Recursion: base case + recursive call; each call pushes a stack frame.
Deep/endless recursion → stack overflow.
Tail recursion: recursive call is the last statement (compilers may optimize).
Static functions are file-local; static locals persist across calls.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `"C is pass-by-value, always — 'pass the address' when you want a mutation."
"Recursion needs a base case, or the stack overflows."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `Swapping two ints with a function requires pointers (swap(&a,&b)).
Recursion uses the call stack; iteration uses O(1) space.
A function declared after use needs a forward prototype (in older C standards).`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Pass by value: callers' args copied; use pointers to mutate.
Recursion = base case + recursive case; stack frames grow with depth.
Prototypes, static functions/locals, and tail recursion basics.`,
      },
    ],
    "Arrays & Pointers": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Array name decays to a pointer to its first element (arr == &arr[0]).
Pointer arithmetic: p+1 moves sizeof(*p) bytes.
& = address-of; * = dereference; "int *p" reads "p points to int".
Dynamic memory: malloc (uninitialized), calloc (zeroed), realloc (resize), free.
sizeof(array) works only where the array is a full array type (not after decay).`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `"arr & arr[0] are the same address; &arr is the whole array's address."
"malloc = raw, calloc = cleaned (C-zeroed)."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `Inside a function, sizeof(arr) gives the POINTER size (8 on 64-bit), not the array size.
calloc zero-initializes; malloc does NOT.
Dereferencing a NULL/dangling pointer is undefined behavior.
free() once; double-free is UB.`,
      },
      {
        kind: "COMPARISON",
        title: "malloc vs calloc",
        body: `Feature || malloc || calloc
Args || (size) || (count, size)
Initialization || Uninitialized || Zero-filled
Speed || Faster || Slightly slower
Use || Known-size buffers || Need zeroed memory`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Arrays decay to pointers; arithmetic scales by element size.
malloc/calloc/realloc/free; calloc zeroes, malloc doesn't.
sizeof trap: full array type vs decayed pointer.
Never deref null/dangling; free exactly once.`,
      },
    ],
    "Structures & Unions": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `struct: members have separate storage; total ≥ sum of members (padding may add).
union: all members SHARE the same memory; size = largest member.
Padding aligns members for the CPU; order can change struct size.
typedef creates aliases (typedef struct {...} Point;).
Access via . for objects and -> for pointers.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `"struct = each member gets its own room; union = all members share one room."
"Dot for object, arrow for pointer: s.a vs p->a."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `Union size = LARGEST member, not the sum.
Writing one union member overwrites the others.
Struct size can exceed the sum of members due to alignment padding.
Accessing the "wrong" union member is undefined-ish behavior (implementation-defined).`,
      },
      {
        kind: "COMPARISON",
        title: "struct vs union",
        body: `Feature || struct || union
Member storage || Separate || Shared
Size || ≥ sum (+ padding) || Largest member
Can use all members || Yes || Only the last written
Use || Composite records || Memory savings / variant types`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `struct = separate storage + padding; union = shared storage, size = largest.
typedef simplifies type names; . for values, -> for pointers.
Beware padding questions on struct sizes.`,
      },
    ],
    "OOP Concepts (C++)": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Four pillars: abstraction, encapsulation (hide data), inheritance (is-a), polymorphism.
Access specifiers: private (class only), protected (class + derived), public (all).
Constructor initializes; destructor cleans up; RAII ties lifetime to scope.
Function overloading = compile-time polymorphism; virtual functions = runtime polymorphism.
Virtual destructor in base class → safe deletion through base pointer.
Multiple inheritance + diamond → virtual inheritance resolves ambiguity.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `Pillars: "A-E-P-I" — Abstraction, Encapsulation, Polymorphism, Inheritance.
"Overload = same name, different signatures (compile time); Override = virtual, runtime."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `Encapsulation is data HIDING (private members + public interface), not just bundling.
Virtual functions make calls resolve at runtime; without virtual, calls bind statically.
Make the base destructor virtual when deleting via a base pointer.
Operator overloading does NOT change precedence/arity of the operator.`,
      },
      {
        kind: "COMPARISON",
        title: "Compile-time vs Runtime polymorphism",
        body: `Feature || Compile-time || Runtime
Mechanism || Overloading, templates || Virtual functions
Resolved || At compile || At run (vtable)
Speed || Faster || Small overhead
Flexibility || Static binding || Dynamic dispatch`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Pillars: Abstraction, Encapsulation, Inheritance, Polymorphism.
private/protected/public access. Constructors/destructors + RAII.
Overloading (compile-time) vs overriding (runtime, virtual).
Virtual destructors, diamond problem → virtual inheritance.`,
      },
    ],
  },

  "Computer Networks": {
    "Network Fundamentals": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Topologies: bus, ring, star, mesh, tree, hybrid; star is the most common LAN layout.
Device layers: hub (L1, broadcasts), switch (L2, MAC table, isolates collisions), router (L3, IP forwarding), gateway (protocol translation).
Scope: PAN < LAN < MAN < WAN.
Collision domain: where frames can collide (hub = one big domain); broadcast domain: where broadcasts travel (router boundary).
Full duplex vs half duplex; bandwidth vs throughput.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `"Hub = layer 1 (dumb repeater), Switch = layer 2 (MAC), Router = layer 3 (IP)."
"Star = most popular LAN topology (single central switch)."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `A hub creates ONE collision domain for all ports; a switch gives each port its own.
Routers break BOTH collision and broadcast domains; switches break only collision domains.
Mesh topology = most reliable but most cabling; bus is the cheapest but single point of failure.`,
      },
      {
        kind: "COMPARISON",
        title: "Hub vs Switch vs Router",
        body: `Device || Layer || Domain split || Key job
Hub || Physical (1) || None || Repeats signal to all
Switch || Data link (2) || Collision domains || Forwards frames by MAC
Router || Network (3) || Collision + broadcast || Routes packets by IP`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Topologies: bus/ring/star/mesh/tree; star dominates LANs.
Hub (L1), switch (L2), router (L3), gateway.
Collision vs broadcast domains: hubs neither, switches split collisions, routers split both.
PAN/LAN/MAN/WAN order of scale.`,
      },
    ],
    "OSI & TCP/IP Models": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `OSI (7): Physical, Data Link, Network, Transport, Session, Presentation, Application.
TCP/IP (4): Network Interface, Internet, Transport, Application.
PDUs: bit (L1), frame (L2), packet (L3), segment (L4), message/data (L7).
Encapsulation: each layer adds its header as data moves down.
Router works at Network layer; switch at Data Link; hubs/repeaters at Physical.
OSI is a reference model; TCP/IP is the working stack.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `Bottom-up OSI: "Please Do Not Throw Sausage Pizza Away" → P-D-N-T-S-P-A.
"TCP/IP: NIC-Internet-Transport-Application" — the real internet stack.`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `OSI has 7 layers, TCP/IP has 4 — don't confuse Session/Presentation (only in OSI).
Routers are L3, switches L2, hubs/repeaters L1 — the #1 device-layer trap.
TCP/IP's "Application" layer bundles OSI's top 3 layers.`,
      },
      {
        kind: "COMPARISON",
        title: "OSI vs TCP/IP",
        body: `Layer # || OSI || TCP/IP
1 || Physical || Network Interface
2 || Data Link || Network Interface
3 || Network || Internet
4 || Transport || Transport
5-7 || Session/Presentation/Application || Application`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `OSI: P-D-N-T-S-P-A (7 layers). TCP/IP: 4 layers.
PDU ladder: bit→frame→packet→segment→data.
Encapsulation adds headers per layer.
Device↔layer mapping: hub 1, switch 2, router 3.`,
      },
    ],
    "Network Layer": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `IPv4: 32-bit, dotted decimal; classes A/B/C; loopback 127.0.0.0/8.
Private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16.
Subnetting: split host bits; CIDR notation /n.
IPv6: 128-bit, hex colon notation, no NAT needed.
Routing: static vs dynamic; RIP (hop count, 15 max), OSPF (link state, cost), BGP (inter-AS policy).
ARP maps IP→MAC; ICMP reports errors (ping); NAT translates private↔public.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `Class first octets: "A=0-127, B=128-191, C=192-223, D=224-239 (multicast), E=240+".
"Private 10/8, 172.16/12, 192.168/16 — the RFC1918 trio."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `127.x.x.x is LOOPBACK, never assigned to a real host.
RIP max hop count = 15; OSPF is better for large networks.
IPv6 has no need for NAT in the same way (large address space).
ARP is layer 2/3 glue (IP→MAC), ICMP is control/error.`,
      },
      {
        kind: "COMPARISON",
        title: "RIP vs OSPF",
        body: `Feature || RIP || OSPF
Type || Distance vector || Link state
Metric || Hop count || Cost/bandwidth
Convergence || Slow || Fast
Scale || ≤ 15 hops || Large networks
Protocol || UDP 520 || IP 89`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `IPv4 classes + loopback + private ranges (memorize).
Subnetting/CIDR: /n = number of network bits.
IPv6 = 128-bit, hex colon.
RIP (hops, 15) vs OSPF (cost) vs BGP (inter-AS).
ARP = IP→MAC, ICMP = errors, NAT = address translation.`,
      },
    ],
    "Transport Layer": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `TCP: connection-oriented, 3-way handshake (SYN, SYN-ACK, ACK), reliable (seq/ack, retransmit), flow & congestion control.
UDP: connectionless, best-effort, low overhead, no ordering/reliability.
TCP segments vs UDP datagrams; ports: 20/21 FTP, 22 SSH, 25 SMTP, 53 DNS, 80 HTTP, 443 HTTPS, 161/162 SNMP.
Sliding window, selective repeat / go-back-N; congestion via AIMD.
Multiplexing: many apps share the transport via port numbers.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `"TCP = TCP/IP's reliable cab; UDP = fast courier, no receipt."
3-way handshake: "SYN → SYN-ACK → ACK."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `DNS typically uses UDP (53); DHCP uses UDP; live streaming/video uses UDP.
TCP guarantees delivery/order; UDP does NOT.
HTTP/HTTPS run over TCP (reliable). TFTP uses UDP.
Ports: 80 HTTP, 443 HTTPS, 22 SSH, 25 SMTP, 53 DNS — rote-learn them.`,
      },
      {
        kind: "COMPARISON",
        title: "TCP vs UDP",
        body: `Feature || TCP || UDP
Connection || Yes (3-way handshake) || No
Reliability || Guaranteed || Best-effort
Ordering || Guaranteed || Not guaranteed
Overhead || High || Low
Use || Web, email, file transfer || DNS, streaming, VoIP`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `TCP: reliable, ordered, connection-oriented, 3-way handshake, congestion control.
UDP: fast, no guarantees, connectionless.
Well-known ports: FTP 20/21, SSH 22, SMTP 25, DNS 53, HTTP 80, HTTPS 443.
Streaming + DNS/DHCP → UDP; everything reliable → TCP.`,
      },
    ],
    "Application Layer Protocols": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `HTTP: request/response, stateless, methods GET/POST/PUT/DELETE/HEAD; status 1xx-5xx.
HTTPS = HTTP over TLS (encryption + certificates).
DNS: translates names→IP; hierarchy of root/TLD/authoritative; uses UDP 53.
Email: SMTP (send, 25), POP3 (download, 110), IMAP (sync, 143).
FTP: file transfer, 21 control + 20 data, two channels.
Cookies/sessions add state on top of stateless HTTP.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `"SMTP pushes out, POP3/IMAP pull in."
Status codes: "2xx good, 3xx redirect, 4xx client error, 5xx server error."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `SMTP is for SENDING; you receive via POP3/IMAP.
DNS uses UDP by default (53), but zone transfers use TCP.
HTTPS encrypts the payload, not necessarily the hostname/DNS lookups.
HTTP is stateless — state comes from cookies/sessions.`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `HTTP methods + status-code ranges; stateless + cookies.
HTTPS = HTTP + TLS.
DNS (UDP 53) maps names to IPs.
Email: SMTP send, POP3/IMAP receive.
FTP uses two connections (control 21, data 20).`,
      },
    ],
  },

  "Software Engineering": {
    "SDLC & Models": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `SDLC phases: requirement analysis → design → implementation → testing → deployment → maintenance.
Waterfall: sequential, phase-gated, heavy documentation; bad when requirements change.
Agile: iterative, small increments, customer feedback, working software each sprint (Scrum/Kanban).
Spiral: risk-driven iterations (prototype + evaluate risk each loop).
V-model: testing activities mirror development phases (unit↔design, acceptance↔requirements).
Agile manifesto: individuals/interactions over process/tools, working software over docs, customer collaboration, responding to change.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `Phases: "R-D-I-T-D-M" — Requirements, Design, Implementation, Testing, Deployment, Maintenance.
"Waterfall = one long cascade; Agile = small fast loops; Spiral = risk each round."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `Waterfall is NOT iterative — no going back to a previous phase formally.
Agile is not "no documentation" — it prioritizes working software over docs.
Spiral is best for high-RISK projects; V-model emphasizes verification at every level.`,
      },
      {
        kind: "COMPARISON",
        title: "Waterfall vs Agile",
        body: `Feature || Waterfall || Agile
Delivery || Once at the end || Small increments
Requirements || Fixed up front || Evolving
Feedback || Late || Continuous
Documentation || Heavy || Just enough
Best for || Stable, well-understood || Changing, uncertain`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `SDLC: R-D-I-T-D-M phases.
Waterfall: sequential, docs-heavy. Agile: iterative, incremental.
Spiral: risk-driven. V-model: test mirrors each development stage.
Agile values working software and responding to change.`,
      },
    ],
    "Software Testing": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Levels: unit (smallest), integration (modules together), system (whole system), acceptance (user validation).
Black-box: tests functionality without internal code (equivalence partitioning, boundary value).
White-box: tests internal logic/coverage (statement, branch, path coverage).
Non-functional types: performance, stress, load, security, usability.
Regression: re-test after changes; smoke: quick sanity check; alpha (internal) vs beta (external users).
Test case design: valid/invalid inputs, boundary values, expected outputs.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `"White-box = looks at code; Black-box = only the behavior."
Levels: "U-I-S-A" — Unit, Integration, System, Acceptance.`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `Unit tests are usually WHITE-box; acceptance tests are BLACK-box.
Stress testing pushes beyond normal capacity; load tests normal expected load.
Boundary value analysis targets the edges of input ranges — a favorite MCQ.
Alpha = inside the org, Beta = real external users.`,
      },
      {
        kind: "COMPARISON",
        title: "Black-box vs White-box",
        body: `Feature || Black-box || White-box
Sees code || No || Yes
Perspective || Requirements/behavior || Internal logic
Coverage || Input domains || Statements/branches/paths
Techniques || Boundary value, equivalence || Branch, path, condition coverage
Executed by || Testers || Developers`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Levels: unit → integration → system → acceptance.
Black-box = behavior (boundary/equivalence); White-box = code coverage.
Regression after changes; smoke = sanity; alpha internal / beta external.
Stress vs load: beyond capacity vs normal load.`,
      },
    ],
    "Software Design": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Coupling: how much modules depend on each other — LOW is good.
Cohesion: how related the parts within a module are — HIGH is good.
Goal: high cohesion + low coupling (loose coupling).
Coupling levels: content > common > control > stamp/data (data coupling is loosest/best).
Cohesion levels: coincidental > logical > temporal > procedural > communicational > sequential > functional (functional is best).
Good design principles: modularity, abstraction, information hiding, single responsibility.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `"Coupling = between modules (keep low); Cohesion = within a module (keep high)."
"Data coupling = best (loosest); Functional cohesion = best (tightest)."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `The optimum is HIGH cohesion + LOW coupling — get the polarity right.
Data coupling is looser (better) than control coupling; content coupling (access internals) is worst.
Functional cohesion (single purpose) is the strongest, not the weakest.`,
      },
      {
        kind: "COMPARISON",
        title: "Coupling vs Cohesion",
        body: `Feature || Coupling || Cohesion
Scope || Between modules || Within a module
Ideal value || Low || High
Effect of good value || Easier maintenance || Focused module
Bad extreme || Content coupling || Coincidental cohesion`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Low coupling (loose) + high cohesion (tight) = good design.
Worst coupling: content; best: data.
Best cohesion: functional; worst: coincidental.
Principles: modularity, information hiding, single responsibility.`,
      },
    ],
  },

  "Internet & Web Technologies": {
    "HTML & CSS": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `HTML = structure: elements (tags) + attributes; semantic tags: header, nav, main, section, article, footer.
Block vs inline elements; empty elements (img, br, input, hr).
CSS = presentation: selectors (type, class, id, attribute, pseudo), cascade, specificity.
Box model: content → padding → border → margin.
Specificity order: inline style > id > class/attr/pseudo-class > element/pseudo-element.
Flexbox: one-dimensional layout; Grid: two-dimensional layout.
Responsive design: media queries, relative units (rem, %, vw/vh).`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `Specificity: "inline beats id, id beats class, class beats tag."
Box model from inside out: "content → padding → border → margin."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `An inline style beats any stylesheet rule regardless of selector specificity.
!important overrides specificity (except inline !important in some cases).
margin is OUTSIDE the border; padding is INSIDE it (between content and border).
IDs must be unique per page; classes repeat.`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `HTML structure with semantic tags; CSS presentation.
Box model: content/padding/border/margin.
Specificity: inline > id > class > element.
Flexbox (1D) vs Grid (2D); responsive via media queries.`,
      },
    ],
    JavaScript: [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `Client-side scripting language that runs in the browser (also server-side via Node.js).
DOM: document object model; document.getElementById, querySelector, addEventListener.
var (function-scoped) vs let/const (block-scoped); const can't be reassigned.
Functions, arrow functions, closures (inner fn keeps outer scope).
Asynchronous: callbacks, Promises, async/await; event loop + single thread.
Types: number, string, boolean, null, undefined, object, symbol, bigint.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `"let/const = block-scoped; var = function-scoped."
"async/await = sugar over Promises; the event loop runs JS single-threaded."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `JS is single-threaded (event loop), but non-blocking for I/O.
typeof null === "object" — a classic quiz trap.
== does coercion; === is strict (type + value).
Variables declared with var inside a block leak out of the block.`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `Client-side scripting; DOM manipulation + events.
var vs let/const scoping; closures.
Single-threaded event loop; async via Promises/async-await.
Strict vs loose equality (=== vs ==).`,
      },
    ],
    "Web Protocols": [
      {
        kind: "CONCEPT_NOTES",
        title: "Key points",
        body: `HTTP: request/response protocol, stateless; methods GET, POST, PUT, DELETE, HEAD, OPTIONS.
Status classes: 2xx success, 3xx redirect, 4xx client error, 5xx server error.
HTTPS: HTTP over TLS — encrypts the connection, authenticates the server via certificates.
Cookies: small state stored client-side; sessions on the server.
Caching: ETag/Cache-Control reduce round trips.
WebSocket: full-duplex persistent connection for real-time.`,
      },
      {
        kind: "MNEMONICS",
        title: "Memory hooks",
        body: `"HTTPS = HTTP + TLS; never send passwords over plain HTTP."
"4xx = your fault (client), 5xx = server's fault."`,
      },
      {
        kind: "EXAM_TRAPS",
        title: "Exam traps",
        body: `HTTP itself is stateless — cookies/sessions simulate state.
HTTPS encrypts the content, but DNS lookups for the hostname may still be visible.
WebSocket upgrades an HTTP connection to full-duplex — it is not just "HTTP with less overhead".`,
      },
      {
        kind: "QUICK_SUMMARY",
        title: "One-page revision",
        body: `HTTP = stateless request/response; methods GET/POST/PUT/DELETE.
Status classes 1xx-5xx; 2xx success, 4xx client, 5xx server.
HTTPS = HTTP + TLS (encryption + server auth).
Cookies + sessions add state; WebSockets enable real-time duplex.`,
      },
    ],
  },
};
