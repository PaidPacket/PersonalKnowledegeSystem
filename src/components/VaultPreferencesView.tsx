import React, { useState } from 'react';
import { NoteRecord, extractWikiLinks, resolveWikiLink } from '../domain/vaultEngine';

interface VaultPreferencesViewProps {
  vaultName: string;
  notes: NoteRecord[];
  onImportMarkdownNote: (filename: string, rawMarkdown: string) => void;
  onExportVaultJson: () => void;
  onOpenThinkingModal: () => void;
}

export const VaultPreferencesView: React.FC<VaultPreferencesViewProps> = ({
  vaultName,
  notes,
  onImportMarkdownNote,
  onExportVaultJson,
  onOpenThinkingModal,
}) => {
  const [importTitle, setImportTitle] = useState('');
  const [importContent, setImportContent] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Audit all [[WikiLinks]] across the vault
  let totalLinks = 0;
  let resolvedLinks = 0;
  for (const n of notes) {
    const parsed = extractWikiLinks(`${n.wikiParagraph}\n${n.rawMarkdown}`);
    totalLinks += parsed.length;
    for (const l of parsed) {
      if (resolveWikiLink(l.target, notes)) {
        resolvedLinks += 1;
      }
    }
  }

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importTitle.trim() || !importContent.trim()) return;
    const filename = importTitle.trim().endsWith('.md')
      ? importTitle.trim()
      : `${importTitle.trim()}.md`;
    onImportMarkdownNote(filename, importContent);
    setImportMessage(`Imported "${filename}" into local IndexedDB vault.`);
    setImportTitle('');
    setImportContent('');
  };

  return (
    <div className="flex flex-1 h-full w-full overflow-y-auto bg-surface text-on-surface px-gutter-desktop py-space-lg">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div className="border-b border-outline-variant/30 pb-4 flex items-center justify-between">
          <div>
            <span className="font-code-inline text-xs text-primary uppercase tracking-wider">
              VAULT GOVERNANCE &amp; PERSISTENCE
            </span>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold mt-1">
              {vaultName} Preferences
            </h1>
          </div>
          <button
            type="button"
            onClick={onExportVaultJson}
            className="px-3.5 py-2 rounded bg-primary-container text-on-surface hover:bg-primary hover:text-on-primary font-label-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">
              download
            </span>
            <span>Export Full Vault Backup (.json)</span>
          </button>
        </div>

        {/* Storage & Link Integrity Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded bg-surface-container-low border border-outline-variant/20">
            <span className="font-label-sm uppercase tracking-wider text-outline text-[10px]">
              Persistence Engine
            </span>
            <div className="text-base font-semibold text-secondary mt-1">
              IndexedDB + LocalStorage
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Local-first storage active. Browser data persists across reloads
              without requiring a cloud account.
            </p>
          </div>

          <div className="p-4 rounded bg-surface-container-low border border-outline-variant/20 tabular-nums">
            <span className="font-label-sm uppercase tracking-wider text-outline text-[10px]">
              WikiLink Integrity Audit
            </span>
            <div className="text-base font-semibold text-primary mt-1">
              {resolvedLinks} / {totalLinks} Resolved
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Dedicated linking service resolves titles, filenames, and YAML
              aliases automatically.
            </p>
          </div>

          <div className="p-4 rounded bg-surface-container-low border border-outline-variant/20">
            <span className="font-label-sm uppercase tracking-wider text-outline text-[10px]">
              Deep Reasoning Model
            </span>
            <div className="text-base font-semibold text-tertiary mt-1">
              gemini-4-argon (HIGH)
            </div>
            <button
              type="button"
              onClick={onOpenThinkingModal}
              className="mt-2 text-xs text-primary hover:underline cursor-pointer"
            >
              Launch High-Thinking Synthesis →
            </button>
          </div>
        </div>

        {/* Markdown Import Form */}
        <form
          onSubmit={handleImportSubmit}
          className="p-4 rounded bg-surface-container-low border border-outline-variant/30 space-y-3"
        >
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-medium">
            Import Markdown Document (.md)
          </h2>
          {importMessage && (
            <div className="p-2 rounded bg-secondary-container/20 text-secondary text-xs font-code-inline">
              {importMessage}
            </div>
          )}
          <div className="space-y-2">
            <input
              type="text"
              value={importTitle}
              onChange={(e) => setImportTitle(e.target.value)}
              placeholder="Note filename (e.g., ZGC Generational Benchmarks.md)"
              aria-label="Import note filename"
              required
              className="w-full px-3 py-1.5 rounded bg-surface-container-lowest border border-outline-variant/40 focus:border-primary text-xs text-on-surface outline-none"
            />
            <textarea
              value={importContent}
              onChange={(e) => setImportContent(e.target.value)}
              placeholder="Paste Markdown with optional YAML frontmatter and [[WikiLinks]]..."
              aria-label="Import markdown body"
              rows={5}
              required
              className="w-full p-3 rounded bg-surface-container-lowest border border-outline-variant/40 focus:border-primary text-xs font-code-block text-on-surface outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 rounded bg-secondary text-on-secondary font-label-md text-xs font-semibold cursor-pointer"
          >
            Import Note into Vault
          </button>
        </form>
      </div>
    </div>
  );
};
