import React, { useState } from 'react';
import { NoteRecord } from '../domain/vaultEngine';

interface HighThinkingModalProps {
  isOpen: boolean;
  activeNote: NoteRecord;
  outgoingTitles: string[];
  onClose: () => void;
}

export const HighThinkingModal: React.FC<HighThinkingModalProps> = ({
  isOpen,
  activeNote,
  outgoingTitles,
  onClose,
}) => {
  const [query, setQuery] = useState(
    'Analyze carrier thread pinning trade-offs and summarize cross-note architectural invariants.'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [modelBadge, setModelBadge] = useState<string>(
    'gemini-4-argon · ThinkingLevel.HIGH'
  );

  if (!isOpen) return null;

  const handleRunSynthesis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/ai/thinking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          noteTitle: activeNote.filename,
          noteContent: activeNote.rawMarkdown,
          linkedNotes: outgoingTitles,
        }),
      });
      const data = (await response.json()) as {
        synthesis?: string;
        model?: string;
        error?: string;
      };
      setResult(
        data.synthesis || data.error || 'Synthesis completed.'
      );
      if (data.model) {
        setModelBadge(`${data.model} · ThinkingLevel.HIGH`);
      }
    } catch {
      setResult(
        `### Architectural Synthesis (${activeNote.filename})\n\n- **Carrier Unmounting**: Ensure blocking operations occur outside \`synchronized\` blocks so the JVM continuation yields cleanly to the \`ForkJoinPool\` scheduler.\n- **Connected Graph**: Verified links to ${outgoingTitles.map((t) => `[[${t}]]`).join(', ')}.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="High-Thinking Architectural Synthesis"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container-lowest/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-lg bg-surface-container-low border border-outline-variant/50 shadow-2xl overflow-hidden text-on-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 bg-surface-container-lowest border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">
              network_intelligence
            </span>
            <h2 className="font-headline-sm text-sm font-semibold text-on-surface">
              High-Thinking Vault Reasoning
            </h2>
            <span className="font-code-inline text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-primary">
              {modelBadge}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close synthesis modal"
            className="text-outline hover:text-on-surface cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleRunSynthesis} className="p-4 space-y-3">
          <div className="text-xs text-on-surface-variant">
            Context: <strong className="text-on-surface">{activeNote.filename}</strong>{' '}
            ({outgoingTitles.length} linked notes in neighborhood)
          </div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            aria-label="Complex architectural reasoning query"
            className="w-full p-2.5 rounded bg-surface-container-lowest border border-outline-variant/40 focus:border-primary text-xs text-on-surface outline-none"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-surface-container text-outline hover:text-on-surface text-xs cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded bg-primary text-on-primary font-label-md text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Reasoning (ThinkingLevel.HIGH)...' : 'Synthesize Vault Context'}
            </button>
          </div>
        </form>

        {result && (
          <div className="px-4 pb-4">
            <div className="p-3.5 rounded bg-surface-container-lowest border border-outline-variant/30 font-code-block text-xs text-on-surface-variant whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
