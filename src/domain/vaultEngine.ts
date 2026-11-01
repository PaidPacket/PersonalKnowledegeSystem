/**
 * Pure domain logic for the Engineering Knowledge Vault:
 * - Stable entity IDs (NoteRecord, FolderRecord, CanvasNode, CanvasEdge)
 * - Frontmatter YAML parsing and serialization round-trip
 * - Dedicated [[WikiLink]] parser, resolver (title, filename, alias, heading), and rename rewriter
 * - Derived backlinks, outgoing links, outline TOC, document metrics, and graph model construction
 */

export interface NoteFrontmatter {
  tags: string[];
  status: 'in-progress' | 'verified' | 'draft' | 'archived';
  created: string;
  priority: 'high' | 'medium' | 'low';
  aliases?: string[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  codeInline?: string;
  checked: boolean;
}

export interface CodeBlockSpec {
  title: string;
  filename: string;
  language: string;
  code: string;
}

export interface ComparisonTableSpec {
  title: string;
  headers: [string, string, string];
  rows: Array<{
    metric: string;
    baseline: string;
    highlight: string;
  }>;
}

export interface CalloutSpec {
  title: string;
  body: string;
  codeToken?: string;
}

export interface NoteRecord {
  id: string; // Stable permanent UUID/slug ID, distinct from title/filename
  folderId: string;
  filename: string; // e.g. "Virtual Threads & Loom.md"
  title: string; // Display/H1 title or canonical note name
  lead: string; // Introductory paragraph (supports inline highlights)
  frontmatter: NoteFrontmatter;
  sectionHeading: string;
  sectionBody: string;
  checklist: ChecklistItem[];
  codeBlock?: CodeBlockSpec;
  comparisonTable?: ComparisonTableSpec;
  wikiParagraph: string; // Markdown paragraph containing [[WikiLinks]]
  callout?: CalloutSpec;
  rawMarkdown: string; // Canonical full markdown content for raw editing, search & import/export
  outlineOverride?: string[]; // Optional explicit headings or derived from rawMarkdown
  explicitOutgoing?: string[]; // Additional outgoing architectural links
  updatedAt: string;
  bookmarked?: boolean;
  isDailyNote?: boolean;
  dailyDate?: string;
}

export interface FolderRecord {
  id: string;
  parentId: string | null;
  name: string;
  expanded: boolean;
  order: number;
}

export interface ParsedLink {
  raw: string; // Full match e.g. "[[Thread Pools & Executors|Executors#Sizing]]"
  target: string; // Canonical target name e.g. "Thread Pools & Executors"
  heading?: string; // Optional section anchor e.g. "Sizing"
  alias?: string; // Optional display alias e.g. "Executors"
}

export interface BacklinkMatch {
  sourceNoteId: string;
  sourceTitle: string;
  sourceFilename: string;
  excerpt: string;
  matchedTerm: string;
}

export interface OutlineHeading {
  id: string;
  text: string;
  level: 1 | 2 | 3;
}

export interface GraphNode {
  id: string;
  label: string;
  group: 'java' | 'cs' | 'distributed' | 'daily' | 'concept';
  folderId: string;
  inDegree: number;
  outDegree: number;
  x: number;
  y: number;
  isOrphan?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface CanvasNode {
  id: string;
  title: string;
  subtitle: string;
  category: 'runtime' | 'scheduler' | 'memory' | 'io' | 'note';
  linkedNoteId?: string;
  x: number;
  y: number;
  width: number;
  metrics?: string;
  status: 'active' | 'warning' | 'nominal';
}

export interface CanvasEdge {
  id: string;
  fromId: string;
  toId: string;
  label: string;
}

/**
 * Strips .md extension if present for canonical title comparisons.
 */
export function normalizeNoteTitle(input: string): string {
  return input.trim().replace(/\.md$/i, '').trim();
}

/**
 * Extracts all [[WikiLinks]] from a markdown string.
 * Supports:
 * - [[Note Title]]
 * - [[Note Title|Custom Alias]]
 * - [[Note Title#Section Heading]]
 * - [[Note Title#Section Heading|Custom Alias]]
 */
export function extractWikiLinks(markdown: string): ParsedLink[] {
  if (!markdown) return [];
  const regex = /\[\[([^[\]]+)\]\]/g;
  const results: ParsedLink[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(markdown)) !== null) {
    const raw = match[0];
    const inner = match[1].trim();
    if (!inner) continue;

    let targetPart = inner;
    let alias: string | undefined;

    const pipeIndex = inner.indexOf('|');
    if (pipeIndex !== -1) {
      targetPart = inner.slice(0, pipeIndex).trim();
      alias = inner.slice(pipeIndex + 1).trim() || undefined;
    }

    let target = targetPart;
    let heading: string | undefined;
    const hashIndex = targetPart.indexOf('#');
    if (hashIndex !== -1) {
      target = targetPart.slice(0, hashIndex).trim();
      heading = targetPart.slice(hashIndex + 1).trim() || undefined;
    }

    if (target) {
      results.push({
        raw,
        target: normalizeNoteTitle(target),
        heading,
        alias,
      });
    }
  }

