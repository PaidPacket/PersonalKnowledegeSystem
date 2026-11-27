import React, { useState } from 'react';
import {
  NoteRecord,
  buildCanonicalMarkdownExport,
  extractWikiLinks,
  resolveWikiLink,
} from '../domain/vaultEngine';

interface VaultPreferencesViewProps {
  vaultName: string;
  notes: NoteRecord[];
  onImportMarkdownNote: (filename: string, rawMarkdown: string) => void;
  onExportVaultJson: () => void;
  onOpenThinkingModal: () => void;
  firebaseUser?: {
    uid: string;
    displayName: string | null;
    email: string | null;
  } | null;
  onSignInFirebase?: () => void;
  onSignOutFirebase?: () => void;
  onForceCloudSync?: () => void;
}

export const VaultPreferencesView: React.FC<VaultPreferencesViewProps> = ({
  vaultName,
  notes,
  onImportMarkdownNote,
  onExportVaultJson,
  onOpenThinkingModal,
  firebaseUser,
  onSignInFirebase,
  onSignOutFirebase,
  onForceCloudSync,
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

  const handleDownloadNoteMarkdown = (note: NoteRecord) => {
    const canonicalMd = buildCanonicalMarkdownExport(note);
    const safeFilename = note.filename.toLowerCase().endsWith('.md')
      ? note.filename
      : `${note.title || 'Untitled Note'}.md`;

    const blob = new Blob([canonicalMd], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importTitle.trim() || !importContent.trim()) return;
    const filename = importTitle.trim().endsWith('.md')
      ? importTitle.trim()
      : `${importTitle.trim()}.md`;
    onImportMarkdownNote(filename, importContent);
    setImportMessage(
      firebaseUser
        ? `Imported "${filename}" into local IndexedDB vault and queued Firebase Firestore sync.`
        : `Imported "${filename}" into local IndexedDB vault.`
    );
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

        {/* Firebase Firestore Real-Time Cloud Sync Card */}
        <div className="p-4 rounded bg-surface-container-low border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                cloud_done
              </span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Firebase Firestore Cloud Database Connectivity
              </h2>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-code-inline uppercase tracking-wider ${
                  firebaseUser
                    ? 'bg-secondary-container/30 text-secondary border border-secondary/30'
                    : 'bg-surface-container-highest text-outline border border-outline-variant/30'
                }`}
              >
                {firebaseUser ? 'Connected & Syncing' : 'Local-First Mode'}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant max-w-2xl">
              {firebaseUser
                ? `Signed in as ${firebaseUser.email || firebaseUser.displayName || firebaseUser.uid}. All note edits, YAML frontmatter properties, and new Markdown files sync automatically to /vaults/${firebaseUser.uid}/notes in Firestore.`
                : 'Hybrid local-first persistence is active via IndexedDB & LocalStorage. Sign in with Google to enable real-time cloud synchronization with Firebase Firestore across sessions.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {firebaseUser ? (
              <>
                {onForceCloudSync && (
                  <button
                    type="button"
                    onClick={onForceCloudSync}
                    className="px-3 py-1.5 rounded bg-secondary text-on-secondary font-label-md text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      sync
                    </span>
                    <span>Sync Vault Now</span>
                  </button>
                )}
                {onSignOutFirebase && (
                  <button
                    type="button"
                    onClick={onSignOutFirebase}
                    className="px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant border border-outline-variant/30 font-label-md text-xs transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                )}
              </>
            ) : (
              onSignInFirebase && (
                <button
                  type="button"
                  onClick={onSignInFirebase}
                  className="px-3.5 py-2 rounded bg-primary text-on-primary font-label-md text-xs font-semibold hover:opacity-95 transition-opacity flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    cloud_sync
                  </span>
                  <span>Connect Firebase with Google</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Storage & Link Integrity Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded bg-surface-container-low border border-outline-variant/20">
            <span className="font-label-sm uppercase tracking-wider text-outline text-[10px]">
              Persistence Engine
            </span>
            <div className="text-base font-semibold text-secondary mt-1">
              {firebaseUser
                ? 'Firebase Firestore + IndexedDB'
                : 'IndexedDB + LocalStorage'}
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Hybrid local-first storage with automatic real-time Firestore
              cloud synchronization when authenticated.
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

        {/* Direct Markdown (.md) Export Table */}
        <div className="p-4 rounded bg-surface-container-low border border-outline-variant/30 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-medium">
                Export Notes as Standard Markdown (.md)
              </h2>
              <p className="text-xs text-on-surface-variant">
                Download any vault note with canonical YAML frontmatter,
                checklist tasks, and [[WikiLinks]] preserved.
              </p>
            </div>
            <span className="font-code-inline text-[11px] text-outline">
              {notes.length} notes available
            </span>
          </div>
          <div className="divide-y divide-outline-variant/20 max-h-60 overflow-y-auto border border-outline-variant/20 rounded bg-surface-container-lowest">
            {notes.map((note) => (
              <div
                key={note.id}
                className="px-3 py-2 flex items-center justify-between gap-3 hover:bg-surface-container-low transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium text-on-surface truncate">
                    {note.filename}
                  </div>
                  <div className="text-[11px] text-outline font-code-inline truncate">
                    Status: {note.frontmatter.status} • Tags:{' '}
                    {note.frontmatter.tags.join(', ')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadNoteMarkdown(note)}
                  className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-secondary hover:text-on-secondary text-secondary border border-secondary/30 font-label-sm text-[11px] font-semibold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    download
                  </span>
                  <span>Export .md</span>
                </button>
              </div>
            ))}
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

