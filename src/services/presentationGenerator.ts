import pptxgen from 'pptxgenjs';

export interface PresentationMeta {
  collegeName: string;
  department: string;
  academicYear: string;
  projectGuide: string;
  teamMembers: Array<{ name: string; rollNo: string }>;
}

export const DEFAULT_PRESENTATION_META: PresentationMeta = {
  collegeName: 'Department of Computer Science & Engineering',
  department: 'School of Computing and Information Technology',
  academicYear: 'Academic Year 2026 – 2027',
  projectGuide: 'Dr. S. K. Ramanathan, Professor',
  teamMembers: [
    { name: 'Alex Johnson (Team Lead)', rollNo: 'CS26-001' },
    { name: 'Priya Sharma (Frontend/UI)', rollNo: 'CS26-002' },
    { name: 'Marcus Chen (Data Model/IDB)', rollNo: 'CS26-003' },
    { name: 'David Kim (Graph Engine)', rollNo: 'CS26-004' },
    { name: 'Amina Al-Mansoor (Markdown/Links)', rollNo: 'CS26-005' },
    { name: 'Rohan Verma (Canvas & Spatial)', rollNo: 'CS26-006' },
    { name: 'Elena Rostova (Testing & QA)', rollNo: 'CS26-007' },
  ],
};

// Design tokens matching Obsidian Slate palette
const COLORS = {
  bg: '0B1326', // Deep navy
  surface: '131B2E', // Surface low
  surfaceHigh: '222A3D', // Card surface
  textLight: 'DAE2FD', // Near-white
  textMuted: '908FA0', // Cool grey
  accentCyan: '4EDEA3', // Secondary teal/cyan
  accentPrimary: 'C0C1FF', // Primary muted blue/indigo
  accentAmber: 'FFB95F', // Tertiary amber
  border: '2D3449',
};

