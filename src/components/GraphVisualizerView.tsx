import React, { useState } from 'react';
import { NoteRecord, buildVaultGraph } from '../domain/vaultEngine';

interface GraphVisualizerViewProps {
  notes: NoteRecord[];
  activeNoteId: string;
  onOpenNoteInEditor: (noteId: string) => void;
}

export const GraphVisualizerView: React.FC<GraphVisualizerViewProps> = ({
  notes,
  activeNoteId,
  onOpenNoteInEditor,
}) => {
  const [filterTag, setFilterTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNodeId, setSelectedNodeId] = useState<string>(activeNoteId);
  const [zoom, setZoom] = useState<number>(1);

  const graph = buildVaultGraph(notes, filterTag, searchQuery);
  const selectedNote =
    notes.find((n) => n.id === selectedNodeId) ?? notes[0];
  const selectedGraphNode = graph.nodes.find((n) => n.id === selectedNodeId);

  const groupColors: Record<string, string> = {
    java: '#c0c1ff',
    cs: '#4edea3',
    distributed: '#ffb95f',
    daily: '#6ffbbe',
    concept: '#908fa0',
  };

  return (
    <div className="flex flex-1 h-full w-full overflow-hidden bg-surface text-on-surface select-none">
      {/* Main Interactive Graph Viewport */}
      <div className="flex-1 flex flex-col justify-between relative overflow-hidden">
        {/* Top Graph Filter Bar */}
        <div className="h-12 px-gutter-desktop bg-surface-container-lowest border-b border-outline-variant/30 flex items-center justify-between gap-4 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <span className="material-symbols-outlined text-primary text-[18px] shrink-0">
              account_tree
            </span>
            <h1 className="font-headline-sm text-sm text-on-surface font-medium whitespace-nowrap shrink-0">
              Knowledge Graph
            </h1>
            <div className="flex items-center gap-1 bg-surface-container-low p-0.5 rounded border border-outline-variant/20">
              {[
                { id: 'all', label: 'All Nodes' },
                { id: 'concurrency', label: '#java/concurrency' },
                { id: 'oop', label: '#architecture/oop' },
                { id: 'system-design', label: '#system-design' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilterTag(t.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-code-inline transition-colors cursor-pointer whitespace-nowrap ${
                    filterTag === t.id
                      ? 'bg-surface-container-high text-primary font-medium'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-low border border-outline-variant/30">
              <span className="material-symbols-outlined text-[14px] text-outline">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter graph nodes..."
                aria-label="Filter graph nodes"
                className="bg-transparent text-xs text-on-surface outline-none placeholder:text-outline w-40"
              />
            </div>

            <div className="flex items-center gap-1 bg-surface-container-low rounded p-0.5 border border-outline-variant/20">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.15).toFixed(2)))}
                aria-label="Zoom out graph"
                className="px-2 py-0.5 text-xs text-outline hover:text-on-surface cursor-pointer"
              >
                -
              </button>
              <span className="font-code-inline text-[11px] text-on-surface-variant px-1 tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.15).toFixed(2)))}
                aria-label="Zoom in graph"
                className="px-2 py-0.5 text-xs text-outline hover:text-on-surface cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* SVG Force-Layout Canvas */}
        <div
          data-testid="vault-graph-canvas"
          className="flex-1 relative bg-surface overflow-hidden flex items-center justify-center"
        >
          <svg
            viewBox="0 0 920 600"
            className="w-full h-full max-w-[1100px] max-h-[680px]"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
          >
            <defs>
              <marker
                id="graph-arrow"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#464554" />
              </marker>
            </defs>

            {/* Edges */}
            {graph.edges.map((edge) => {
              const src = graph.nodes.find((n) => n.id === edge.source);
              const dst = graph.nodes.find((n) => n.id === edge.target);
              if (!src || !dst) return null;
              const isHighlighted =
                src.id === selectedNodeId || dst.id === selectedNodeId;
              return (
                <line
                  key={edge.id}
                  x1={src.x}
                  y1={src.y}
                  x2={dst.x}
                  y2={dst.y}
                  stroke={isHighlighted ? '#c0c1ff' : '#2d3449'}
                  strokeWidth={isHighlighted ? '2' : '1.2'}
                  markerEnd="url(#graph-arrow)"
                />
              );
            })}

            {/* Nodes */}
            {graph.nodes.map((node) => {
              const isSelected = node.id === selectedNodeId;
              const radius =
                node.id === 'note-virtual-threads'
                  ? 16
                  : Math.min(14, 8 + node.inDegree + node.outDegree);
              const fill = groupColors[node.group] || '#c0c1ff';

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  onDoubleClick={() => onOpenNoteInEditor(node.id)}
                  className="cursor-pointer"
                >
                  {isSelected && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius + 6}
                      fill="none"
                      stroke="#c0c1ff"
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                    />
                  )}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius}
                    fill={fill}
                    stroke="#060e20"
                    strokeWidth="2"
                  />
                  <text
                    x={node.x}
                    y={node.y + radius + 14}
                    textAnchor="middle"
                    fill={isSelected ? '#dae2fd' : '#c7c4d7'}
                    fontSize={isSelected ? '12' : '11'}
                    fontWeight={isSelected ? '600' : '400'}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Bottom Legend */}
          <div className="absolute bottom-4 left-4 flex items-center gap-4 px-3 py-1.5 rounded bg-surface-container-low/90 border border-outline-variant/30 text-[11px] text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
              Java Concurrency
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block" />
              Computer Science
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary inline-block" />
              Distributed Systems
            </span>
            <span className="text-outline font-code-inline tabular-nums">
              {graph.nodes.length} nodes · {graph.edges.length} links
            </span>
          </div>
        </div>
      </div>

      {/* Right Graph Node Inspector */}
      <aside className="w-80 bg-surface-container-lowest border-l border-outline-variant/30 p-4 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
            <span className="font-label-sm uppercase tracking-wider text-outline text-[10px]">
              Selected Node Telemetry
            </span>
            <span className="font-code-inline text-[11px] text-secondary">
              {selectedNote.frontmatter.status}
            </span>
          </div>

          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              {selectedNote.title}
            </h2>
            <p className="font-code-inline text-xs text-primary mt-0.5">
              {selectedNote.filename}
            </p>
          </div>

          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            {selectedNote.lead}
          </p>

          <div className="grid grid-cols-2 gap-2 p-2.5 rounded bg-surface-container-low font-code-inline text-xs tabular-nums">
            <div>
              <span className="text-outline block text-[10px]">IN-DEGREE</span>
              <strong className="text-primary text-sm">
                {selectedGraphNode?.inDegree ?? 0} backlinks
              </strong>
            </div>
            <div>
              <span className="text-outline block text-[10px]">OUT-DEGREE</span>
              <strong className="text-secondary text-sm">
                {selectedGraphNode?.outDegree ?? 0} outgoing
              </strong>
            </div>
          </div>

          <div>
            <span className="font-label-sm uppercase tracking-wider text-outline text-[10px] block mb-1.5">
              Node Tags
            </span>
            <div className="flex flex-wrap gap-1">
              {selectedNote.frontmatter.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded bg-surface-container text-primary font-code-inline text-[11px]"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenNoteInEditor(selectedNote.id)}
          className="w-full py-2 px-4 rounded bg-primary-container text-on-surface font-label-md text-xs font-medium hover:bg-primary hover:text-on-primary transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">
            open_in_new
          </span>
          <span>Open Note in Editor Workspace</span>
        </button>
      </aside>
    </div>
  );
};
