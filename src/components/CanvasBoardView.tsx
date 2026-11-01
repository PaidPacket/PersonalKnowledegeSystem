import React, { useState } from 'react';
import { CanvasEdge, CanvasNode, NoteRecord } from '../domain/vaultEngine';

interface CanvasBoardViewProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  notes: NoteRecord[];
  onAddCanvasNode: (node: CanvasNode, connectFromId?: string) => void;
  onMoveCanvasNode: (nodeId: string, dx: number, dy: number) => void;
  onOpenNoteInEditor: (noteId: string) => void;
}

export const CanvasBoardView: React.FC<CanvasBoardViewProps> = ({
  nodes,
  edges,
  notes,
  onAddCanvasNode,
  onMoveCanvasNode,
  onOpenNoteInEditor,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string>(
    nodes[0]?.id ?? ''
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [linkedNoteId, setLinkedNoteId] = useState(notes[0]?.id ?? '');

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newNode: CanvasNode = {
      id: `canvas-node-${Date.now()}`,
      title: newTitle.trim(),
      subtitle:
        newSubtitle.trim() || 'Linked engineering architecture card on spatial board',
      category: 'note',
      linkedNoteId,
      x: 140 + ((nodes.length * 90) % 500),
      y: 260 + ((nodes.length * 50) % 180),
      width: 270,
      metrics: 'Verified Node',
      status: 'active',
    };
    onAddCanvasNode(newNode, selectedCardId || nodes[0]?.id);
    setSelectedCardId(newNode.id);
    setNewTitle('');
    setNewSubtitle('');
    setShowAddForm(false);
  };

  return (
    <div className="flex flex-col flex-1 h-full w-full overflow-hidden bg-surface text-on-surface select-none">
      {/* Top Canvas Toolbar */}
      <div className="h-12 px-gutter-desktop bg-surface-container-lowest border-b border-outline-variant/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[18px]">
            space_dashboard
          </span>
          <h1 className="font-headline-sm text-headline-sm text-on-surface font-medium">
            Loom &amp; Distributed Concurrency Architecture Canvas
          </h1>
          <span className="font-code-inline text-[11px] text-outline tabular-nums">
            {nodes.length} cards · {edges.length} connectors
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="px-3 py-1.5 rounded bg-primary-container text-on-surface hover:bg-primary hover:text-on-primary font-label-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            <span>Add Canvas Card</span>
          </button>
        </div>
      </div>

      {/* Add Card Inline Bar */}
      {showAddForm && (
        <form
          onSubmit={handleCreateCard}
          className="px-gutter-desktop py-2.5 bg-surface-container-low border-b border-outline-variant/30 flex flex-wrap items-center gap-2"
        >
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Card title (e.g., ZGC Heap StackChunk)..."
            aria-label="Canvas card title"
            required
            className="px-2.5 py-1 rounded bg-surface-container-high text-xs text-on-surface outline-none border border-outline-variant/40 focus:border-primary w-56"
          />
          <input
            type="text"
            value={newSubtitle}
            onChange={(e) => setNewSubtitle(e.target.value)}
            placeholder="Architectural description..."
            aria-label="Canvas card description"
            className="px-2.5 py-1 rounded bg-surface-container-high text-xs text-on-surface outline-none border border-outline-variant/40 focus:border-primary w-64"
          />
          <select
            value={linkedNoteId}
            onChange={(e) => setLinkedNoteId(e.target.value)}
            aria-label="Link to vault note"
            className="px-2.5 py-1 rounded bg-surface-container-high text-xs text-on-surface outline-none border border-outline-variant/40"
          >
            {notes.map((n) => (
              <option key={n.id} value={n.id}>
                Link: {n.filename}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-3 py-1 rounded bg-secondary text-on-secondary text-xs font-medium cursor-pointer"
          >
            Create Card
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm(false)}
            className="px-2.5 py-1 rounded bg-surface-container text-outline text-xs cursor-pointer"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Spatial Canvas Surface */}
      <div className="flex-1 relative overflow-auto bg-[#090f20]">
        <svg className="absolute inset-0 w-[1200px] h-[640px] pointer-events-none z-10">
          {edges.map((edge) => {
            const from = nodes.find((n) => n.id === edge.fromId);
            const to = nodes.find((n) => n.id === edge.toId);
            if (!from || !to) return null;
            const x1 = from.x + from.width;
            const y1 = from.y + 54;
            const x2 = to.x;
            const y2 = to.y + 54;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const labelWidth = Math.max(76, edge.label.length * 6.2 + 14);

            return (
              <g key={edge.id}>
                <path
                  d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke="#8083ff"
                  strokeWidth="1.75"
                  strokeDasharray="4 2"
                />
                <circle cx={x1} cy={y1} r="3" fill="#c0c1ff" />
                <circle cx={x2} cy={y2} r="3.5" fill="#4edea3" />
                <rect
                  x={midX - labelWidth / 2}
                  y={midY - 11}
                  width={labelWidth}
                  height={16}
                  rx={4}
                  fill="#060e20"
                  stroke="#2d3449"
                  strokeWidth="1"
                />
                <text
                  x={midX}
                  y={midY}
                  textAnchor="middle"
                  fill="#c7c4d7"
                  fontSize="9.5"
                  fontFamily="JetBrains Mono"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="relative w-[1200px] h-[640px]">
          {nodes.map((node) => {
            const isSelected = node.id === selectedCardId;
            return (
              <div
                key={node.id}
                onClick={() => setSelectedCardId(node.id)}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: `${node.width}px`,
                }}
                className={`absolute p-3.5 rounded-lg bg-surface-container-low border transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-primary shadow-lg'
                    : 'border-outline-variant/40 hover:border-outline'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-code-inline text-[10px] uppercase tracking-wider text-primary">
                    {node.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveCanvasNode(node.id, 30, 0);
                      }}
                      title="Nudge card right"
                      aria-label={`Nudge ${node.title} right`}
                      className="px-1 rounded bg-surface-container text-outline hover:text-on-surface text-[10px] cursor-pointer"
                    >
                      →
                    </button>
                    {node.linkedNoteId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenNoteInEditor(node.linkedNoteId!);
                        }}
                        title="Open linked note in editor"
                        aria-label={`Open note for ${node.title}`}
                        className="p-0.5 rounded bg-surface-container-high text-primary hover:text-on-surface cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          open_in_new
                        </span>
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="font-headline-sm text-sm text-on-surface font-semibold">
                  {node.title}
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant mt-1 leading-snug">
                  {node.subtitle}
                </p>
                {node.metrics && (
                  <div className="mt-2.5 pt-2 border-t border-outline-variant/20 flex items-center justify-between font-code-inline text-[11px] text-secondary tabular-nums">
                    <span>{node.metrics}</span>
                    <span>[[Linked]]</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