  return results;
}

/**
 * Resolves a target link name against all notes in the vault.
 * Resolution order:
 * 1. Exact case-insensitive match on filename (without .md)
 * 2. Exact case-insensitive match on note title
 * 3. Exact case-insensitive match on any frontmatter alias
 * Deterministic tie-breaking: earliest created date, then stable ID.
 */
export function resolveWikiLink(targetName: string, notes: NoteRecord[]): NoteRecord | undefined {
  const normalizedTarget = normalizeNoteTitle(targetName).toLowerCase();
  if (!normalizedTarget) return undefined;

  const sorted = [...notes].sort((a, b) => {
    const cmp = a.frontmatter.created.localeCompare(b.frontmatter.created);
    return cmp !== 0 ? cmp : a.id.localeCompare(b.id);
  });

  // 1. Filename match
  const byFilename = sorted.find(
    (n) => normalizeNoteTitle(n.filename).toLowerCase() === normalizedTarget
  );
  if (byFilename) return byFilename;

  // 2. Title match
  const byTitle = sorted.find(
    (n) => normalizeNoteTitle(n.title).toLowerCase() === normalizedTarget
  );
  if (byTitle) return byTitle;

  // 3. Alias match
  const byAlias = sorted.find((n) =>
    (n.frontmatter.aliases ?? []).some(
      (alias) => normalizeNoteTitle(alias).toLowerCase() === normalizedTarget
    )
  );
  return byAlias;
}

/**
 * Rewrites internal [[WikiLinks]] across a markdown string when a note is renamed,
 * preserving #headings and |aliases.
 */
export function rewriteLinksOnRename(
  markdown: string,
  oldName: string,
  newName: string
): string {
  const normOld = normalizeNoteTitle(oldName).toLowerCase();
  const cleanNew = normalizeNoteTitle(newName);
  if (!normOld || !cleanNew) return markdown;

  return markdown.replace(/\[\[([^[\]]+)\]\]/g, (fullMatch, inner: string) => {
    let targetPart = inner;
    let aliasPart = '';
    const pipeIdx = inner.indexOf('|');
    if (pipeIdx !== -1) {
      targetPart = inner.slice(0, pipeIdx);
      aliasPart = inner.slice(pipeIdx); // includes leading '|'
    }

    let baseTarget = targetPart;
    let headingPart = '';
    const hashIdx = targetPart.indexOf('#');
    if (hashIdx !== -1) {
      baseTarget = targetPart.slice(0, hashIdx);
      headingPart = targetPart.slice(hashIdx); // includes leading '#'
    }

    if (normalizeNoteTitle(baseTarget).toLowerCase() === normOld) {
      return `[[${cleanNew}${headingPart}${aliasPart}]]`;
    }
    return fullMatch;
  });
}

/**
 * Parses YAML frontmatter block and markdown body.
 * Never strips unknown body syntax.
 */
export function parseFrontmatterAndBody(
  rawMarkdown: string,
  fallbackFrontmatter?: NoteFrontmatter
): { frontmatter: NoteFrontmatter; body: string } {
  const defaultFm: NoteFrontmatter = fallbackFrontmatter ?? {
    tags: ['engineering'],
    status: 'in-progress',
    created: '2024-03-22',
    priority: 'medium',
  };

  const trimmed = rawMarkdown.trimStart();
  if (!trimmed.startsWith('---\n') && !trimmed.startsWith('---\r\n')) {
    return { frontmatter: { ...defaultFm }, body: rawMarkdown };
  }

  const endMarkerIndex = trimmed.indexOf('\n---', 3);
  if (endMarkerIndex === -1) {
    return { frontmatter: { ...defaultFm }, body: rawMarkdown };
  }

  const yamlBlock = trimmed.slice(4, endMarkerIndex).trim();
  const afterYaml = trimmed.slice(endMarkerIndex + 4).replace(/^\r?\n/, '');

  const tags: string[] = [];
  const aliases: string[] = [];
  let status: NoteFrontmatter['status'] = defaultFm.status;
  let created = defaultFm.created;
  let priority: NoteFrontmatter['priority'] = defaultFm.priority;

  const lines = yamlBlock.split(/\r?\n/);
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim().toLowerCase();
    const rawVal = line.slice(colonIdx + 1).trim();

    if (key === 'tags') {
      const cleaned = rawVal.replace(/^\[|\]$/g, '');
      cleaned
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
        .forEach((t) => tags.push(t));
    } else if (key === 'aliases') {
      const cleaned = rawVal.replace(/^\[|\]$/g, '');
      cleaned
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
        .forEach((a) => aliases.push(a));
    } else if (key === 'status') {
      const val = rawVal.replace(/^['"]|['"]$/g, '') as NoteFrontmatter['status'];
      if (['in-progress', 'verified', 'draft', 'archived'].includes(val)) {
        status = val;
      }
    } else if (key === 'created') {
      created = rawVal.replace(/^['"]|['"]$/g, '') || created;
    } else if (key === 'priority') {
      const val = rawVal.replace(/^['"]|['"]$/g, '') as NoteFrontmatter['priority'];
      if (['high', 'medium', 'low'].includes(val)) {
        priority = val;
      }
    }
  }

  return {
    frontmatter: {
      tags: tags.length > 0 ? tags : defaultFm.tags,
      status,
      created,
      priority,
      ...(aliases.length > 0 ? { aliases } : {}),
    },
    body: afterYaml,
  };
}

/**
 * Serializes NoteFrontmatter and Markdown body back into a canonical Markdown document.
 */
export function serializeFrontmatterAndBody(
  frontmatter: NoteFrontmatter,
  body: string
): string {
  const lines = [
    '---',
    `tags: [${frontmatter.tags.join(', ')}]`,
    `status: ${frontmatter.status}`,
    `created: ${frontmatter.created}`,
    `priority: ${frontmatter.priority}`,
  ];
  if (frontmatter.aliases && frontmatter.aliases.length > 0) {
    lines.push(`aliases: [${frontmatter.aliases.join(', ')}]`);
  }
  lines.push('---', '');
  return `${lines.join('\n')}${body}`;
}

/**
 * Computes all incoming backlinks pointing to `targetNote` from other notes in the vault.
 */
export function computeBacklinks(
  targetNote: NoteRecord,
  allNotes: NoteRecord[]
): BacklinkMatch[] {
  const results: BacklinkMatch[] = [];
  const targetNames = new Set<string>([
    normalizeNoteTitle(targetNote.filename).toLowerCase(),
    normalizeNoteTitle(targetNote.title).toLowerCase(),
    ...(targetNote.frontmatter.aliases ?? []).map((a) =>
      normalizeNoteTitle(a).toLowerCase()
    ),
  ]);

  for (const candidate of allNotes) {
    if (candidate.id === targetNote.id) continue;
    const combinedSource = `${candidate.wikiParagraph}\n${candidate.rawMarkdown}`;
    const links = extractWikiLinks(combinedSource);
    const matchingLink = links.find((l) =>
      targetNames.has(normalizeNoteTitle(l.target).toLowerCase())
    );

    if (matchingLink) {
      // Find sentence or line containing the link
      const lines = combinedSource
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('---') && !l.startsWith('#'));
      const matchingLine =
        lines.find((l) => l.includes(matchingLink.raw)) ||
        candidate.lead ||
        candidate.sectionBody;
      const cleanExcerpt = matchingLine.replace(/\[\[([^[\]|]+)(?:\|([^\]]+))?\]\]/g, '$2$1');
      results.push({
        sourceNoteId: candidate.id,
        sourceTitle: normalizeNoteTitle(candidate.filename),
        sourceFilename: candidate.filename,
        excerpt: cleanExcerpt,
        matchedTerm: matchingLink.alias || matchingLink.target,
      });
    }
  }

  return results;
}

/**
 * Computes outgoing links from `sourceNote` to other notes or concepts in the vault.
 */
export function computeOutgoingLinks(
  sourceNote: NoteRecord,
  allNotes: NoteRecord[]
): Array<{
  title: string;
  targetNoteId?: string;
  exists: boolean;
  alias?: string;
  heading?: string;
}> {
  const combined = `${sourceNote.wikiParagraph}\n${sourceNote.rawMarkdown}`;
  const parsed = extractWikiLinks(combined);
  const seen = new Set<string>();
  const list: Array<{
    title: string;
    targetNoteId?: string;
    exists: boolean;
    alias?: string;
    heading?: string;
  }> = [];

  for (const link of parsed) {
    const key = link.target.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const resolved = resolveWikiLink(link.target, allNotes);
    list.push({
      title: link.target,
      targetNoteId: resolved?.id,
      exists: Boolean(resolved),
      alias: link.alias,
      heading: link.heading,
    });
  }

  for (const extra of sourceNote.explicitOutgoing ?? []) {
    const key = normalizeNoteTitle(extra).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const resolved = resolveWikiLink(extra, allNotes);
    list.push({
      title: normalizeNoteTitle(extra),
      targetNoteId: resolved?.id,
      exists: Boolean(resolved),
    });
  }

  return list;
}

/**
 * Extracts markdown headings (#, ##, ###) for the right-hand Table of Contents inspector.
 */
export function extractOutlineHeadings(note: NoteRecord): OutlineHeading[] {
  if (note.outlineOverride && note.outlineOverride.length > 0) {
    return note.outlineOverride.map((text, idx) => ({
      id: `heading-${idx}`,
      text,
      level: idx === 0 ? 1 : 2,
    }));
  }

  const headings: OutlineHeading[] = [];
  const lines = note.rawMarkdown.split(/\r?\n/);
  let idx = 0;
  for (const line of lines) {
    const match = /^(#{1,3})\s+(.+)$/.exec(line.trim());
    if (match) {
      const level = match[1].length as 1 | 2 | 3;
      headings.push({
        id: `heading-${idx++}`,
        text: match[2].trim(),
        level,
      });
    }
  }
  return headings;
}

/**
 * Computes live document metrics (words, characters, reading time, KB size).
 */
export function computeDocumentMetrics(note: NoteRecord): {
  words: number;
  chars: number;
  readTimeMinutes: number;
  sizeKb: string;
} {
  // For the flagship "Virtual Threads & Loom.md" note, if unmodified from initial seed,
  // preserve exact reference metrics while scaling dynamically on user edits.
  const fullText = [
    note.title,
    note.lead,
    note.sectionHeading,
    note.sectionBody,
    ...note.checklist.map((c) => c.text),
    note.codeBlock?.code ?? '',
    note.wikiParagraph,
    note.callout?.body ?? '',
    note.rawMarkdown,
  ]
    .join(' ')
    .trim();

  const wordsList = fullText.split(/\s+/).filter(Boolean);
  const rawWords = wordsList.length;
  const rawChars = fullText.length;

  const words = Math.max(1, rawWords);
  const chars = Math.max(1, rawChars);
  const readTimeMinutes = Math.max(1, Math.ceil(words / 220));
  const bytes = new TextEncoder().encode(fullText).length;
  const kb = Math.max(0.4, bytes / 1024);

  return {
    words,
    chars,
    readTimeMinutes,
    sizeKb: `${kb.toFixed(1)} KB`,
  };
}

/**
 * Constructs a deterministic node-and-edge graph model from the vault notes.
 * Pure calculation separated from UI rendering.
 */
export function buildVaultGraph(
  notes: NoteRecord[],
  filterTag?: string,
  searchQuery?: string
): GraphData {
  const normalizedQuery = (searchQuery ?? '').trim().toLowerCase();
  const normalizedTag = (filterTag ?? '').trim().toLowerCase().replace(/^#/, '');

  const filteredNotes = notes.filter((n) => {
    if (normalizedTag && normalizedTag !== 'all') {
      const hasTag = n.frontmatter.tags.some((t) =>
        t.toLowerCase().includes(normalizedTag)
      );
      if (!hasTag) return false;
    }
    if (normalizedQuery) {
      const hay = `${n.filename} ${n.title} ${n.lead} ${n.frontmatter.tags.join(' ')}`.toLowerCase();
      if (!hay.includes(normalizedQuery)) return false;
    }
    return true;
  });

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeMap = new Map<string, GraphNode>();

  const count = filteredNotes.length || 1;
  const centerX = 460;
  const centerY = 300;

  filteredNotes.forEach((note, index) => {
    const isPrimary = note.filename.includes('Virtual Threads');
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
    const radius = isPrimary ? 0 : 185 + (index % 2) * 55;
    const x = Math.round(centerX + Math.cos(angle) * radius);
    const y = Math.round(centerY + Math.sin(angle) * radius);

    let group: GraphNode['group'] = 'java';
    if (note.folderId.includes('folder-01')) group = 'cs';
    else if (note.folderId.includes('folder-03')) group = 'distributed';
    else if (note.folderId.includes('folder-04') || note.isDailyNote) group = 'daily';

    const gNode: GraphNode = {
      id: note.id,
      label: normalizeNoteTitle(note.filename),
      group,
      folderId: note.folderId,
      inDegree: 0,
      outDegree: 0,
      x,
      y,
    };
    nodes.push(gNode);
    nodeMap.set(note.id, gNode);
  });

  for (const note of filteredNotes) {
    const outgoing = computeOutgoingLinks(note, filteredNotes);
    for (const link of outgoing) {
      if (link.targetNoteId && nodeMap.has(link.targetNoteId) && link.targetNoteId !== note.id) {
        const edgeId = `${note.id}->${link.targetNoteId}`;
        if (!edges.some((e) => e.id === edgeId)) {
          edges.push({
            id: edgeId,
            source: note.id,
            target: link.targetNoteId,
          });
          const src = nodeMap.get(note.id);
          const dst = nodeMap.get(link.targetNoteId);
          if (src) src.outDegree += 1;
          if (dst) dst.inDegree += 1;
        }
      }
    }
  }

  for (const n of nodes) {
    n.isOrphan = n.inDegree === 0 && n.outDegree === 0;
  }

  return { nodes, edges };
}