export async function generatePptxFile(meta: PresentationMeta = DEFAULT_PRESENTATION_META): Promise<void> {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.title = 'Knowledge Management & Note-Taking Platform';
  pres.author = meta.teamMembers.map((m) => m.name).join(', ');
  pres.subject = 'College Software Development Project Presentation';

  // Helper for consistent slide background and header
  const createBaseSlide = (category: string, title: string) => {
    const slide = pres.addSlide();
    slide.background = { color: COLORS.bg };

    // Header Category Kicker
    slide.addText(category.toUpperCase(), {
      x: 0.8,
      y: 0.45,
      w: 8.5,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: COLORS.accentCyan,
      fontFace: 'Arial',
    });

    // Main Heading
    slide.addText(title, {
      x: 0.8,
      y: 0.75,
      w: 11.5,
      h: 0.6,
      fontSize: 22,
      bold: true,
      color: COLORS.textLight,
      fontFace: 'Arial',
    });

    // Subtle header divider
    slide.addShape(pres.ShapeType.line, {
      x: 0.8,
      y: 1.4,
      w: 11.7,
      h: 0,
      line: { color: COLORS.border, width: 1 },
    });

    // Footer
    slide.addText('Knowledge Management Platform | Software Engineering Project Deck', {
      x: 0.8,
      y: 7.0,
      w: 8.0,
      h: 0.3,
      fontSize: 9,
      color: COLORS.textMuted,
      fontFace: 'Arial',
    });

    return slide;
  };

  // ==========================================
  // SLIDE 1: Title & Project Introduction
  // ==========================================
  {
    const s1 = pres.addSlide();
    s1.background = { color: COLORS.bg };

    // Top Institution Banner
    s1.addText(meta.collegeName.toUpperCase(), {
      x: 0.8,
      y: 0.5,
      w: 11.7,
      h: 0.35,
      fontSize: 11,
      bold: true,
      color: COLORS.accentCyan,
      fontFace: 'Arial',
      align: 'center',
    });

    s1.addText(`${meta.department} · ${meta.academicYear}`, {
      x: 0.8,
      y: 0.85,
      w: 11.7,
      h: 0.3,
      fontSize: 10,
      color: COLORS.textMuted,
      fontFace: 'Arial',
      align: 'center',
    });

    // Project Main Title
    s1.addText('Knowledge Management &\nNote-Taking Platform', {
      x: 0.8,
      y: 1.5,
      w: 11.7,
      h: 1.4,
      fontSize: 32,
      bold: true,
      color: COLORS.textLight,
      fontFace: 'Arial',
      align: 'center',
    });

    s1.addText('A centralized workspace to create, organize, connect, and explore knowledge.', {
      x: 1.5,
      y: 3.0,
      w: 10.3,
      h: 0.4,
      fontSize: 14,
      color: COLORS.accentPrimary,
      fontFace: 'Arial',
      align: 'center',
    });

    // Supervisor Box
    s1.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: 3.7,
      w: 11.7,
      h: 0.7,
      fill: { color: COLORS.surface },
      line: { color: COLORS.border, width: 1 },
      rectRadius: 0.1,
    });
    s1.addText(`PROJECT SUPERVISOR / GUIDE:  ${meta.projectGuide}`, {
      x: 1.0,
      y: 3.85,
      w: 11.3,
      h: 0.4,
      fontSize: 11,
      bold: true,
      color: COLORS.accentCyan,
      fontFace: 'Arial',
      align: 'center',
    });

    // Team Members Grid (7 members)
    s1.addText('PROJECT TEAM MEMBERS', {
      x: 0.8,
      y: 4.65,
      w: 11.7,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: COLORS.textMuted,
      fontFace: 'Arial',
    });

    meta.teamMembers.forEach((member, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const cardX = 0.8 + col * 2.95;
      const cardY = 5.05 + row * 0.95;

      s1.addShape(pres.ShapeType.roundRect, {
        x: cardX,
        y: cardY,
        w: 2.85,
        h: 0.82,
        fill: { color: COLORS.surfaceHigh },
        line: { color: COLORS.border, width: 1 },
        rectRadius: 0.08,
      });

      s1.addText(member.name, {
        x: cardX + 0.15,
        y: cardY + 0.12,
        w: 2.55,
        h: 0.35,
        fontSize: 10,
        bold: true,
        color: COLORS.textLight,
        fontFace: 'Arial',
      });

      s1.addText(`Roll No: ${member.rollNo}`, {
        x: cardX + 0.15,
        y: cardY + 0.45,
        w: 2.55,
        h: 0.25,
        fontSize: 9,
        color: COLORS.accentPrimary,
        fontFace: 'Arial',
      });
    });
  }

  // ==========================================
  // SLIDE 2: Problem Statement
  // ==========================================
  {
    const s2 = createBaseSlide('01 / Context & Problem Analysis', 'The Problem with Scattered Knowledge');

    const problems = [
      {
        title: 'Information Fragmentation',
        desc: 'Notes, snippets, and references are scattered across disparate tools, web apps, text files, and chat logs.',
        icon: '📁',
      },
      {
        title: 'Scale & Organization Collapse',
        desc: 'As vaults exceed hundreds of notes, rigid hierarchical folders fail to represent interconnected multidimensional ideas.',
        icon: '📉',
      },
      {
        title: 'Disconnected Insights & Isolation',
        desc: 'Traditional text files lack bidirectional cross-references. Crucial contextual relationships between ideas are lost.',
        icon: '🔗',
      },
      {
        title: 'Slow & Inefficient Retrieval',
        desc: 'Keyword-only search yields false positives and misses conceptual connections, leading to wasted time re-researching.',
        icon: '⏳',
      },
    ];

    problems.forEach((p, idx) => {
      const x = 0.8 + (idx % 2) * 5.95;
      const y = 1.7 + Math.floor(idx / 2) * 2.3;

      s2.addShape(pres.ShapeType.roundRect, {
        x,
        y,
        w: 5.75,
        h: 2.05,
        fill: { color: COLORS.surface },
        line: { color: COLORS.border, width: 1 },
        rectRadius: 0.12,
      });

      s2.addText(`${p.icon}  ${p.title}`, {
        x: x + 0.3,
        y: y + 0.3,
        w: 5.15,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: COLORS.accentAmber,
        fontFace: 'Arial',
      });

      s2.addText(p.desc, {
        x: x + 0.3,
        y: y + 0.8,
        w: 5.15,
        h: 0.95,
        fontSize: 11,
        color: COLORS.textLight,
        fontFace: 'Arial',
        lineSpacing: 16,
      });
    });
  }

  // ==========================================
  // SLIDE 3: Proposed Solution
  // ==========================================
  {
    const s3 = createBaseSlide('02 / System Proposition', 'One Connected Knowledge Workspace');

    s3.addText('A unified software engineering environment that transforms passive notes into an active knowledge network.', {
      x: 0.8,
      y: 1.55,
      w: 11.7,
      h: 0.4,
      fontSize: 12,
      color: COLORS.accentPrimary,
      fontFace: 'Arial',
    });

    const pillars = [
      { step: '01', title: 'Create Notes', desc: 'Markdown-compatible rich editor with YAML frontmatter, checklists, code blocks & tables.' },
      { step: '02', title: 'Organize System', desc: 'Dual paradigm: structural folders + fluid tags (#tag) across architectural boundaries.' },
      { step: '03', title: 'Connect Concepts', desc: 'First-class [[WikiLinks]] with alias & heading anchors, deriving bidirectional links automatically.' },
      { step: '04', title: 'Explore Visually', desc: 'Interactive Graph Visualizer and freeform Canvas for spatial concept decomposition.' },
      { step: '05', title: 'Retrieve Instantly', desc: 'Sub-millisecond Cmd+K command palette, full-vault text index & local-first IndexedDB storage.' },
    ];

    pillars.forEach((pil, idx) => {
      const x = 0.8 + idx * 2.38;
      const y = 2.2;

      s3.addShape(pres.ShapeType.roundRect, {
        x,
        y,
        w: 2.22,
        h: 4.2,
        fill: { color: COLORS.surface },
        line: { color: idx === 2 ? COLORS.accentCyan : COLORS.border, width: idx === 2 ? 1.5 : 1 },
        rectRadius: 0.1,
      });

      s3.addText(pil.step, {
        x: x + 0.2,
        y: y + 0.25,
        w: 1.8,
        h: 0.4,
        fontSize: 20,
        bold: true,
        color: COLORS.accentCyan,
        fontFace: 'Arial',
      });

      s3.addText(pil.title, {
        x: x + 0.2,
        y: y + 0.8,
        w: 1.82,
        h: 0.6,
        fontSize: 13,
        bold: true,
        color: COLORS.textLight,
        fontFace: 'Arial',
      });

      s3.addText(pil.desc, {
        x: x + 0.2,
        y: y + 1.5,
        w: 1.82,
        h: 2.4,
        fontSize: 10,
        color: COLORS.textMuted,
        fontFace: 'Arial',
        lineSpacing: 15,
      });
    });
  }

  // ==========================================
  // SLIDE 4: Project Objectives & Target Users
  // ==========================================
  {
    const s4 = createBaseSlide('03 / Requirements & Scope', 'Project Objectives & Target Users');

    // Left Column: Objectives
    s4.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: 1.7,
      w: 5.7,
      h: 4.8,
      fill: { color: COLORS.surface },
      line: { color: COLORS.border, width: 1 },
      rectRadius: 0.1,
    });

    s4.addText('ENGINEERING OBJECTIVES', {
      x: 1.1,
      y: 1.95,
      w: 5.1,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: COLORS.accentCyan,
      fontFace: 'Arial',
    });

    const objectives = [
      'Structured digital workspace for technical documentation & research.',
      'Strict Markdown fidelity: preserves raw markdown, syntax & frontmatter without lock-in.',
      'Automated relationship discovery via bidirectional backlinks & outgoing matrices.',
      'Sub-millisecond retrieval with client-side indexing and Cmd+K command palette.',
      'Zero cloud dependency: 100% functional local-first persistence via IndexedDB.',
    ];

    objectives.forEach((obj, i) => {
      s4.addText(`•  ${obj}`, {
        x: 1.1,
        y: 2.45 + i * 0.76,
        w: 5.1,
        h: 0.65,
        fontSize: 10.5,
        color: COLORS.textLight,
        fontFace: 'Arial',
        lineSpacing: 15,
      });
    });

    // Right Column: Target Users
    s4.addShape(pres.ShapeType.roundRect, {
      x: 6.8,
      y: 1.7,
      w: 5.7,
      h: 4.8,
      fill: { color: COLORS.surface },
      line: { color: COLORS.border, width: 1 },
      rectRadius: 0.1,
    });

    s4.addText('PRIMARY USER PERSONAS', {
      x: 7.1,
      y: 1.95,
      w: 5.1,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: COLORS.accentPrimary,
      fontFace: 'Arial',
    });

    const users = [
      { role: 'Software Developers & Architects', detail: 'System design specs, ADRs, concurrency invariants, code snippets & technical matrices.' },
      { role: 'Researchers & Academics', detail: 'Literature reviews, interconnected citations, structured frontmatter & cross-disciplinary links.' },
      { role: 'Engineering Students', detail: 'Course modules, lab journals, algorithmic summaries & revision knowledge graphs.' },
      { role: 'Technical Authors & Writers', detail: 'Article planning, reference mapping, draft revisions & seamless Markdown export.' },
    ];

    users.forEach((u, i) => {
      s4.addText(`${u.role}`, {
        x: 7.1,
        y: 2.45 + i * 0.98,
        w: 5.1,
        h: 0.3,
        fontSize: 11,
        bold: true,
        color: COLORS.textLight,
        fontFace: 'Arial',
      });
      s4.addText(u.detail, {
        x: 7.1,
        y: 2.75 + i * 0.98,
        w: 5.1,
        h: 0.55,
        fontSize: 9.5,
        color: COLORS.textMuted,
        fontFace: 'Arial',
        lineSpacing: 14,
      });
    });
  }

  // ==========================================
  // SLIDE 5: Core Application Features
  // ==========================================
  {
    const s5 = createBaseSlide('04 / Functional Architecture', 'Core Note-Taking Features');

    // Left Column: Feature Highlights
    const feats = [
      { name: 'Markdown-Compatible Rich Editor', desc: 'Live prose preview, syntax-highlighted code blocks with 1-click copy, and raw markdown editor.' },
      { name: 'Hierarchical File Explorer', desc: 'Infinite nested folder trees with breadcrumbs, quick file filter (Cmd+F), and pinned bookmarks.' },
      { name: 'Multi-Tab Workspace', desc: 'Simultaneous note tabs with active indicators, closing triggers, and side-by-side split pane inspection.' },
      { name: 'Checklists & Task Arrays', desc: 'Interactive task states with persistent check toggles and live status updates.' },
      { name: 'Local Autosave & Data Safety', desc: 'Batched transactional IndexedDB persistence with UTF-8 size & word counter status bars.' },
    ];

    feats.forEach((f, i) => {
      s5.addShape(pres.ShapeType.roundRect, {
        x: 0.8,
        y: 1.7 + i * 0.96,
        w: 5.6,
        h: 0.85,
        fill: { color: COLORS.surface },
        line: { color: COLORS.border, width: 1 },
        rectRadius: 0.08,
      });

      s5.addText(f.name, {
        x: 1.0,
        y: 1.8 + i * 0.96,
        w: 5.2,
        h: 0.28,
        fontSize: 11,
        bold: true,
        color: COLORS.accentCyan,
        fontFace: 'Arial',
      });

      s5.addText(f.desc, {
        x: 1.0,
        y: 2.1 + i * 0.96,
        w: 5.2,
        h: 0.4,
        fontSize: 9,
        color: COLORS.textMuted,
        fontFace: 'Arial',
        lineSpacing: 13,
      });
    });

    // Right Column: Mockup Card showing actual Editor Workspace
    s5.addShape(pres.ShapeType.roundRect, {
      x: 6.7,
      y: 1.7,
      w: 5.8,
      h: 4.8,
      fill: { color: COLORS.surfaceHigh },
      line: { color: COLORS.accentPrimary, width: 1 },
      rectRadius: 0.1,
    });

    s5.addText('ACTUAL PLATFORM WORKSPACE INTERFACE', {
      x: 7.0,
      y: 1.9,
      w: 5.2,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: COLORS.accentPrimary,
      fontFace: 'Arial',
    });

    // Reference description box
    s5.addText(
      '3-Pane Desktop Layout:\n• Left: Vault explorer, bookmarks, #tags & folder tree\n• Center: Active note ("Virtual Threads & Loom.md"), YAML properties, structured code blocks, and comparison matrix\n• Right: Table of contents, 4 backlinks & 6 outgoing references\n• Bottom: Live metrics (1,428 words · 9,842 chars · 14.2 KB)',
      {
        x: 7.0,
        y: 2.3,
        w: 5.2,
        h: 3.8,
        fontSize: 10,
        color: COLORS.textLight,
        fontFace: 'Arial',
        lineSpacing: 18,
      }
    );
  }

  // ==========================================
  // SLIDE 6: Knowledge Management Features
  // ==========================================
  {
    const s6 = createBaseSlide('05 / Knowledge Network', 'Turning Notes into Connected Knowledge');

    const kmPillars = [
      {
        term: 'Internal [[WikiLinks]]',
        highlight: 'Bidirectional Synapses',
        explanation: 'Clickable cross-references connecting notes directly. Supports aliases ([[Target|Alias]]) and heading anchors ([[Target#Section]]).',
      },
      {
        term: 'Automated Backlinks',
        highlight: 'Contextual Ingestion',
        explanation: 'Dynamic reverse lookup index identifying every external note that cites the active document, displaying inline context excerpts.',
      },
      {
        term: 'Taxonomic #Tags',
        highlight: 'Cross-Folder Filtering',
        explanation: 'Fluid non-hierarchical tagging (#java/concurrency, #system-design) allowing thematic slicing irrespective of folder location.',
      },
      {
        term: 'YAML Frontmatter Properties',
        highlight: 'Structured Metadata',
        explanation: 'Type-safe frontmatter blocks tracking status (in-progress, verified), creation dates, priority (high, medium), and aliases.',
      },
    ];

    kmPillars.forEach((km, idx) => {
      const x = 0.8 + (idx % 2) * 5.95;
      const y = 1.7 + Math.floor(idx / 2) * 2.35;

      s6.addShape(pres.ShapeType.roundRect, {
        x,
        y,
        w: 5.75,
        h: 2.1,
        fill: { color: COLORS.surface },
        line: { color: COLORS.border, width: 1 },
        rectRadius: 0.1,
      });

      s6.addText(km.term, {
        x: x + 0.3,
        y: y + 0.25,
        w: 5.15,
        h: 0.35,
        fontSize: 13,
        bold: true,
        color: COLORS.accentCyan,
        fontFace: 'Arial',
      });

      s6.addText(km.highlight.toUpperCase(), {
        x: x + 0.3,
        y: y + 0.6,
        w: 5.15,
        h: 0.25,
        fontSize: 9,
        bold: true,
        color: COLORS.accentAmber,
        fontFace: 'Arial',
      });

      s6.addText(km.explanation, {
        x: x + 0.3,
        y: y + 0.9,
        w: 5.15,
        h: 1.05,
        fontSize: 10,
        color: COLORS.textLight,
        fontFace: 'Arial',
        lineSpacing: 15,
      });
    });
  }

  // ==========================================
  // SLIDE 7: Advanced Knowledge Exploration
  // ==========================================
  {
    const s7 = createBaseSlide('06 / Advanced Exploration', 'Explore Information Beyond Folders');

    const advancedSections = [
      {
        title: 'Graph Visualizer',
        badge: 'Topological Relationship Map',
        points: [
          'Interactive force-directed node-and-edge layout.',
          'Color-coded domains (Java Concurrency, CS, Distributed).',
          'Live in-degree and out-degree connectivity telemetry.',
          'Double-click node to open note directly in editor.',
        ],
      },
      {
        title: 'Spatial Canvas Board',
        badge: 'Freeform Concept Mapping',
        points: [
          'Spatial 2D whiteboard for architecture decomposition.',
          'Connect cards with labeled directional vectors.',
          'Links directly to underlying vault note documents.',
          'Nudge, pan, zoom, and spatial card re-arrangement.',
        ],
      },
      {
        title: 'Structured Tables & Matrix',
        badge: 'Database-Style Analysis',
        points: [
          'Technical comparison matrices (e.g. Platform vs Virtual).',
          'Structured frontmatter property query views.',
          'Live metadata sorting by priority, tag, and date.',
          'Clean tabular numerals and borderless scan rows.',
        ],
      },
    ];

    advancedSections.forEach((sec, idx) => {
      const x = 0.8 + idx * 3.98;
      const y = 1.7;

      s7.addShape(pres.ShapeType.roundRect, {
        x,
        y,
        w: 3.75,
        h: 4.8,
        fill: { color: COLORS.surface },
        line: { color: idx === 0 ? COLORS.accentCyan : COLORS.border, width: idx === 0 ? 1.5 : 1 },
        rectRadius: 0.1,
      });

      s7.addText(sec.title, {
        x: x + 0.25,
        y: y + 0.3,
        w: 3.25,
        h: 0.4,
        fontSize: 15,
        bold: true,
        color: COLORS.textLight,
        fontFace: 'Arial',
      });

      s7.addText(sec.badge.toUpperCase(), {
        x: x + 0.25,
        y: y + 0.7,
        w: 3.25,
        h: 0.25,
        fontSize: 8.5,
        bold: true,
        color: COLORS.accentCyan,
        fontFace: 'Arial',
      });

      sec.points.forEach((pt, pIdx) => {
        s7.addText(`•  ${pt}`, {
          x: x + 0.25,
          y: y + 1.2 + pIdx * 0.82,
          w: 3.25,
          h: 0.72,
          fontSize: 9.5,
          color: COLORS.textLight,
          fontFace: 'Arial',
          lineSpacing: 14,
        });
      });
    });
  }

  // ==========================================
  // SLIDE 8: Technology Stack & System Architecture
  // ==========================================
  {
    const s8 = createBaseSlide('07 / Software Architecture', 'Proposed Technology Stack & System Layers');

    const layers = [
      {
        layer: '1. Presentation Layer (SPA)',
        tech: 'React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · Obsidian Slate Tokens · Material Icons',
        desc: 'Responsive 3-pane desktop workspace, high-density typography, custom scrollbars, and accessible controls.',
      },
      {
        layer: '2. Editor & State Management',
        tech: 'Custom Markdown Engine / Tiptap AST · Reactive Workspace State · Frontmatter Parser',
        desc: 'Real-time bidirectional link resolution, YAML serialization, and sub-millisecond document metric calculation.',
      },
      {
        layer: '3. Local Persistence Layer',
        tech: 'IndexedDB (YourNotesKnowledgeVaultDB) · Web Storage API · JSON Schema v1',
        desc: 'Local-first zero-latency storage. Transactional writes protect user data with exportable .md & .json backups.',
      },
      {
        layer: '4. High-Thinking & Cloud Backend',
        tech: 'Express.js · @google/genai (gemini-4-argon) · Future: Supabase Auth & PostgreSQL RLS',
        desc: 'Server-side high-thinking architectural synthesis; prepared for multi-device sync with Row Level Security.',
      },
    ];

    layers.forEach((l, i) => {
      s8.addShape(pres.ShapeType.roundRect, {
        x: 0.8,
        y: 1.7 + i * 1.22,
        w: 11.7,
        h: 1.08,
        fill: { color: COLORS.surface },
        line: { color: i === 3 ? COLORS.accentAmber : COLORS.border, width: 1 },
        rectRadius: 0.08,
      });

      s8.addText(l.layer, {
        x: 1.1,
        y: 1.82 + i * 1.22,
        w: 4.2,
        h: 0.3,
        fontSize: 12,
        bold: true,
        color: i === 3 ? COLORS.accentAmber : COLORS.accentCyan,
        fontFace: 'Arial',
      });

      s8.addText(l.tech, {
        x: 5.4,
        y: 1.82 + i * 1.22,
        w: 6.8,
        h: 0.3,
        fontSize: 10,
        bold: true,
        color: COLORS.accentPrimary,
        fontFace: 'Arial',
      });

      s8.addText(l.desc, {
        x: 1.1,
        y: 2.22 + i * 1.22,
        w: 11.1,
        h: 0.45,
        fontSize: 9.5,
        color: COLORS.textLight,
        fontFace: 'Arial',
      });
    });
  }

  // ==========================================
  // SLIDE 9: Implementation Workflow & Roadmap
  // ==========================================
  {
    const s9 = createBaseSlide('08 / Engineering Roadmap', 'Implementation Milestones & Verification');

    const milestones = [
      { id: 'M1', title: 'Data Model & Specs', status: 'VERIFIED', desc: 'Normalized NoteRecord, FolderRecord, and Link AST specifications.' },
      { id: 'M2', title: 'Obsidian Slate UI Shell', status: 'VERIFIED', desc: '3-pane workspace with top bar, left rail, center stage & inspector.' },
      { id: 'M3', title: 'Editor & Local Persistence', status: 'VERIFIED', desc: 'IndexedDB & localStorage engine with .md import/export.' },
      { id: 'M4', title: 'WikiLinks & Rename Engine', status: 'VERIFIED', desc: 'Bidirectional link resolution, backlinks & rename propagation.' },
      { id: 'M5', title: 'Daily Journal & Bookmarks', status: 'VERIFIED', desc: 'Timestamped engineering logs, bookmarks, and TOC outline.' },
      { id: 'M6', title: 'Graph & Spatial Canvas', status: 'VERIFIED', desc: 'Interactive node-link graph visualizer and spatial concept canvas.' },
      { id: 'M7', title: 'High-Thinking AI Engine', status: 'VERIFIED', desc: 'Server-side gemini-4-argon synthesis with ThinkingLevel.HIGH.' },
      { id: 'M8', title: 'End-to-End Automated Tests', status: 'VERIFIED', desc: 'Unit testing via node:test and Playwright headless verification.' },
    ];

    milestones.forEach((m, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const x = 0.8 + col * 2.98;
      const y = 1.7 + row * 2.45;

      s9.addShape(pres.ShapeType.roundRect, {
        x,
        y,
        w: 2.85,
        h: 2.25,
        fill: { color: COLORS.surface },
        line: { color: COLORS.border, width: 1 },
        rectRadius: 0.1,
      });

      s9.addText(m.id, {
        x: x + 0.2,
        y: y + 0.2,
        w: 1.2,
        h: 0.35,
        fontSize: 16,
        bold: true,
        color: COLORS.accentCyan,
        fontFace: 'Arial',
      });

      s9.addText(m.status, {
        x: x + 1.4,
        y: y + 0.22,
        w: 1.25,
        h: 0.25,
        fontSize: 8.5,
        bold: true,
        color: COLORS.accentCyan,
        fontFace: 'Arial',
        align: 'right',
      });

      s9.addText(m.title, {
        x: x + 0.2,
        y: y + 0.65,
        w: 2.45,
        h: 0.5,
        fontSize: 11,
        bold: true,
        color: COLORS.textLight,
        fontFace: 'Arial',
      });

      s9.addText(m.desc, {
        x: x + 0.2,
        y: y + 1.2,
        w: 2.45,
        h: 0.9,
        fontSize: 9,
        color: COLORS.textMuted,
        fontFace: 'Arial',
        lineSpacing: 14,
      });
    });
  }

  // ==========================================
  // SLIDE 10: Future Scope
  // ==========================================
  {
    const s10 = createBaseSlide('09 / Future Horizons', 'Future Scope & Planned Capabilities');

    const futureItems = [
      {
        cat: 'Multi-Device Cloud Sync',
        title: 'End-to-End Encrypted Cloud Storage',
        desc: 'Delta-based synchronization across desktop and mobile devices using PostgreSQL and Row Level Security.',
      },
      {
        cat: 'Live Collaboration',
        title: 'CRDT / Operational Transformation',
        desc: 'Peer-to-peer or server-authoritative multi-user collaborative editing on shared engineering canvases.',
      },
      {
        cat: 'Plugin Ecosystem',
        title: 'Extensible API & Custom Renderers',
        desc: 'Sandboxed iframe extension system for custom LaTeX renderers, Mermaid diagrams, and Git versioning hooks.',
      },
      {
        cat: 'Native Mobile & Desktop',
        title: 'Tauri / Electron & Native PWA',
        desc: 'High-performance offline desktop wrapper with native filesystem access and mobile touch-optimized companion app.',
      },
      {
        cat: 'AI Knowledge Discovery',
        title: 'Semantic Vector Embeddings & Agent QA',
        desc: 'Local-first vector indexing for automated link suggestions, conceptual clustering, and automated summarization.',
      },
      {
        cat: 'Public Publishing',
        title: 'Static Site Generator & Web Sharing',
        desc: 'One-click publish workflow exporting connected notes into an interactive digital garden documentation website.',
      },
    ];

    futureItems.forEach((f, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const x = 0.8 + col * 3.98;
      const y = 1.7 + row * 2.45;

      s10.addShape(pres.ShapeType.roundRect, {
        x,
        y,
        w: 3.75,
        h: 2.25,
        fill: { color: COLORS.surface },
        line: { color: COLORS.border, width: 1 },
        rectRadius: 0.1,
      });

      s10.addText(f.cat.toUpperCase(), {
        x: x + 0.25,
        y: y + 0.2,
        w: 3.25,
        h: 0.25,
        fontSize: 8.5,
        bold: true,
        color: COLORS.accentAmber,
        fontFace: 'Arial',
      });

      s10.addText(f.title, {
        x: x + 0.25,
        y: y + 0.5,
        w: 3.25,
        h: 0.5,
        fontSize: 11.5,
        bold: true,
        color: COLORS.textLight,
        fontFace: 'Arial',
      });

      s10.addText(f.desc, {
        x: x + 0.25,
        y: y + 1.05,
        w: 3.25,
        h: 1.05,
        fontSize: 9.5,
        color: COLORS.textMuted,
        fontFace: 'Arial',
        lineSpacing: 14,
      });
    });
  }

  // ==========================================
  // SLIDE 11: Conclusion & Q&A
  // ==========================================
  {
    const s11 = createBaseSlide('10 / Conclusion & Evaluation', 'Building a Connected Knowledge System');

    // Central Banner Box
    s11.addShape(pres.ShapeType.roundRect, {
      x: 1.5,
      y: 1.8,
      w: 10.3,
      h: 2.2,
      fill: { color: COLORS.surfaceHigh },
      line: { color: COLORS.accentCyan, width: 1.5 },
      rectRadius: 0.12,
    });

    s11.addText('CORE VALUE PROPOSITION', {
      x: 1.8,
      y: 2.05,
      w: 9.7,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: COLORS.accentCyan,
      fontFace: 'Arial',
      align: 'center',
    });

    s11.addText('“Not just a place to store notes — a workspace to build and explore knowledge.”', {
      x: 1.8,
      y: 2.45,
      w: 9.7,
      h: 0.8,
      fontSize: 20,
      bold: true,
      color: COLORS.textLight,
      fontFace: 'Arial',
      align: 'center',
    });

    s11.addText('Local-First Longevity  ·  Bidirectional [[WikiLinks]]  ·  Topological Graph & Canvas  ·  High-Thinking Synthesis', {
      x: 1.8,
      y: 3.35,
      w: 9.7,
      h: 0.4,
      fontSize: 11,
      color: COLORS.accentPrimary,
      fontFace: 'Arial',
      align: 'center',
    });

    // 3 Final Takeaway Pillars
    const takeaways = [
      { title: '1. Structured Productivity', desc: 'Unifies rich Markdown prose, task checklists, code snippets & YAML properties in a distraction-free 3-pane layout.' },
      { title: '2. Relational Intelligence', desc: 'Replaces rigid folder silos with automatic backlinks, outgoing cross-references, and global network graphs.' },
      { title: '3. Technical Longevity', desc: 'Standard open formats (.md) with offline-first IndexedDB guarantee zero proprietary vendor lock-in.' },
    ];

    takeaways.forEach((t, i) => {
      const x = 1.5 + i * 3.52;
      const y = 4.3;

      s11.addShape(pres.ShapeType.roundRect, {
        x,
        y,
        w: 3.26,
        h: 1.7,
        fill: { color: COLORS.surface },
        line: { color: COLORS.border, width: 1 },
        rectRadius: 0.08,
      });

      s11.addText(t.title, {
        x: x + 0.2,
        y: y + 0.2,
        w: 2.86,
        h: 0.35,
        fontSize: 11,
        bold: true,
        color: COLORS.accentCyan,
        fontFace: 'Arial',
      });

      s11.addText(t.desc, {
        x: x + 0.2,
        y: y + 0.6,
        w: 2.86,
        h: 0.95,
        fontSize: 9,
        color: COLORS.textMuted,
        fontFace: 'Arial',
        lineSpacing: 13,
      });
    });

    // Thank You / Q&A Box
    s11.addText('THANK YOU / QUESTIONS & EVALUATION WELCOME', {
      x: 1.5,
      y: 6.25,
      w: 10.3,
      h: 0.4,
      fontSize: 13,
      bold: true,
      color: COLORS.accentAmber,
      fontFace: 'Arial',
      align: 'center',
    });
  }

  // Trigger browser download of presentation.pptx
  await pres.writeFile({ fileName: 'Knowledge_Management_Platform_Presentation.pptx' });
}
