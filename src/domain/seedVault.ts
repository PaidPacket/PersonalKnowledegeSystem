import {
  CanvasEdge,
  CanvasNode,
  FolderRecord,
  NoteRecord,
  serializeFrontmatterAndBody,
} from './vaultEngine';

export const INITIAL_FOLDERS: FolderRecord[] = [
  {
    id: 'folder-01',
    parentId: null,
    name: '01 - Computer Science',
    expanded: false,
    order: 1,
  },
  {
    id: 'folder-02',
    parentId: null,
    name: '02 - Java Architecture',
    expanded: true,
    order: 2,
  },
  {
    id: 'folder-02-concurrency',
    parentId: 'folder-02',
    name: 'Concurrency & Threads',
    expanded: true,
    order: 1,
  },
  {
    id: 'folder-02-oop',
    parentId: 'folder-02',
    name: 'Object-Oriented Patterns',
    expanded: false,
    order: 2,
  },
  {
    id: 'folder-03',
    parentId: null,
    name: '03 - Distributed Systems',
    expanded: false,
    order: 3,
  },
  {
    id: 'folder-04',
    parentId: null,
    name: '04 - Daily Notes',
    expanded: false,
    order: 4,
  },
];

function createSeedNotes(): NoteRecord[] {
  const virtualThreadsFm = {
    tags: ['java', 'concurrency', 'project-loom', 'jvm'],
    status: 'in-progress' as const,
    created: '2024-03-22',
    priority: 'high' as const,
    aliases: ['Memory Model & Virtual Threads', 'Virtual Threads'],
  };

  const virtualThreadsBody = `# Virtual Threads & Project Loom: Mechanics & Architecture

Java 21 delivers **JEP 444**, officially stabilizing user-mode lightweight Virtual Threads. While conventional platform threads implement a rigid 1:1 mapping with native OS kernel threads, virtual threads decouple execution context via an M:N scheduling model orchestrated directly on JVM Carrier Threads backed by standard \`ForkJoinPool\` instances.

## Overview & Motivations

Platform threads are expensive wrappers around OS kernel threads. Project Loom introduces continuations and user-mode scheduling so high-throughput network services no longer choose between simple blocking code and complex reactive pipelines.

## Platform vs Virtual Threads

See the Runtime Characteristics Comparison matrix below for stack footprint, context switch overhead, and underlying scheduler semantics.

## JVM Scheduler & Carrier Threads

Virtual threads mount onto carrier threads inside a work-stealing [[ForkJoinPool Architecture]] and unmount automatically whenever a blocking I/O operation is encountered.

## Architectural Guardrails & Pinning Risks

Adopting lightweight concurrency does not mean unbounded scalability without trade-offs. The dominant hazard in production migrations is **Carrier Thread Pinning**, which happens when a virtual thread halts inside a synchronized block or native JNI call, prohibiting the runtime from parking its execution frame.

## Eliminating Thread Pinning

Replace intrinsic monitors with [[ReentrantLock vs Synchronized]] and audit [[JVM Memory Management]] for thread-local allocations.

## Benchmarks & Performance

For comprehensive scheduling details, check our cross-references in [[Thread Pools & Executors]] and review memory barriers described in [[Java Memory Model & Volatile]] and [[Lock-Free Data Structures]].`;

  const notes: NoteRecord[] = [
    {
      id: 'note-thread-pools',
      folderId: 'folder-02-concurrency',
      filename: 'Thread Pools & Executors.md',
      title: 'Thread Pools, Work-Stealing & ExecutorService Architecture',
      lead: 'Bounded thread pools prevent OS kernel exhaustion under bursty I/O workloads by queueing Runnables across fixed worker pools, whereas work-stealing ForkJoinPools optimize CPU-bound recursive decomposition.',
      frontmatter: {
        tags: ['java/concurrency', 'executors', 'jvm'],
        status: 'verified',
        created: '2024-03-14',
        priority: 'high',
      },
      sectionHeading: 'Queue Sizing & Backpressure Semantics',
      sectionBody:
        'Unbounded LinkedBlockingQueue instances mask downstream latency spikes until heap exhaustion occurs. Pair bounded ArrayBlockingQueue buffers with explicit CallerRunsPolicy backpressure.',
      checklist: [
        {
          id: 'tp-1',
          text: 'Replace Executors.newFixedThreadPool with explicit ThreadPoolExecutor constructor',
          checked: true,
        },
        {
          id: 'tp-2',
          text: 'Instrument active worker count and queue depth metrics in Micrometer',
          checked: true,
        },
        {
          id: 'tp-3',
          text: 'Migrate blocking I/O dispatchers to VirtualThreadPerTaskExecutor',
          checked: false,
        },
      ],
      codeBlock: {
        title: 'Backpressure-Aware Executor Configuration',
        filename: 'BoundedExecutorConfig.java',
        language: 'java',
        code: `ExecutorService ioPool = new ThreadPoolExecutor(
    16, 64, 60L, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(512),
    new ThreadFactoryBuilder().setNameFormat("io-worker-%d").build(),
    new ThreadPoolExecutor.CallerRunsPolicy()
);`,
      },
      wikiParagraph:
        'Contrast traditional pooled workers with [[Virtual Threads & Loom]] and inspect internal work-stealing queues in [[ForkJoinPool Architecture]].',
      callout: {
        title: 'Sizing Formula',
        body: 'For CPU-bound workloads size pool to N_cpu + 1. For blocking I/O workloads prefer Virtual Threads rather than inflating platform thread pools.',
      },
      rawMarkdown: `# Thread Pools, Work-Stealing & ExecutorService Architecture\n\nContrast traditional pooled workers with [[Virtual Threads & Loom]] and inspect internal work-stealing queues in [[ForkJoinPool Architecture]].`,
      updatedAt: '18m ago',
      bookmarked: false,
    },
    {
      id: 'note-jmm',
      folderId: 'folder-02-concurrency',
      filename: 'Java Memory Model & Volatile.md',
      title: 'Java Memory Model (JMM), Happens-Before & Volatile Semantics',
      lead: 'The Java Memory Model defines legal instruction reorderings across CPU store buffers and L1/L2 cache lines, guaranteeing visibility only across explicit happens-before edges.',
      frontmatter: {
        tags: ['java/concurrency', 'jmm', 'memory'],
        status: 'verified',
        created: '2024-03-10',
        priority: 'high',
      },
      sectionHeading: 'Acquire-Release Fences & VarHandle Modes',
      sectionBody:
        'Volatile reads insert load-acquire barriers while volatile writes emit store-release + StoreLoad fences to flush store buffers to coherent cache lines.',
      checklist: [
        {
          id: 'jmm-1',
          text: 'Verify safe publication of immutable configuration snapshots via final fields',
          checked: true,
        },
        {
          id: 'jmm-2',
          text: 'Use VarHandle.getAcquire / setRelease for lower-overhead ordering when full volatile is unnecessary',
          checked: false,
        },
      ],
      wikiParagraph:
        'Memory visibility rules apply identically to atomic CAS loops in [[Lock-Free Data Structures]] and heap frames in [[JVM Memory Management]].',
      rawMarkdown: `# Java Memory Model (JMM), Happens-Before & Volatile Semantics\n\nMemory visibility rules apply identically to atomic CAS loops in [[Lock-Free Data Structures]] and heap frames in [[JVM Memory Management]].`,
      updatedAt: '1h ago',
      bookmarked: false,
    },
    {
      id: 'note-virtual-threads',
      folderId: 'folder-02-concurrency',
      filename: 'Virtual Threads & Loom.md',
      title: 'Virtual Threads & Project Loom: Mechanics & Architecture',
      lead: 'Java 21 delivers JEP 444, officially stabilizing user-mode lightweight Virtual Threads. While conventional platform threads implement a rigid 1:1 mapping with native OS kernel threads, virtual threads decouple execution context via an M:N scheduling model orchestrated directly on JVM Carrier Threads backed by standard ForkJoinPool instances.',
      frontmatter: virtualThreadsFm,
      sectionHeading: 'Architectural Guardrails & Pinning Risks',
      sectionBody:
        'Adopting lightweight concurrency does not mean unbounded scalability without trade-offs. The dominant hazard in production migrations is Carrier Thread Pinning, which happens when a virtual thread halts inside a synchronized block or native JNI call, prohibiting the runtime from parking its execution frame.',
      checklist: [
        {
          id: 'chk-1',
          text: 'Avoid pinning carrier threads by removing synchronized blocks in favor of',
          codeInline: 'ReentrantLock',
          checked: true,
        },
        {
          id: 'chk-2',
          text: 'Do not pool virtual threads (they are cheap, ephemeral, and designed to die after completion)',
          checked: true,
        },
        {
          id: 'chk-3',
          text: 'Benchmark JDBC connection pool contention under 100k concurrent requests (use HikariCP max pool ceilings)',
          checked: false,
        },
        {
          id: 'chk-4',
          text: 'Review ThreadLocal memory leakage risks in thread-per-task model',
          codeInline: 'ThreadLocal',
          checked: false,
        },
      ],
      codeBlock: {
        title: 'Structured Concurrency Pattern',
        filename: 'TaskExecutorExample.java',
        language: 'java',
        code: `// Creating an unstarted virtual thread builder with per-task semantics
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 10_000).forEach(i -> {
        executor.submit(() -> {
            Thread.sleep(Duration.ofMillis(100));
            return "Task " + i + " completed on carrier: " + Thread.currentThread();
        });
    });
} // Automatically awaits completion of all child tasks upon block termination`,
      },
      comparisonTable: {
        title: 'Runtime Characteristics Comparison',
        headers: ['Metric / Attribute', 'Platform Threads (OS)', 'Virtual Threads (Loom)'],
        rows: [
          {
            metric: 'Default Stack Footprint',
            baseline: '~1 MB (Fixed memory block)',
            highlight: '~few KB (Heap-allocated dynamically)',
          },
          {
            metric: 'Context Switch Overhead',
            baseline: 'Kernel context shift (~1-2 µs)',
            highlight: 'JVM user-space yield (~nanoseconds)',
          },
          {
            metric: 'Maximum Practical Scale',
            baseline: '~数千 (OOM / thread exhaustion)',
            highlight: 'Millions concurrent (Heap bounded)',
          },
          {
            metric: 'Underlying Scheduler',
            baseline: 'Linux CFS / Windows Preemptive',
            highlight: 'JVM Carrier ForkJoinPool',
          },
        ],
      },
      wikiParagraph:
        'For comprehensive scheduling details, check our cross-references in [[Thread Pools & Executors]] and review memory barriers described in [[Java Memory Model & Volatile]].',
      callout: {
        title: 'Migration Pro Tip',
        body: 'When migrating legacy blocking I/O services to Virtual Threads, ensure third-party JDBC drivers and cryptography libraries avoid synchronized blocks on hot execution paths to prevent pinning carrier workers during slow TCP waits.',
        codeToken: 'synchronized',
      },
      rawMarkdown: serializeFrontmatterAndBody(virtualThreadsFm, virtualThreadsBody),
      outlineOverride: [
        'Overview & Motivations',
        'Platform vs Virtual Threads',
        'JVM Scheduler & Carrier Threads',
        'Eliminating Thread Pinning',
        'Benchmarks & Performance',
      ],
      explicitOutgoing: [
        'ForkJoinPool Architecture',
        'ReentrantLock vs Synchronized',
        'JVM Memory Management',
        'Lock-Free Data Structures',
      ],
      updatedAt: '2m ago',
      bookmarked: true,
    },
    {
      id: 'note-lock-free',
      folderId: 'folder-02-concurrency',
      filename: 'Lock-Free Data Structures.md',
      title: 'Lock-Free Ring Buffers, CAS Loops & ABA Mitigation',
      lead: 'Non-blocking algorithms guarantee system-wide progress using hardware Compare-And-Swap (CAS) primitives without kernel mutex arbitration or carrier pinning.',
      frontmatter: {
        tags: ['java/concurrency', 'lock-free', 'algorithms'],
        status: 'in-progress',
        created: '2024-03-18',
        priority: 'medium',
      },
      sectionHeading: 'False Sharing & Cache Line Padding',
      sectionBody:
        'Adjacent sequence counters sharing a 64-byte L1 cache line trigger continuous MESI invalidations across cores unless padded.',
      checklist: [
        {
          id: 'lf-1',
          text: 'Eliminate synchronized hot spots in ring buffer consumers for carrier compatibility',
          checked: true,
        },
      ],
      wikiParagraph:
        'Lock-free queues rely on acquire-release fences documented in [[Java Memory Model & Volatile]] and [[ReentrantLock vs Synchronized]].',
      rawMarkdown: `# Lock-Free Ring Buffers, CAS Loops & ABA Mitigation\n\nLock-free queues rely on acquire-release fences documented in [[Java Memory Model & Volatile]] and [[ReentrantLock vs Synchronized]].`,
      updatedAt: '3h ago',
    },
    {
      id: 'note-solid',
      folderId: 'folder-02-oop',
      filename: 'SOLID Principles Revisited.md',
      title: 'SOLID Principles Revisited for Modern Composable Systems',
      lead: 'Balancing Algebraic Data Types (sealed interfaces + records in Java 21) with classic object-oriented polymorphism and dependency inversion.',
      frontmatter: {
        tags: ['architecture/oop', 'java', 'design-patterns'],
        status: 'verified',
        created: '2024-02-28',
        priority: 'medium',
      },
      sectionHeading: 'Data-Oriented Programming in Java 21',
      sectionBody:
        'Exhaustive pattern matching over sealed hierarchies makes illegal states unrepresentable at compile time.',
      checklist: [
        {
          id: 'sol-1',
          text: 'Refactor mutable domain DTOs into immutable Java records',
          checked: true,
        },
      ],
      wikiParagraph:
        'Immutable value records simplify concurrent state sharing across [[Thread Pools & Executors]] and [[Distributed Cache Arch]].',
      rawMarkdown: `# SOLID Principles Revisited for Modern Composable Systems\n\nImmutable value records simplify concurrent state sharing across [[Thread Pools & Executors]] and [[Distributed Cache Arch]].`,
      updatedAt: '1d ago',
    },
    {
      id: 'note-distributed-cache',
      folderId: 'folder-03',
      filename: 'Distributed Cache Arch.md',
      title: 'Distributed Cache Architecture: Consistent Hashing & Lease Invalidation',
      lead: 'Multi-region L1/L2 caching topology combining local Caffeine near-caches with Redis cluster shards and lease-based thundering-herd protection.',
      frontmatter: {
        tags: ['system-design', 'distributed-systems', 'caching'],
        status: 'verified',
        created: '2024-03-05',
        priority: 'high',
      },
      sectionHeading: 'Cache Stampede Mitigation',
      sectionBody:
        'Single-flight request coalescing ensures only one worker recomputes an expired hot key while concurrent callers await the shared promise.',
      checklist: [
        {
          id: 'dc-1',
          text: 'Enable single-flight request coalescing for hot catalog keys',
          checked: true,
        },
        {
          id: 'dc-2',
          text: 'Benchmark async Redis lettuce pipeline throughput on [[Virtual Threads & Loom]]',
          checked: false,
        },
      ],
      wikiParagraph:
        'Reviewed in [[System Design Checklist]] and deployed alongside [[Microservice Architecture Review]] using [[Virtual Threads & Loom]] workers.',
      rawMarkdown: `# Distributed Cache Architecture: Consistent Hashing & Lease Invalidation\n\nReviewed in [[System Design Checklist]] and deployed alongside [[Microservice Architecture Review]] using [[Virtual Threads & Loom]] workers.`,
      updatedAt: '4h ago',
      bookmarked: true,
    },
    {
      id: 'note-system-design-checklist',
      folderId: 'folder-03',
      filename: 'System Design Checklist.md',
      title: 'System Design Production Readiness Checklist',
      lead: 'End-to-end architectural review gates covering tail-latency budgets, backpressure, idempotency keys, and JVM concurrency runtime selection.',
      frontmatter: {
        tags: ['system-design', 'architecture/oop'],
        status: 'verified',
        created: '2024-03-01',
        priority: 'high',
      },
      sectionHeading: 'Concurrency & I/O Tier Guidelines',
      sectionBody:
        '...recommend upgrading backend workers to Java 21 [[Virtual Threads & Loom|Virtual Threads]] for high-concurrency ingestion and pairing with [[Distributed Cache Arch]].',
      checklist: [
        {
          id: 'sdc-1',
          text: 'Verify p99 timeout budgets and circuit-breaker thresholds across all RPC hops',
          checked: true,
        },
      ],
      wikiParagraph:
        '...recommend upgrading backend workers to Java 21 [[Virtual Threads & Loom|Virtual Threads]] for high-concurrency ingestion...',
      rawMarkdown: `# System Design Production Readiness Checklist\n\n...recommend upgrading backend workers to Java 21 [[Virtual Threads & Loom|Virtual Threads]] for high-concurrency ingestion...`,
      updatedAt: '2d ago',
    },
    {
      id: 'note-microservice-review',
      folderId: 'folder-03',
      filename: 'Microservice Architecture Review.md',
      title: 'Microservice Architecture & gRPC Dispatch Review',
      lead: 'Analysis of downstream gRPC fan-out bottlenecks, deadline propagation, and carrier thread utilization under peak traffic.',
      frontmatter: {
        tags: ['system-design', 'java/concurrency'],
        status: 'in-progress',
        created: '2024-03-19',
        priority: 'high',
      },
      sectionHeading: 'Downstream gRPC Thread Starvation Analysis',
      sectionBody:
        '...investigating thread starvation using loom virtual threads for downstream gRPC dispatch...',
      checklist: [
        {
          id: 'mar-1',
          text: 'Switch blocking gRPC stubs to virtual-thread executor in order-service',
          checked: false,
        },
      ],
      wikiParagraph:
        '...investigating thread starvation using [[Virtual Threads & Loom]] for downstream gRPC dispatch and [[Thread Pools & Executors]]...',
      rawMarkdown: `# Microservice Architecture & gRPC Dispatch Review\n\n...investigating thread starvation using [[Virtual Threads & Loom]] for downstream gRPC dispatch...`,
      updatedAt: '5h ago',
    },
    {
      id: 'note-forkjoin',
      folderId: 'folder-01',
      filename: 'ForkJoinPool Architecture.md',
      title: 'ForkJoinPool Work-Stealing Deques & Carrier Scheduling',
      lead: 'Internal mechanics of double-ended work queues (deques), LIFO local pops vs FIFO remote steals, and ManagedBlocker compensation.',
      frontmatter: {
        tags: ['java/concurrency', 'computer-science'],
        status: 'verified',
        created: '2024-02-20',
        priority: 'medium',
      },
      sectionHeading: 'Work-Stealing Deque Mechanics',
      sectionBody:
        'Each carrier worker thread processes its own deque in LIFO order for cache locality while idle threads steal from the tail of busy workers in FIFO order.',
      checklist: [],
      wikiParagraph:
        'Powers the default work-stealing scheduler underneath [[Thread Pools & Executors]] and [[JVM Memory Management]].',
      rawMarkdown: `# ForkJoinPool Work-Stealing Deques & Carrier Scheduling\n\nPowers the default work-stealing scheduler underneath [[Thread Pools & Executors]] and [[JVM Memory Management]].`,
      updatedAt: '3d ago',
    },
    {
      id: 'note-reentrantlock',
      folderId: 'folder-01',
      filename: 'ReentrantLock vs Synchronized.md',
      title: 'ReentrantLock (AQS) vs Intrinsic Synchronized Monitors',
      lead: 'Why AbstractQueuedSynchronizer (AQS) locks unmount cleanly on Project Loom while JVM object monitors pin carrier threads in Java 21.',
      frontmatter: {
        tags: ['java/concurrency', 'jvm'],
        status: 'verified',
        created: '2024-03-11',
        priority: 'high',
      },
      sectionHeading: 'AQS Park/Unpark Semantics',
      sectionBody:
        'LockSupport.park() hooks directly into the continuation yield point, releasing the underlying OS carrier thread immediately.',
      checklist: [],
      wikiParagraph:
        'Essential reading for lock contention analysis alongside [[Java Memory Model & Volatile]] and [[Lock-Free Data Structures]].',
      rawMarkdown: `# ReentrantLock (AQS) vs Intrinsic Synchronized Monitors\n\nEssential reading for lock contention analysis alongside [[Java Memory Model & Volatile]] and [[Lock-Free Data Structures]].`,
      updatedAt: '2d ago',
    },
    {
      id: 'note-jvm-memory',
      folderId: 'folder-01',
      filename: 'JVM Memory Management.md',
      title: 'JVM Stack Chunking, ZGC Generational & Metaspace Layout',
      lead: 'How Project Loom stores frozen continuation stack frames as compact heap objects collected by Generational ZGC with sub-millisecond pauses.',
      frontmatter: {
        tags: ['jvm', 'java/concurrency', 'architecture/oop'],
        status: 'verified',
        created: '2024-03-08',
        priority: 'medium',
      },
      sectionHeading: 'StackChunk Objects on the Heap',
      sectionBody:
        'When a virtual thread parks, its stack frames are copied to a heap-allocated jdk.internal.vm.StackChunk rather than reserving a 1MB native mmap region.',
      checklist: [],
      wikiParagraph:
        'See [[Java Memory Model & Volatile]] and [[ForkJoinPool Architecture]] for heap footprint benchmarks.',
      rawMarkdown: `# JVM Stack Chunking, ZGC Generational & Metaspace Layout\n\nSee [[Java Memory Model & Volatile]] and [[ForkJoinPool Architecture]] for heap footprint benchmarks.`,
      updatedAt: '4d ago',
    },
    {
      id: 'note-daily-2026-11-01',
      folderId: 'folder-04',
      filename: '2026-11-01 Engineering Journal.md',
      title: '2026-11-01 — Daily Architecture & Migration Log',
      lead: 'Completed HikariCP connection pool stress test with Java 21 virtual threads and audited synchronized blocks across payment-gateway dependencies.',
      frontmatter: {
        tags: ['daily-notes', 'java/concurrency', 'system-design'],
        status: 'in-progress',
        created: '2026-11-01',
        priority: 'high',
      },
      sectionHeading: 'Today’s Engineering Priorities',
      sectionBody:
        'Verified zero carrier thread pinning under `-Djdk.tracePinnedThreads=full` after replacing legacy synchronized blocks with ReentrantLock.',
      checklist: [
        {
          id: 'dj-1',
          text: 'Run JFR pinning profile on staging cluster',
          checked: true,
        },
        {
          id: 'dj-2',
          text: 'Update [[System Design Checklist]] with JDBC semaphore guardrails',
          checked: false,
        },
      ],
      wikiParagraph:
        'Linked notes touched today: [[ReentrantLock vs Synchronized]], [[System Design Checklist]], and [[Distributed Cache Arch]].',
      rawMarkdown: `# 2026-11-01 — Daily Architecture & Migration Log\n\nLinked notes touched today: [[ReentrantLock vs Synchronized]], [[System Design Checklist]], and [[Distributed Cache Arch]].`,
      updatedAt: 'Just now',
      isDailyNote: true,
      dailyDate: '2026-11-01',
    },
  ];

  return notes;
}

