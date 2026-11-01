import React, { useState } from 'react';
import { NoteRecord } from '../domain/vaultEngine';

interface DailyJournalViewProps {
  notes: NoteRecord[];
  onOpenNoteInEditor: (noteId: string) => void;
  onAddDailyEntry: (entryText: string) => void;
}

export const DailyJournalView: React.FC<DailyJournalViewProps> = ({
  notes,
  onOpenNoteInEditor,
  onAddDailyEntry,
}) => {
  const [logInput, setLogInput] = useState('');

  const dailyNote =
    notes.find((n) => n.isDailyNote) ??
    notes.find((n) => n.folderId === 'folder-04') ??
    notes[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logInput.trim()) return;
    onAddDailyEntry(logInput.trim());
    setLogInput('');
  };

  return (
    <div className="flex flex-1 h-full w-full overflow-y-auto bg-surface text-on-surface px-gutter-desktop py-space-lg">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
          <div>
            <div className="flex items-center gap-2 text-primary font-code-inline text-xs">
              <span className="material-symbols-outlined text-[16px]">
                calendar_today
              </span>
              <span>DAILY ENGINEERING JOURNAL · 2026-11-01</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold mt-1">
              {dailyNote.title}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => onOpenNoteInEditor(dailyNote.id)}
            className="px-3.5 py-1.5 rounded bg-primary-container text-on-surface hover:bg-primary hover:text-on-primary font-label-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">
              edit_document
            </span>
            <span>Open Full Note in Editor</span>
          </button>
        </div>

        {/* Quick Append Log Entry */}
        <form
          onSubmit={handleSubmit}
          className="p-4 rounded bg-surface-container-low border border-outline-variant/30 space-y-3"
        >
          <label
            htmlFor="daily-log-input"
            className="block font-label-sm uppercase tracking-wider text-outline text-[11px]"
          >
            Append Timestamped Engineering Observation or Action Item
          </label>
          <div className="flex items-center gap-2">
            <input
              id="daily-log-input"
              type="text"
              value={logInput}
              onChange={(e) => setLogInput(e.target.value)}
              placeholder="e.g., Benchmark ZGC pause times on [[Virtual Threads & Loom]]..."
              className="flex-1 px-3 py-2 rounded bg-surface-container-lowest border border-outline-variant/40 focus:border-primary text-sm text-on-surface outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded bg-secondary text-on-secondary font-label-md text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              Append Entry
            </button>
          </div>
        </form>

        {/* Today's Checklist & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded bg-surface-container-low border border-outline-variant/20 space-y-3">
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-medium">
              {dailyNote.sectionHeading}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              {dailyNote.sectionBody}
            </p>
            <div className="space-y-2 pt-1">
              {dailyNote.checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 text-xs text-on-surface-variant font-body-sm"
                >
                  <span className="material-symbols-outlined text-[15px] text-secondary">
                    {item.checked ? 'check_box' : 'check_box_outline_blank'}
                  </span>
                  <span className={item.checked ? 'line-through text-outline' : ''}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded bg-surface-container-low border border-outline-variant/20 space-y-3">
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-medium">
              Recently Modified Vault Notes
            </h2>
            <div className="space-y-1.5">
              {notes.slice(0, 5).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onOpenNoteInEditor(n.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded bg-surface-container hover:bg-surface-container-high transition-colors text-left cursor-pointer"
                >
                  <span className="font-label-md text-xs text-on-surface truncate">
                    {n.filename}
                  </span>
                  <span className="font-code-inline text-[10px] text-outline tabular-nums">
                    {n.updatedAt}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
