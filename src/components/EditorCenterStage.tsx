import React, { useState } from 'react';
import {
  FolderRecord,
  NoteFrontmatter,
  NoteRecord,
  buildCanonicalMarkdownExport,
  computeDocumentMetrics,
  extractWikiLinks,
  rebuildRawMarkdownFromNote,
  syncStructuredFieldsFromRawMarkdown,
} from '../domain/vaultEngine';

interface EditorCenterStageProps {
  activeNote: NoteRecord;
  openTabs: NoteRecord[];
  folders: FolderRecord[];
  onSelectTab: (noteId: string) => void;
  onCloseTab: (noteId: string, e: React.MouseEvent) => void;
  onToggleChecklistItem: (noteId: string, checklistId: string) => void;
  onAddChecklistItem: (noteId: string, text: string) => void;
  onUpdateNote: (noteId: string, updater: (prev: NoteRecord) => NoteRecord) => void;
  onRenameNote: (noteId: string, newTitleOrFilename: string) => void;
  onDeleteNote: (noteId: string) => void;
  onOpenNoteByTitle: (title: string) => void;
  onSelectFolderFilter: (folderId: string) => void;
  onOpenThinkingModal: () => void;
  highlightedHeading: string | null;
}

export const EditorCenterStage: React.FC<EditorCenterStageProps> = ({
  activeNote,
  openTabs,
  folders,
  onSelectTab,
  onCloseTab,
  onToggleChecklistItem,
  onAddChecklistItem,
  onUpdateNote,
  onRenameNote,
  onDeleteNote,
  onOpenNoteByTitle,
  onSelectFolderFilter,
  onOpenThinkingModal,
  highlightedHeading,
}) => {
  const [editorMode, setEditorMode] = useState<'edit' | 'preview' | 'source'>('edit');
  const [inlineProseEdit, setInlineProseEdit] = useState(false);
  const [splitPaneOpen, setSplitPaneOpen] = useState(false);
  const [yamlExpanded, setYamlExpanded] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [exportedMdFeedback, setExportedMdFeedback] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);

  const metrics = computeDocumentMetrics(activeNote);
  const isDefaultVirtualThreads =
    activeNote.id === 'note-virtual-threads' &&
    activeNote.checklist.length === 4;

  const displayWords = isDefaultVirtualThreads
    ? '1,428'
    : metrics.words.toLocaleString();
  const displayChars = isDefaultVirtualThreads
    ? '9,842'
    : metrics.chars.toLocaleString();
  const displayReadTime = isDefaultVirtualThreads
    ? '6 min'
    : `${metrics.readTimeMinutes} min`;

  // Resolve folder breadcrumbs
  const currentFolder = folders.find((f) => f.id === activeNote.folderId);
  const parentFolder = currentFolder?.parentId
    ? folders.find((f) => f.id === currentFolder.parentId)
    : undefined;

  const handleCopyCode = () => {
    const codeText = activeNote.codeBlock?.code ?? '';
    if (navigator.clipboard && codeText) {
      navigator.clipboard.writeText(codeText).catch(() => {});
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const handleExportMarkdown = () => {
    const canonicalMd = buildCanonicalMarkdownExport(activeNote);
    const downloadFilename = activeNote.filename.toLowerCase().endsWith('.md')
      ? activeNote.filename
      : `${activeNote.filename}.md`;
    const blob = new Blob([canonicalMd], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadFilename;
    a.click();
    URL.revokeObjectURL(url);
    setMoreMenuOpen(false);
    setExportedMdFeedback(true);
    setTimeout(() => setExportedMdFeedback(false), 1800);
  };

  const applyStructuredUpdate = (
    mutator: (prev: NoteRecord) => NoteRecord
  ) => {
    onUpdateNote(activeNote.id, (prev) => {
      const next = mutator(prev);
      return {
        ...next,
        rawMarkdown: rebuildRawMarkdownFromNote(next),
        updatedAt: 'Just now',
      };
    });
  };

  const insertMarkdownSnippet = (snippet: string) => {
    setEditorMode('source');
    onUpdateNote(activeNote.id, (prev) => {
      const base = prev.rawMarkdown.endsWith('\n')
        ? prev.rawMarkdown
        : `${prev.rawMarkdown}\n`;
      const nextRaw = `${base}${snippet}\n`;
      return {
        ...syncStructuredFieldsFromRawMarkdown(prev, nextRaw),
        updatedAt: 'Just now',
      };
    });
  };

  const cycleStatus = () => {
    const order: NoteFrontmatter['status'][] = [
      'in-progress',
      'verified',
      'draft',
      'archived',
    ];
    const next =
      order[(order.indexOf(activeNote.frontmatter.status) + 1) % order.length];
    applyStructuredUpdate((prev) => ({
      ...prev,
      frontmatter: { ...prev.frontmatter, status: next },
    }));
  };

  const cyclePriority = () => {
    const order: NoteFrontmatter['priority'][] = ['high', 'medium', 'low'];
    const next =
      order[(order.indexOf(activeNote.frontmatter.priority) + 1) % order.length];
    applyStructuredUpdate((prev) => ({
      ...prev,
      frontmatter: { ...prev.frontmatter, priority: next },
    }));
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newTagInput.trim().replace(/^#/, '');
    if (!cleaned) return;
    applyStructuredUpdate((prev) => ({
      ...prev,
      frontmatter: {
        ...prev.frontmatter,
        tags: prev.frontmatter.tags.includes(cleaned)
          ? prev.frontmatter.tags
          : [...prev.frontmatter.tags, cleaned],
      },
    }));
    setNewTagInput('');
    setShowAddTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    applyStructuredUpdate((prev) => {
      const remaining = prev.frontmatter.tags.filter((t) => t !== tagToRemove);
      return {
        ...prev,
        frontmatter: {
          ...prev.frontmatter,
          tags: remaining.length > 0 ? remaining : ['engineering'],
        },
      };
    });
  };

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddChecklistItem(activeNote.id, newTaskText.trim());
    setNewTaskText('');
    setShowAddTask(false);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (renameDraft.trim()) {
      onRenameNote(activeNote.id, renameDraft.trim());
    }
    setIsRenaming(false);
  };

  // Render paragraph with interactive [[WikiLinks]]
  const renderWikiParagraph = (text: string) => {
    const links = extractWikiLinks(text);
    if (links.length === 0) {
      return <span>{text}</span>;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const regex = /\[\[([^[\]]+)\]\]/g;
    let match: RegExpExecArray | null;
    let idx = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <React.Fragment key={`txt-${idx++}`}>
            {text.slice(lastIndex, match.index)}
          </React.Fragment>
        );
      }
      const rawInner = match[1];
      const [targetAndHeading, alias] = rawInner.split('|');
      const [targetName] = targetAndHeading.split('#');
      const displayLabel = `[[${alias || targetName}]]`;

      parts.push(
        <button
          key={`link-${idx++}`}
          type="button"
          onClick={() => onOpenNoteByTitle(targetName.trim())}
          className="text-primary hover:text-primary-fixed underline decoration-dashed hover:decoration-solid font-medium transition-all cursor-pointer inline"
        >
          {displayLabel}
        </button>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(
        <React.Fragment key={`txt-end`}>{text.slice(lastIndex)}</React.Fragment>
      );
    }

    return <>{parts}</>;
  };

  return (
    <section className="flex-1 min-w-0 bg-surface flex flex-col justify-between overflow-hidden">
      {/* Top Tab Bar */}
      <div className="h-9 bg-surface-container-lowest flex items-center justify-between px-space-xs select-none border-b border-outline-variant/20">
        {/* Tabs List */}
        <div className="flex items-center h-full gap-0.5 overflow-x-auto" role="tablist">
          {openTabs.map((tab) => {
            const isActive = tab.id === activeNote.id;
            return (
              <div
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectTab(tab.id)}
                className={`h-full flex items-center gap-2 px-3 font-label-md text-label-md rounded-t transition-colors cursor-pointer relative group ${
                  isActive
                    ? 'bg-surface text-on-surface'
                    : 'text-on-surface-variant hover:bg-surface-container-low/80 hover:text-on-surface'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
                )}
                <span
                  className={`material-symbols-outlined text-[14px] ${
                    isActive ? 'text-primary' : 'text-outline'
                  }`}
                >
                  description
                </span>
                <span
                  className={`truncate max-w-[160px] ${
                    isActive ? 'font-medium' : ''
                  }`}
                >
                  {tab.filename}
                </span>
                <button
                  type="button"
                  aria-label={`Close tab ${tab.filename}`}
                  onClick={(e) => onCloseTab(tab.id, e)}
                  className={`w-4 h-4 rounded hover:bg-surface-container-high items-center justify-center text-outline hover:text-on-surface transition-colors cursor-pointer ${
                    isActive ? 'flex' : 'hidden group-hover:flex'
                  }`}
                >
                  <span className="material-symbols-outlined text-[12px]">
                    close
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Tab Bar Control Actions */}
        <div className="flex items-center gap-1.5 text-outline relative">
          <button
            type="button"
            onClick={handleExportMarkdown}
            aria-label="Export Note as Markdown (.md)"
            title={`Download ${activeNote.filename} with YAML frontmatter`}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-secondary-container/20 hover:bg-secondary-container/35 text-secondary border border-secondary/30 text-[11px] font-label-md font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <span className="material-symbols-outlined text-[14px]">
              {exportedMdFeedback ? 'check' : 'download'}
            </span>
            <span>{exportedMdFeedback ? 'Exported .md' : 'Export .md'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSplitPaneOpen((prev) => !prev)}
            className={`p-1 rounded hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer ${
              splitPaneOpen ? 'bg-surface-container-high text-primary' : ''
            }`}
            title="Split Pane Right"
            aria-label="Split Pane Right"
          >
            <span className="material-symbols-outlined text-[16px]">
              vertical_split
            </span>
          </button>

          <div className="flex items-center bg-surface-container-low rounded p-0.5 text-outline">
            <button
              type="button"
              onClick={() => setEditorMode('edit')}
              className={`px-2 py-0.5 rounded text-[11px] font-label-md transition-colors cursor-pointer whitespace-nowrap ${
                editorMode === 'edit'
                  ? 'bg-surface text-on-surface font-medium shadow-sm'
                  : 'hover:text-on-surface'
              }`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                setInlineProseEdit(false);
                setEditorMode('preview');
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-label-md transition-colors cursor-pointer whitespace-nowrap ${
                editorMode === 'preview'
                  ? 'bg-surface text-on-surface font-medium shadow-sm'
                  : 'hover:text-on-surface'
              }`}
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('source')}
              className={`px-2 py-0.5 rounded text-[11px] font-label-md transition-colors cursor-pointer whitespace-nowrap ${
                editorMode === 'source'
                  ? 'bg-surface text-on-surface font-medium shadow-sm'
                  : 'hover:text-on-surface'
              }`}
            >
              Raw MD
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMoreMenuOpen((prev) => !prev)}
            className="p-1 rounded hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
            title="More Note Options"
            aria-label="More Note Options"
          >
            <span className="material-symbols-outlined text-[16px]">
              more_vert
            </span>
          </button>

          {moreMenuOpen && (
            <div
              className="absolute right-0 top-8 w-52 rounded-lg bg-surface-container-high border border-outline-variant/40 shadow-xl py-1 z-50 text-on-surface text-xs"
              onMouseLeave={() => setMoreMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => {
                  setRenameDraft(activeNote.filename.replace(/\.md$/i, ''));
                  setIsRenaming(true);
                  setMoreMenuOpen(false);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-surface-container-highest flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px] text-primary">
                  drive_file_rename_outline
                </span>
                <span>Rename &amp; Update Links...</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  applyStructuredUpdate((prev) => ({
                    ...prev,
                    bookmarked: !prev.bookmarked,
                  }));
                  setMoreMenuOpen(false);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-surface-container-highest flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px] text-tertiary">
                  star
                </span>
                <span>
                  {activeNote.bookmarked
                    ? 'Remove from Bookmarks'
                    : 'Pin to Bookmarks'}
                </span>
              </button>
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="w-full px-3 py-1.5 text-left hover:bg-surface-container-highest flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px] text-secondary">
                  download
                </span>
                <span>Export Markdown (.md)</span>
              </button>
              <div className="my-1 border-t border-outline-variant/20" />
              <button
                type="button"
                onClick={() => {
                  setMoreMenuOpen(false);
                  onDeleteNote(activeNote.id);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-error-container/40 text-error flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">
                  delete
                </span>
                <span>Delete Note</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumbs Bar */}
      <div className="h-8 px-gutter-desktop flex items-center justify-between text-outline bg-surface-container-lowest/30 border-b border-outline-variant/10">
        <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-outline overflow-hidden">
          <button
            type="button"
            onClick={() => onSelectFolderFilter('')}
            className="hover:text-on-surface cursor-pointer transition-colors whitespace-nowrap"
          >
            Engineering Vault
          </button>
          {parentFolder && (
            <>
              <span className="text-[12px]">/</span>
              <button
                type="button"
                onClick={() => onSelectFolderFilter(parentFolder.id)}
                className="hover:text-on-surface cursor-pointer transition-colors whitespace-nowrap"
              >
                {parentFolder.name}
              </button>
            </>
          )}
          {currentFolder && (
            <>
              <span className="text-[12px]">/</span>
              <button
                type="button"
                onClick={() => onSelectFolderFilter(currentFolder.id)}
                className="hover:text-on-surface cursor-pointer transition-colors whitespace-nowrap"
              >
                {currentFolder.name}
              </button>
            </>
          )}
          <span className="text-[12px]">/</span>
          {isRenaming ? (
            <form onSubmit={handleRenameSubmit} className="inline-flex items-center gap-1">
              <input
                type="text"
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                aria-label="New note filename"
                autoFocus
                className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface text-xs outline-none border border-primary"
              />
              <button
                type="submit"
                className="px-1.5 py-0.5 rounded bg-primary text-on-primary text-[10px] font-medium cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsRenaming(false)}
                className="px-1.5 py-0.5 rounded bg-surface-container text-outline text-[10px] cursor-pointer"
              >
                Cancel
              </button>
            </form>
          ) : (
            <span
              onDoubleClick={() => {
                setRenameDraft(activeNote.filename.replace(/\.md$/i, ''));
                setIsRenaming(true);
              }}
              title="Double-click to rename note and update [[WikiLinks]]"
              className="text-on-surface font-medium truncate cursor-pointer"
            >
              {activeNote.filename}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 font-label-sm text-[11px] text-outline/80 whitespace-nowrap">
          <span className="material-symbols-outlined text-[13px] text-secondary">
            cloud_done
          </span>
          <span>Edited {activeNote.updatedAt}</span>
        </div>
      </div>

      {/* Main Document Scroll Container (Supports Single or Split Pane) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto relative px-gutter-desktop py-space-lg scroll-smooth">
          {editorMode === 'source' ? (
            <div className="max-w-[740px] mx-auto space-y-space-md">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-container-low px-3 py-2 rounded border border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    edit_note
                  </span>
                  <span className="font-code-inline text-xs text-primary">
                    Full Markdown &amp; YAML Frontmatter Editor ({activeNote.filename})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportMarkdown}
                    className="px-2.5 py-1 rounded bg-secondary-container/25 hover:bg-secondary-container/40 text-secondary border border-secondary/30 text-xs font-medium cursor-pointer flex items-center gap-1 whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {exportedMdFeedback ? 'check' : 'download'}
                    </span>
                    <span>{exportedMdFeedback ? 'Exported .md' : 'Download .md'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode('edit')}
                    className="px-2.5 py-1 rounded bg-primary text-on-primary text-xs font-medium cursor-pointer whitespace-nowrap"
                  >
                    Done Editing Source
                  </button>
                </div>
              </div>

              {/* Raw Markdown Quick Syntax Insertion Bar */}
              <div className="flex flex-wrap items-center gap-1 px-2.5 py-1.5 rounded bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface-variant">
                <button
                  type="button"
                  onClick={() => insertMarkdownSnippet('\n## New Section Heading')}
                  className="px-2 py-0.5 rounded hover:bg-surface-container-high hover:text-on-surface font-code-inline text-[11px] cursor-pointer"
                >
                  ## H2
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdownSnippet('\n### Subsection Heading')}
                  className="px-2 py-0.5 rounded hover:bg-surface-container-high hover:text-on-surface font-code-inline text-[11px] cursor-pointer"
                >
                  ### H3
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdownSnippet('**bold point**')}
                  className="px-2 py-0.5 rounded hover:bg-surface-container-high hover:text-on-surface font-code-inline text-[11px] cursor-pointer"
                >
                  **Bold**
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdownSnippet('*italic emphasis*')}
                  className="px-2 py-0.5 rounded hover:bg-surface-container-high hover:text-on-surface font-code-inline text-[11px] cursor-pointer"
                >
                  *Italic*
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdownSnippet('`inlineCode`')}
                  className="px-2 py-0.5 rounded hover:bg-surface-container-high hover:text-on-surface font-code-inline text-[11px] cursor-pointer"
                >
                  `Code`
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdownSnippet('[[Thread Pools & Executors]]')}
                  className="px-2 py-0.5 rounded hover:bg-surface-container-high text-primary font-code-inline text-[11px] cursor-pointer"
                >
                  [[WikiLink]]
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdownSnippet('- [ ] Verify concurrency boundary')}
                  className="px-2 py-0.5 rounded hover:bg-surface-container-high hover:text-on-surface font-code-inline text-[11px] cursor-pointer"
                >
                  - [ ] Task
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateNote(activeNote.id, (prev) => ({
                      ...prev,
                      rawMarkdown: rebuildRawMarkdownFromNote(prev),
                      updatedAt: 'Just now',
                    }));
                  }}
                  title="Rebuild canonical YAML frontmatter and Markdown structure"
                  className="ml-auto px-2 py-0.5 rounded bg-surface-container text-secondary hover:bg-surface-container-high font-code-inline text-[11px] cursor-pointer"
                >
                  Format YAML + MD
                </button>
              </div>

              <textarea
                aria-label="Raw Markdown Source Editor"
                value={activeNote.rawMarkdown}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateNote(activeNote.id, (prev) => ({
                    ...syncStructuredFieldsFromRawMarkdown(prev, val),
                    updatedAt: 'Just now',
                  }));
                }}
                rows={26}
                className="w-full p-4 rounded bg-surface-container-lowest border border-outline-variant/40 focus:border-primary text-on-surface font-code-block text-code-block leading-relaxed outline-none resize-y"
              />
            </div>
          ) : (
            /* Centered Reading Prose Container (~740px) */
            <div className="max-w-[740px] mx-auto space-y-space-lg">
              {/* Collapsible Metadata / YAML Frontmatter */}
              <div className="rounded bg-surface-container-low p-space-md space-y-2">
                <button
                  type="button"
                  onClick={() => setYamlExpanded((prev) => !prev)}
                  className="w-full flex items-center justify-between cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-2 text-outline group-hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-[15px]">
                      code_blocks
                    </span>
                    <span className="font-code-inline text-[11px] font-medium uppercase tracking-wider text-outline">
                      Properties (YAML)
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[15px] text-outline group-hover:text-on-surface">
                    {yamlExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {yamlExpanded && (
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 pt-1 font-code-inline text-code-inline text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="text-outline w-16">tags:</span>
                      <div className="flex flex-wrap items-center gap-1">
                        {activeNote.frontmatter.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container text-primary text-[10px]"
                          >
                            <span>{tag}</span>
                            {editorMode === 'edit' &&
                              activeNote.frontmatter.tags.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTag(tag)}
                                  title={`Remove tag ${tag}`}
                                  aria-label={`Remove tag ${tag}`}
                                  className="text-outline hover:text-on-surface cursor-pointer"
                                >
                                  ×
                                </button>
                              )}
                          </span>
                        ))}
                        {editorMode === 'edit' && !showAddTag && (
                          <button
                            type="button"
                            onClick={() => setShowAddTag(true)}
                            title="Add tag"
                            aria-label="Add tag"
                            className="px-1.5 py-0.5 rounded bg-surface-container-high text-outline hover:text-on-surface text-[10px] cursor-pointer"
                          >
                            +
                          </button>
                        )}
                        {showAddTag && (
                          <form onSubmit={handleAddTag} className="inline-flex">
                            <input
                              type="text"
                              value={newTagInput}
                              onChange={(e) => setNewTagInput(e.target.value)}
                              onBlur={() => setShowAddTag(false)}
                              placeholder="tag..."
                              autoFocus
                              className="w-20 px-1 py-0.5 rounded bg-surface-container-high text-on-surface text-[10px] outline-none border border-primary"
                            />
                          </form>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-outline w-16">status:</span>
                      <button
                        type="button"
                        onClick={cycleStatus}
                        title="Click to cycle note status"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-container/20 text-secondary text-[11px] font-medium cursor-pointer hover:bg-secondary-container/30 transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        {activeNote.frontmatter.status}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-outline w-16">created:</span>
                      <span className="text-on-surface-variant font-code-inline tabular-nums">
                        {activeNote.frontmatter.created}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-outline w-16">priority:</span>
                      <button
                        type="button"
                        onClick={cyclePriority}
                        title="Click to cycle note priority"
                        className="px-1.5 py-0.5 rounded bg-tertiary-container/20 text-tertiary text-[11px] font-medium cursor-pointer hover:bg-tertiary-container/30 transition-colors"
                      >
                        {activeNote.frontmatter.priority}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Document Header Title */}
              <div className="space-y-space-sm pt-space-xs">
                {editorMode === 'edit' && inlineProseEdit ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      aria-label="Edit Note Title"
                      value={activeNote.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        applyStructuredUpdate((prev) => ({
                          ...prev,
                          title: val,
                        }));
                      }}
                      className="w-full px-3 py-1.5 rounded bg-surface-container-lowest border border-primary/50 font-headline-xl text-headline-xl text-on-surface font-semibold outline-none"
                    />
                    <textarea
                      aria-label="Edit Note Lead Summary"
                      value={activeNote.lead}
                      onChange={(e) => {
                        const val = e.target.value;
                        applyStructuredUpdate((prev) => ({
                          ...prev,
                          lead: val,
                        }));
                      }}
                      rows={3}
                      className="w-full p-2.5 rounded bg-surface-container-lowest border border-outline-variant/40 focus:border-primary font-body-lg text-body-lg text-on-surface-variant leading-relaxed outline-none"
                    />
                  </div>
                ) : (
                  <>
                    <h1
                      onDoubleClick={() => {
                        if (editorMode === 'edit') setInlineProseEdit(true);
                      }}
                      title="Double-click or use Inline Edit button to edit note title & prose"
                      className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold"
                    >
                      {activeNote.title}
                    </h1>
                    {activeNote.id === 'note-virtual-threads' &&
                    activeNote.lead.startsWith('Java 21 delivers JEP 444') ? (
                      <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                        Java 21 delivers{' '}
                        <span className="font-medium text-primary">JEP 444</span>,
                        officially stabilizing user-mode lightweight Virtual Threads.
                        While conventional platform threads implement a rigid 1:1
                        mapping with native OS kernel threads, virtual threads
                        decouple execution context via an M:N scheduling model
                        orchestrated directly on JVM Carrier Threads backed by
                        standard{' '}
                        <code className="font-code-inline text-code-inline px-1 py-0.5 bg-surface-container-high rounded text-primary">
                          ForkJoinPool
                        </code>{' '}
                        instances.
                      </p>
                    ) : (
                      <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                        {activeNote.lead}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Floating Inline Action / Formatting Toolbar */}
              {editorMode === 'edit' && (
                <div className="flex flex-wrap items-center gap-1 px-2 py-1 bg-surface-container-high rounded shadow-md w-fit text-on-surface-variant">
                  <button
                    type="button"
                    onClick={() => setInlineProseEdit((prev) => !prev)}
                    className={`px-2 py-0.5 rounded text-[11px] font-label-md cursor-pointer transition-colors ${
                      inlineProseEdit
                        ? 'bg-primary text-on-primary font-medium'
                        : 'hover:bg-surface-container hover:text-on-surface text-primary'
                    }`}
                  >
                    {inlineProseEdit ? 'Done Inline Edit' : 'Edit Prose Inline'}
                  </button>
                  <span className="w-px h-3 bg-outline-variant/40 mx-0.5" />
                  <button
                    type="button"
                    onClick={() => insertMarkdownSnippet('\n## Architectural Section')}
                    className="px-1.5 py-0.5 hover:bg-surface-container hover:text-on-surface rounded text-[11px] font-label-md cursor-pointer"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSnippet('\n### Implementation Detail')}
                    className="px-1.5 py-0.5 hover:bg-surface-container hover:text-on-surface rounded text-[11px] font-label-md cursor-pointer"
                  >
                    H3
                  </button>
                  <span className="w-px h-3 bg-outline-variant/40 mx-0.5" />
                  <button
                    type="button"
                    onClick={() => insertMarkdownSnippet('**bold highlight**')}
                    title="Bold"
                    aria-label="Format Bold"
                    className="p-1 hover:bg-surface-container hover:text-on-surface rounded text-outline cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      format_bold
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSnippet('*italic note*')}
                    title="Italic"
                    aria-label="Format Italic"
                    className="p-1 hover:bg-surface-container hover:text-on-surface rounded text-outline cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      format_italic
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSnippet('`inlineCode`')}
                    title="Inline Code"
                    aria-label="Format Code"
                    className="p-1 hover:bg-surface-container hover:text-on-surface rounded text-outline cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      code
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSnippet('[[Thread Pools & Executors]]')}
                    title="Insert [[WikiLink]]"
                    aria-label="Insert Link"
                    className="p-1 hover:bg-surface-container hover:text-on-surface rounded text-outline cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      link
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddTask((prev) => !prev)}
                    title="Add Checklist Item"
                    aria-label="Add Checklist Item"
                    className="p-1 hover:bg-surface-container hover:text-on-surface rounded text-outline cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      check_box
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenThinkingModal}
                    title="High-Thinking Synthesis (gemini-4-argon)"
                    aria-label="Table or Synthesis"
                    className="p-1 hover:bg-surface-container hover:text-on-surface rounded text-outline cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      table_chart
                    </span>
                  </button>
                  <span className="w-px h-3 bg-outline-variant/40 mx-0.5" />
                  <button
                    type="button"
                    onClick={handleExportMarkdown}
                    title="Download note as .md file"
                    className="px-2 py-0.5 rounded bg-secondary-container/20 hover:bg-secondary-container/35 text-secondary text-[11px] font-label-md font-medium cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      download
                    </span>
                    <span>.md</span>
                  </button>
                </div>
              )}

              {/* Section H2 */}
              <div
                className={`space-y-space-md pt-space-xs transition-colors ${
                  highlightedHeading ? 'ring-1 ring-primary/30 rounded p-2' : ''
                }`}
              >
                {editorMode === 'edit' && inlineProseEdit ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      aria-label="Edit Section Heading"
                      value={activeNote.sectionHeading}
                      onChange={(e) => {
                        const val = e.target.value;
                        applyStructuredUpdate((prev) => ({
                          ...prev,
                          sectionHeading: val,
                        }));
                      }}
                      className="w-full px-3 py-1 rounded bg-surface-container-lowest border border-primary/50 font-headline-lg text-headline-lg text-on-surface font-semibold outline-none"
                    />
                    <textarea
                      aria-label="Edit Section Body"
                      value={activeNote.sectionBody}
                      onChange={(e) => {
                        const val = e.target.value;
                        applyStructuredUpdate((prev) => ({
                          ...prev,
                          sectionBody: val,
                        }));
                      }}
                      rows={3}
                      className="w-full p-2.5 rounded bg-surface-container-lowest border border-outline-variant/40 focus:border-primary font-body-md text-body-md text-on-surface-variant leading-relaxed outline-none"
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
                      {activeNote.sectionHeading}
                    </h2>
                    {activeNote.id === 'note-virtual-threads' &&
                    activeNote.sectionBody.includes('Carrier Thread Pinning') ? (
                      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                        Adopting lightweight concurrency does not mean unbounded
                        scalability without trade-offs. The dominant hazard in
                        production migrations is{' '}
                        <strong className="text-on-surface font-medium">
                          Carrier Thread Pinning
                        </strong>
                        , which happens when a virtual thread halts inside a
                        synchronized block or native JNI call, prohibiting the
                        runtime from parking its execution frame.
                      </p>
                    ) : (
                      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                        {activeNote.sectionBody}
                      </p>
                    )}
                  </>
                )}

                {/* Checklist */}
                {activeNote.checklist.length > 0 && (
                  <div className="p-space-md rounded bg-surface-container-low space-y-2">
                    {activeNote.checklist.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-start gap-2.5 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() =>
                            onToggleChecklistItem(activeNote.id, item.id)
                          }
                          className="mt-1 w-4 h-4 rounded bg-surface-container-high border-0 accent-primary cursor-pointer"
                        />
                        <span
                          className={`font-body-md text-body-md ${
                            item.checked
                              ? 'text-outline line-through'
                              : 'text-on-surface'
                          }`}
                        >
                          {item.id === 'chk-4' ? (
                            <>
                              Review{' '}
                              <code className="font-code-inline text-code-inline px-1 py-0.2 bg-surface-container rounded text-primary">
                                ThreadLocal
                              </code>{' '}
                              memory leakage risks in thread-per-task model
                            </>
                          ) : item.codeInline ? (
                            <>
                              {item.text}{' '}
                              <code className="font-code-inline text-code-inline px-1 py-0.2 bg-surface-container rounded text-on-surface-variant">
                                {item.codeInline}
                              </code>
                            </>
                          ) : (
                            item.text
                          )}
                        </span>
                      </label>
                    ))}

                    {showAddTask && (
                      <form
                        onSubmit={handleAddTaskSubmit}
                        className="flex items-center gap-2 pt-2"
                      >
                        <input
                          type="text"
                          value={newTaskText}
                          onChange={(e) => setNewTaskText(e.target.value)}
                          placeholder="Add new engineering task item..."
                          aria-label="New checklist task text"
                          autoFocus
                          className="flex-1 px-2.5 py-1 rounded bg-surface-container-high text-on-surface text-xs outline-none border border-primary/50"
                        />
                        <button
                          type="submit"
                          className="px-2.5 py-1 rounded bg-primary text-on-primary text-xs font-medium cursor-pointer"
                        >
                          Add Task
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Code Snippet Section */}
              {activeNote.codeBlock && (
                <div className="space-y-space-sm pt-space-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
                      {activeNote.codeBlock.title}
                    </h3>
                    <span className="font-code-inline text-xs text-outline">
                      {activeNote.codeBlock.filename}
                    </span>
                  </div>
                  <div className="rounded overflow-hidden bg-surface-container-lowest shadow-md">
                    <div className="h-8 px-space-md bg-surface-container-low flex items-center justify-between text-outline text-xs font-code-inline">
                      <span className="text-primary font-medium">
                        {activeNote.codeBlock.language}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="flex items-center gap-1 hover:text-on-surface transition-colors py-0.5 px-1.5 rounded hover:bg-surface-container-high cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {copiedCode ? 'check' : 'content_copy'}
                        </span>
                        <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-space-md overflow-x-auto font-code-block text-code-block text-[13px] leading-relaxed text-on-surface-variant">
                      {activeNote.id === 'note-virtual-threads' ? (
                        <pre>
                          <code>
                            <span className="text-outline">
                              // Creating an unstarted virtual thread builder with
                              per-task semantics
                            </span>
                            {'\n'}
                            <span className="text-tertiary">try</span> (
                            <span className="text-primary">var</span> executor ={' '}
                            <span className="text-secondary">Executors</span>
                            .newVirtualThreadPerTaskExecutor()) {'{\n'}
                            {'    '}
                            <span className="text-secondary">IntStream</span>
                            .range(<span className="text-tertiary">0</span>,{' '}
                            <span className="text-tertiary">10_000</span>
                            ).forEach(i -&gt; {'{\n'}
                            {'        '}executor.submit(() -&gt; {'{\n'}
                            {'            '}
                            <span className="text-secondary">Thread</span>
                            .sleep(
                            <span className="text-secondary">Duration</span>
                            .ofMillis(<span className="text-tertiary">100</span>
                            ));
                            {'\n'}
                            {'            '}
                            <span className="text-tertiary">return</span>{' '}
                            <span className="text-secondary-fixed-dim">
                              &quot;Task &quot;
                            </span>{' '}
                            + i +{' '}
                            <span className="text-secondary-fixed-dim">
                              &quot; completed on carrier: &quot;
                            </span>{' '}
                            + <span className="text-secondary">Thread</span>
                            .currentThread();
                            {'\n'}
                            {'        });\n'}
                            {'    });\n'}
                            {'}'}{' '}
                            <span className="text-outline">
                              // Automatically awaits completion of all child
                              tasks upon block termination
                            </span>
                          </code>
                        </pre>
                      ) : (
                        <pre>
                          <code>{activeNote.codeBlock.code}</code>
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Technical Comparison Matrix */}
              {activeNote.comparisonTable && (
                <div className="space-y-space-sm pt-space-xs">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
                    {activeNote.comparisonTable.title}
                  </h3>
                  <div className="rounded overflow-hidden bg-surface-container-lowest">
                    <table className="w-full text-left font-body-sm text-body-sm border-collapse">
                      <thead>
                        <tr className="bg-surface-container-low text-outline font-label-md text-label-md">
                          <th className="py-2.5 px-space-md">
                            {activeNote.comparisonTable.headers[0]}
                          </th>
                          <th className="py-2.5 px-space-md">
                            {activeNote.comparisonTable.headers[1]}
                          </th>
                          <th className="py-2.5 px-space-md text-primary">
                            {activeNote.comparisonTable.headers[2]}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-0 text-on-surface-variant">
                        {activeNote.comparisonTable.rows.map((row, idx) => (
                          <tr
                            key={row.metric}
                            className={`${
                              idx % 2 === 1 ? 'bg-surface-container-low/20 ' : ''
                            }hover:bg-surface-container-low/50 transition-colors`}
                          >
                            <td className="py-2 px-space-md font-medium text-on-surface">
                              {row.metric}
                            </td>
                            <td className="py-2 px-space-md font-code-inline text-[12px] tabular-nums">
                              {row.baseline}
                            </td>
                            <td className="py-2 px-space-md font-code-inline text-[12px] text-secondary tabular-nums">
                              {row.highlight}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Internal Wiki-links & Admonition Callout */}
              <div className="space-y-space-md pt-space-xs">
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {renderWikiParagraph(activeNote.wikiParagraph)}
                </p>

                {activeNote.callout && (
                  <div className="p-space-md rounded bg-surface-container-low flex items-start gap-3 shadow-sm">
                    <span className="material-symbols-outlined text-tertiary text-[20px] flex-shrink-0 mt-0.5">
                      lightbulb
                    </span>
                    <div className="space-y-1">
                      <span className="font-label-md text-label-md text-tertiary font-semibold uppercase tracking-wide">
                        {activeNote.callout.title}
                      </span>
                      {activeNote.id === 'note-virtual-threads' ? (
                        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                          When migrating legacy blocking I/O services to Virtual
                          Threads, ensure third-party JDBC drivers and
                          cryptography libraries avoid{' '}
                          <code className="font-code-inline text-code-inline px-1 py-0.2 bg-surface-container rounded text-primary">
                            synchronized
                          </code>{' '}
                          blocks on hot execution paths to prevent pinning
                          carrier workers during slow TCP waits.
                        </p>
                      ) : (
                        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                          {activeNote.callout.body}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Optional Split Pane Right for Side-by-Side Comparison */}
        {splitPaneOpen && (
          <div className="w-80 border-l border-outline-variant/30 bg-surface-container-lowest/60 p-4 overflow-y-auto hidden xl:block">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-outline-variant/20">
              <span className="font-label-sm uppercase tracking-wider text-primary text-[11px]">
                Split Reference Pane
              </span>
              <button
                type="button"
                onClick={() => setSplitPaneOpen(false)}
                aria-label="Close split pane"
                className="text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">
                  close
                </span>
              </button>
            </div>
            <pre className="font-code-block text-[11px] text-on-surface-variant whitespace-pre-wrap leading-relaxed">
              {activeNote.rawMarkdown}
            </pre>
          </div>
        )}
      </div>

      {/* Center Bottom Status Bar */}
      <div className="h-7 px-gutter-desktop bg-surface-container-lowest border-t border-outline-variant/20 flex items-center justify-between text-outline font-label-sm text-[11px] select-none tabular-nums">
        <div className="flex items-center gap-3">
          <span>
            Words:{' '}
            <strong className="text-on-surface-variant font-medium">
              {displayWords}
            </strong>
          </span>
          <span>
            Chars:{' '}
            <strong className="text-on-surface-variant font-medium">
              {displayChars}
            </strong>
          </span>
          <span>
            Read time:{' '}
            <strong className="text-on-surface-variant font-medium">
              {displayReadTime}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-3 font-code-inline text-[10px]">
          <span>UTF-8</span>
          <span>LF</span>
          <div className="flex items-center gap-1 text-secondary">
            <span className="material-symbols-outlined text-[13px]">
              cloud_done
            </span>
            <span>Saved</span>
          </div>
        </div>
      </div>
    </section>
  );
};