export const INITIAL_NOTES: NoteRecord[] = createSeedNotes();

export const INITIAL_CANVAS_NODES: CanvasNode[] = [
  {
    id: 'canvas-node-1',
    title: 'Virtual Threads (JEP 444)',
    subtitle: 'M:N User-Mode Continuations on Heap StackChunks',
    category: 'runtime',
    linkedNoteId: 'note-virtual-threads',
    x: 48,
    y: 90,
    width: 245,
    metrics: 'Footprint: ~2 KB / thread',
    status: 'active',
  },
  {
    id: 'canvas-node-2',
    title: 'Carrier ForkJoinPool',
    subtitle: 'Work-Stealing FIFO/LIFO OS Kernel Scheduler',
    category: 'scheduler',
    linkedNoteId: 'note-forkjoin',
    x: 435,
    y: 75,
    width: 245,
    metrics: 'Workers: N_cpu = 16',
    status: 'nominal',
  },
  {
    id: 'canvas-node-3',
    title: 'Pinning Guardrail (AQS)',
    subtitle: 'ReentrantLock unmounts continuation cleanly on park()',
    category: 'memory',
    linkedNoteId: 'note-reentrantlock',
    x: 435,
    y: 265,
    width: 245,
    metrics: '0 Pinned Events (JFR)',
    status: 'warning',
  },
  {
    id: 'canvas-node-4',
    title: 'Distributed Cache & I/O',
    subtitle: 'Non-blocking socket poller + HikariCP bounded semaphore',
    category: 'io',
    linkedNoteId: 'note-distributed-cache',
    x: 825,
    y: 170,
    width: 245,
    metrics: 'p99 Latency: 1.8 ms',
    status: 'nominal',
  },
];

export const INITIAL_CANVAS_EDGES: CanvasEdge[] = [
  {
    id: 'edge-1',
    fromId: 'canvas-node-1',
    toId: 'canvas-node-2',
    label: 'mounts / unmounts',
  },
  {
    id: 'edge-2',
    fromId: 'canvas-node-1',
    toId: 'canvas-node-3',
    label: 'yields via LockSupport',
  },
  {
    id: 'edge-3',
    fromId: 'canvas-node-2',
    toId: 'canvas-node-4',
    label: 'non-blocking Poller',
  },
  {
    id: 'edge-4',
    fromId: 'canvas-node-3',
    toId: 'canvas-node-4',
    label: 'guards JDBC pool',
  },
];
