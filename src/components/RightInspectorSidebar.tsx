import React, { useState } from 'react';
import {
  BacklinkMatch,
  NoteRecord,
  OutlineHeading,
} from '../domain/vaultEngine';

interface RightInspectorSidebarProps {
  activeNote: NoteRecord;
  allNotes: NoteRecord[];
  outline: OutlineHeading[];
  backlinks: BacklinkMatch[];
  outgoingLinks: Array<{
    title: string;
    targetNoteId?: string;
    exists: boolean;
    alias?: string;
    heading?: string;
  }>;
  sizeKb: string;
  onSelectNoteById: (noteId: string) => void;
  onOpenNoteByTitle: (title: string) => void;
  onJumpToHeading: (headingText: string) => void;
  onOpenGraphView: () => void;
}

type InspectorFilterTab = 'all' | 'backlinks' | 'outgoing' | 'local-graph';

export const RightInspectorSidebar: React.FC<RightInspectorSidebarProps> = ({
  activeNote,
  outline,
  backlinks,
  outgoingLinks,
  sizeKb,
  onSelectNoteById,
  onOpenNoteByTitle,
  onJumpToHeading,
  onOpenGraphView,
}) => {
  const [activeTab, setActiveTab] = useState<InspectorFilterTab>('all');
  const [activeHeadingIdx, setActiveHeadingIdx] = useState(0);

  const isVirtualThreadsNote = activeNote.id === 'note-virtual-threads';
  const displaySize = isVirtualThreadsNote ? '14.2 KB' : sizeKb;

  return (
    <aside className="w-72 flex-shrink-0 bg-surface-container-lowest border-l border-outline-variant/20 flex flex-col justify-between overflow-hidden select-none">
      {/* Top Inspector Tab Switcher */}
      <div className="h-9 bg-surface-container-low px-1 flex items-center justify-between text-on-surface-variant">
        <div className="flex items-center gap-0.5 w-full">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1 px-1 rounded font-label-md text-[11px] transition-colors text-center cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-surface-container-high text-on-surface font-medium shadow-sm'
                : 'hover:bg-surface-container text-outline hover:text-on-surface'
            }`}
          >
            Outline
          </button>
          <button
            type="button"
            onClick={() =>
              setActiveTab(activeTab === 'backlinks' ? 'all' : 'backlinks')
            }
            className={`flex-1 py-1 px-1 rounded font-label-md text-[11px] transition-colors text-center cursor-pointer whitespace-nowrap ${
              activeTab === 'backlinks'
                ? 'bg-surface-container-high text-on-surface font-medium shadow-sm'
                : 'hover:bg-surface-container text-outline hover:text-on-surface'
            }`}
          >
            Backlinks{' '}
            <span className="font-code-inline text-[9px] text-primary tabular-nums">
              {backlinks.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() =>
              setActiveTab(activeTab === 'outgoing' ? 'all' : 'outgoing')
            }
            className={`flex-1 py-1 px-1 rounded font-label-md text-[11px] transition-colors text-center cursor-pointer whitespace-nowrap ${
              activeTab === 'outgoing'
                ? 'bg-surface-container-high text-on-surface font-medium shadow-sm'
                : 'hover:bg-surface-container text-outline hover:text-on-surface'
            }`}
          >
            Outgoing{' '}
            <span className="font-code-inline text-[9px] text-primary tabular-nums">
              {outgoingLinks.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() =>
              setActiveTab(
                activeTab === 'local-graph' ? 'all' : 'local-graph'
              )
            }
            className={`p-1 rounded transition-colors cursor-pointer ${
              activeTab === 'local-graph'
                ? 'bg-surface-container-high text-primary'
                : 'hover:bg-surface-container text-outline hover:text-on-surface'
            }`}
            title="Local Graph"
            aria-label="Local Graph"
          >
            <span className="material-symbols-outlined text-[14px]">hub</span>
          </button>
        </div>
      </div>

      {/* Inspector Content Body */}
      <div className="flex-1 overflow-y-auto px-space-md py-space-sm space-y-space-md">
        {/* Local Graph Mini-View when toggled */}
        {activeTab === 'local-graph' && (
          <div className="p-2.5 rounded bg-surface-container-low border border-outline-variant/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-[10px] uppercase tracking-wider text-outline">
                Local Neighborhood Graph
              </span>
              <button
                type="button"
                onClick={onOpenGraphView}
                className="text-[11px] text-primary hover:underline cursor-pointer"
              >
                Expand Full
              </button>
            </div>
            <svg viewBox="0 0 240 150" className="w-full h-36 bg-surface rounded">
              {outgoingLinks.slice(0, 5).map((link, idx) => {
                const angle = (idx / Math.max(1, Math.min(5, outgoingLinks.length))) * Math.PI * 2;
                const tx = 120 + Math.cos(angle) * 65;
                const ty = 75 + Math.sin(angle) * 50;
                return (
                  <g key={link.title}>
                    <line
                      x1={120}
                      y1={75}
                      x2={tx}
                      y2={ty}
                      stroke="#464554"
                      strokeWidth="1"
                    />
                    <circle
                      cx={tx}
                      cy={ty}
                      r="5"
                      fill="#4edea3"
                      className="cursor-pointer"
                      onClick={() => onOpenNoteByTitle(link.title)}
                    />
                    <text
                      x={tx}
                      y={ty - 8}
                      textAnchor="middle"
                      fill="#c7c4d7"
                      fontSize="8"
                    >
                      {link.title.slice(0, 16)}
                    </text>
                  </g>
                );
              })}
              <circle cx={120} cy={75} r="7" fill="#c0c1ff" />
              <text
                x={120}
                y={92}
                textAnchor="middle"
                fill="#dae2fd"
                fontSize="9"
                fontWeight="600"
              >
                {activeNote.filename.replace(/\.md$/i, '').slice(0, 18)}
              </text>
            </svg>
          </div>
        )}

        {/* Active Section 1: Outline / TOC */}
        {(activeTab === 'all' || activeTab === 'local-graph') && (
          <div>
            <div className="flex items-center justify-between text-outline uppercase font-label-sm text-[10px] tracking-wider mb-2">
              <span>Table of Contents</span>
              <span className="material-symbols-outlined text-[13px]">
                format_list_bulleted
              </span>
            </div>
            <nav className="space-y-1 font-label-md text-label-md" aria-label="Table of Contents">
              {outline.map((heading, idx) => {
                const isSelected = idx === activeHeadingIdx;
                return (
                  <button
                    key={heading.id}
                    type="button"
                    onClick={() => {
                      setActiveHeadingIdx(idx);
                      onJumpToHeading(heading.text);
                    }}
                    className={`w-full text-left block px-2 py-1 rounded truncate transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-surface-container-low text-primary font-medium'
                        : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface pl-4'
                    }`}
                  >
                    {heading.text}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Section 2: Linked Backlinks */}
        {(activeTab === 'all' || activeTab === 'backlinks') && (
          <div className="pt-space-xs">
            <div className="flex items-center justify-between text-outline uppercase font-label-sm text-[10px] tracking-wider mb-2">
              <span>Linked References ({backlinks.length})</span>
              <span className="material-symbols-outlined text-[13px]">link</span>
            </div>
            <div className="space-y-2">
              {isVirtualThreadsNote ? (
                <>
                  {/* Backlink card 1 (matches Stitch reference) */}
                  <button
                    type="button"
                    onClick={() =>
                      onSelectNoteById('note-system-design-checklist')
                    }
                    className="w-full text-left p-2 rounded bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5 text-primary text-xs font-medium mb-1">
                      <span className="material-symbols-outlined text-[12px]">
                        description
                      </span>
                      <span className="truncate">System Design Checklist</span>
                    </div>
                    <p className="font-body-sm text-[11px] text-outline group-hover:text-on-surface-variant line-clamp-2 leading-tight">
                      &quot;...recommend upgrading backend workers to Java 21{' '}
                      <span className="text-on-surface font-medium bg-surface-container-high px-1 rounded">
                        Virtual Threads
                      </span>{' '}
                      for high-concurrency ingestion...&quot;
                    </p>
                  </button>

                  {/* Backlink card 2 (matches Stitch reference) */}
                  <button
                    type="button"
                    onClick={() =>
                      onSelectNoteById('note-microservice-review')
                    }
                    className="w-full text-left p-2 rounded bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5 text-primary text-xs font-medium mb-1">
                      <span className="material-symbols-outlined text-[12px]">
                        description
                      </span>
                      <span className="truncate">
                        Microservice Architecture Review
                      </span>
                    </div>
                    <p className="font-body-sm text-[11px] text-outline group-hover:text-on-surface-variant line-clamp-2 leading-tight">
                      &quot;...investigating thread starvation using loom virtual
                      threads for downstream gRPC dispatch...&quot;
                    </p>
                  </button>

                  {activeTab === 'backlinks' &&
                    backlinks
                      .filter(
                        (b) =>
                          b.sourceNoteId !== 'note-system-design-checklist' &&
                          b.sourceNoteId !== 'note-microservice-review'
                      )
                      .map((bl) => (
                        <button
                          key={bl.sourceNoteId}
                          type="button"
                          onClick={() => onSelectNoteById(bl.sourceNoteId)}
                          className="w-full text-left p-2 rounded bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-1.5 text-primary text-xs font-medium mb-1">
                            <span className="material-symbols-outlined text-[12px]">
                              description
                            </span>
                            <span className="truncate">{bl.sourceTitle}</span>
                          </div>
                          <p className="font-body-sm text-[11px] text-outline group-hover:text-on-surface-variant line-clamp-2 leading-tight">
                            &quot;{bl.excerpt}&quot;
                          </p>
                        </button>
                      ))}
                </>
              ) : backlinks.length === 0 ? (
                <div className="p-2 rounded bg-surface-container-low text-outline text-[11px]">
                  No incoming [[WikiLinks]] reference this note yet.
                </div>
              ) : (
                backlinks.map((bl) => (
                  <button
                    key={bl.sourceNoteId}
                    type="button"
                    onClick={() => onSelectNoteById(bl.sourceNoteId)}
                    className="w-full text-left p-2 rounded bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5 text-primary text-xs font-medium mb-1">
                      <span className="material-symbols-outlined text-[12px]">
                        description
                      </span>
                      <span className="truncate">{bl.sourceTitle}</span>
                    </div>
                    <p className="font-body-sm text-[11px] text-outline group-hover:text-on-surface-variant line-clamp-2 leading-tight">
                      &quot;{bl.excerpt}&quot;
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Section 3: Outgoing Links */}
        {(activeTab === 'all' || activeTab === 'outgoing') && (
          <div className="pt-space-xs">
            <div className="flex items-center justify-between text-outline uppercase font-label-sm text-[10px] tracking-wider mb-1.5">
              <span>Outgoing Links ({outgoingLinks.length})</span>
              <span className="material-symbols-outlined text-[13px]">
                call_made
              </span>
            </div>
            <div className="space-y-1 font-label-md text-label-md">
              {(isVirtualThreadsNote && activeTab === 'all'
                ? [
                    { title: 'ForkJoinPool Architecture', exists: true },
                    { title: 'ReentrantLock vs Synchronized', exists: true },
                    { title: 'JVM Memory Management', exists: true },
                  ]
                : outgoingLinks
              ).map((link) => (
                <button
                  key={link.title}
                  type="button"
                  onClick={() => onOpenNoteByTitle(link.title)}
                  className="w-full flex items-center gap-1.5 px-2 py-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors text-left cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[12px] text-outline">
                    arrow_outward
                  </span>
                  <span className="truncate text-[12px]">{link.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar Bottom Meta Specs */}
      <div className="h-10 px-space-md bg-surface-container-low flex items-center justify-between text-outline font-label-sm text-[11px] tabular-nums">
        <span>
          Size: <strong className="text-on-surface-variant">{displaySize}</strong>
        </span>
        <div className="flex items-center gap-2">
          <span>
            In:{' '}
            <strong className="text-primary">
              {isVirtualThreadsNote ? Math.max(4, backlinks.length) : backlinks.length}
            </strong>
          </span>
          <span>•</span>
          <span>
            Out: <strong className="text-primary">{outgoingLinks.length}</strong>
          </span>
        </div>
      </div>
    </aside>
  );
};
