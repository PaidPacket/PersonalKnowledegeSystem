import React, { useState } from 'react';
import { NoteRecord } from '../domain/vaultEngine';
import { WorkspaceView } from './TopHeaderBar';

interface CommandPaletteModalProps {
  isOpen: boolean;
  notes: NoteRecord[];
  onClose: () => void;
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
  onSelectView: (view: WorkspaceView) => void;
  onOpenThinkingModal: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  notes,
  onClose,
  onSelectNote,
  onCreateNote,
  onSelectView,
  onOpenThinkingModal,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchingNotes = notes.filter((n) => {
    if (!q) return true;
    return (
      n.filename.toLowerCase().includes(q) ||
      n.title.toLowerCase().includes(q) ||
      n.lead.toLowerCase().includes(q) ||
      n.frontmatter.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const commands = [
    {
      id: 'cmd-new-note',
      label: 'Vault: Create New Markdown Note',
      shortcut: 'Cmd+N',
      action: () => {
        onCreateNote();
        onClose();
      },
    },
    {
      id: 'cmd-thinking',
      label: 'AI: High-Thinking Knowledge Synthesis (gemini-4-argon)',
      shortcut: 'Cmd+J',
      action: () => {
        onClose();
        onOpenThinkingModal();
      },
    },
    {
      id: 'cmd-graph',
      label: 'View: Open Knowledge Graph Visualizer',
      shortcut: 'Cmd+G',
      action: () => {
        onSelectView('graph-view');
        onClose();
      },
    },
    {
      id: 'cmd-canvas',
      label: 'View: Open Spatial Architecture Canvas',
      shortcut: 'Cmd+B',
      action: () => {
        onSelectView('canvas-view');
        onClose();
      },
    },
  ].filter((c) => !q || c.label.toLowerCase().includes(q));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette and Quick Search"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-surface-container-lowest/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[600px] rounded-lg bg-surface-container-low border border-outline-variant/50 shadow-2xl overflow-hidden text-on-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-outline-variant/30 bg-surface-container-lowest">
          <span className="material-symbols-outlined text-primary text-[18px]">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a note title, #tag, or workspace command..."
            aria-label="Search notes or commands"
            autoFocus
            className="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-outline"
          />
          <button
            type="button"
            onClick={onClose}
            className="px-1.5 py-0.5 rounded bg-surface-container-high font-code-inline text-[10px] text-outline hover:text-on-surface cursor-pointer"
          >
            ESC
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          <div>
            <div className="px-2 py-1 text-[10px] font-label-sm uppercase tracking-wider text-outline">
              Notes ({matchingNotes.length})
            </div>
            <div className="space-y-0.5">
              {matchingNotes.slice(0, 6).map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => {
                    onSelectNote(note.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-surface-container-high text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[15px] text-primary">
                      description
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-medium text-on-surface truncate">
                        {note.filename}
                      </div>
                      <div className="text-[11px] text-outline truncate">
                        {note.title}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    {note.frontmatter.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 rounded bg-surface-container font-code-inline text-[10px] text-primary"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {commands.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-label-sm uppercase tracking-wider text-outline">
                Workspace Commands
              </div>
              <div className="space-y-0.5">
                {commands.map((cmd) => (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={cmd.action}
                    className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-surface-container-high text-left transition-colors cursor-pointer"
                  >
                    <span className="text-xs text-on-surface-variant">
                      {cmd.label}
                    </span>
                    <kbd className="font-code-inline text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-outline">
                      {cmd.shortcut}
                    </kbd>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
