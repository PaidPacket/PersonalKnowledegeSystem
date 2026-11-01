import React, { useState } from 'react';
import { FolderRecord, NoteRecord } from '../domain/vaultEngine';

interface FileExplorerSidebarProps {
  folders: FolderRecord[];
  notes: NoteRecord[];
  activeNoteId: string;
  selectedTag: string | null;
  onSelectNote: (noteId: string) => void;
  onToggleFolder: (folderId: string) => void;
  onCollapseAllFolders: () => void;
  onCreateNote: (folderId?: string) => void;
  onCreateFolder: () => void;
  onSelectTag: (tag: string | null) => void;
  onOpenSettings: () => void;
  onOpenCommandPalette: () => void;
}

const PINNED_TAGS = [
  { tag: '#java/concurrency', matchKey: 'concurrency', count: 14 },
  { tag: '#architecture/oop', matchKey: 'oop', count: 28 },
  { tag: '#system-design', matchKey: 'system-design', count: 9 },
];

export const FileExplorerSidebar: React.FC<FileExplorerSidebarProps> = ({
  folders,
  notes,
  activeNoteId,
  selectedTag,
  onSelectNote,
  onToggleFolder,
  onCollapseAllFolders,
  onCreateNote,
  onCreateFolder,
  onSelectTag,
  onOpenSettings,
  onOpenCommandPalette,
}) => {
  const [filterText, setFilterText] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  const normalizedFilter = filterText.trim().toLowerCase();

  const matchesFilter = (note: NoteRecord) => {
    if (selectedTag) {
      const cleanTag = selectedTag.replace(/^#/, '').toLowerCase();
      const tagMatch = note.frontmatter.tags.some(
        (t) =>
          t.toLowerCase().includes(cleanTag) || cleanTag.includes(t.toLowerCase())
      );
      if (!tagMatch) return false;
    }
    if (!normalizedFilter) return true;
    return (
      note.filename.toLowerCase().includes(normalizedFilter) ||
      note.title.toLowerCase().includes(normalizedFilter) ||
      note.frontmatter.tags.some((t) => t.toLowerCase().includes(normalizedFilter))
    );
  };

  const topFolders = folders
    .filter((f) => f.parentId === null)
    .sort((a, b) => (sortAsc ? a.order - b.order : b.order - a.order));

  const getChildFolders = (parentId: string) =>
    folders
      .filter((f) => f.parentId === parentId)
      .sort((a, b) => (sortAsc ? a.order - b.order : b.order - a.order));

  const getFolderNotes = (folderId: string) => {
    const list = notes.filter((n) => n.folderId === folderId && matchesFilter(n));
    if (!sortAsc) {
      return [...list].reverse();
    }
    return list;
  };

  const bookmarkedNotes = notes.filter((n) => n.bookmarked);

  return (
    <aside className="w-64 flex-shrink-0 bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col justify-between overflow-hidden select-none">
      {/* Top Section */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Vault Switcher Header */}
        <div className="h-10 px-space-md flex items-center justify-between bg-surface-container-low/40">
          <div className="flex items-center gap-space-xs cursor-pointer hover:text-on-surface text-on-surface-variant transition-colors min-w-0">
            <span className="material-symbols-outlined text-[16px] text-primary flex-shrink-0">
              inventory_2
            </span>
            <span className="font-label-md text-label-md font-medium truncate">
              Engineering Vault
            </span>
            <span className="material-symbols-outlined text-[14px] text-outline">
              unfold_more
            </span>
          </div>
          <div className="flex items-center gap-0.5 text-outline">
            <button
              type="button"
              onClick={() => onCreateNote('folder-02-concurrency')}
              className="p-1 rounded hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
              title="New Note (Cmd+N)"
              aria-label="New Note"
            >
              <span className="material-symbols-outlined text-[15px]">note_add</span>
            </button>
            <button
              type="button"
              onClick={onCreateFolder}
              className="p-1 rounded hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
              title="New Folder"
              aria-label="New Folder"
            >
              <span className="material-symbols-outlined text-[15px]">
                create_new_folder
              </span>
            </button>
            <button
              type="button"
              onClick={onCollapseAllFolders}
              className="p-1 rounded hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
              title="Collapse All"
              aria-label="Collapse All"
            >
              <span className="material-symbols-outlined text-[15px]">
                unfold_less
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSortAsc((prev) => !prev)}
              className="p-1 rounded hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
              title="Sort Order"
              aria-label="Sort Order"
            >
              <span className="material-symbols-outlined text-[15px]">sort</span>
            </button>
          </div>
        </div>

        {/* Filter / Quick Find Bar */}
        <div className="px-space-sm py-1.5 bg-surface-container-lowest">
          <div className="flex items-center gap-1.5 px-space-sm py-1 rounded bg-surface-container-low text-on-surface-variant focus-within:bg-surface-container focus-within:text-on-surface transition-all">
            <span className="material-symbols-outlined text-[14px] text-outline">
              filter_list
            </span>
            <input
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              aria-label="Filter files"
              className="bg-transparent text-body-sm font-body-sm w-full outline-none placeholder:text-outline/70"
              placeholder="Filter files..."
              type="text"
            />
            {filterText || selectedTag ? (
              <button
                type="button"
                onClick={() => {
                  setFilterText('');
                  onSelectTag(null);
                }}
                aria-label="Clear file filter"
                className="text-[10px] font-code-inline px-1 py-0.5 rounded bg-surface-container-high text-primary hover:text-on-surface cursor-pointer"
              >
                Clear
              </button>
            ) : (
              <kbd className="font-code-inline text-[10px] px-1 py-0.2 bg-surface-container-high rounded text-outline">
                ⌘F
              </kbd>
            )}
          </div>
        </div>

        {/* Scrollable Navigation Trees */}
        <div className="flex-1 overflow-y-auto px-1.5 py-1 space-y-3">
          {/* Section: Pinned Bookmarks */}
          <div>
            <div className="flex items-center justify-between px-space-xs py-0.5 text-outline uppercase font-label-sm text-[10px] tracking-wider">
              <span>Bookmarks</span>
              <span className="material-symbols-outlined text-[13px] cursor-pointer hover:text-on-surface">
                more_horiz
              </span>
            </div>
            <div className="space-y-0.5 mt-0.5">
              <button
                type="button"
                onClick={() => onSelectNote('note-virtual-threads')}
                className="w-full flex items-center gap-1.5 px-space-xs py-1 rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors group text-left cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px] text-tertiary">
                  star
                </span>
                <span className="font-label-md text-label-md truncate">
                  Memory Model &amp; Virtual Threads
                </span>
              </button>
              <button
                type="button"
                onClick={() => onSelectNote('note-distributed-cache')}
                className="w-full flex items-center gap-1.5 px-space-xs py-1 rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors group text-left cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px] text-tertiary">
                  star
                </span>
                <span className="font-label-md text-label-md truncate">
                  Distributed Cache Arch
                </span>
              </button>
              {bookmarkedNotes
                .filter(
                  (b) =>
                    b.id !== 'note-virtual-threads' &&
                    b.id !== 'note-distributed-cache'
                )
                .map((bm) => (
                  <button
                    key={bm.id}
                    type="button"
                    onClick={() => onSelectNote(bm.id)}
                    className="w-full flex items-center gap-1.5 px-space-xs py-1 rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors group text-left cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[13px] text-tertiary">
                      star
                    </span>
                    <span className="font-label-md text-label-md truncate">
                      {bm.filename.replace(/\.md$/i, '')}
                    </span>
                  </button>
                ))}
            </div>
          </div>

          {/* Section: Tags Navigation */}
          <div>
            <div className="flex items-center justify-between px-space-xs py-0.5 text-outline uppercase font-label-sm text-[10px] tracking-wider">
              <span>Tags</span>
              <span className="material-symbols-outlined text-[13px]">tag</span>
            </div>
            <div className="space-y-0.5 mt-0.5">
              {PINNED_TAGS.map((item) => {
                const isSelected = selectedTag === item.matchKey;
                return (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() =>
                      onSelectTag(isSelected ? null : item.matchKey)
                    }
                    className={`w-full flex items-center justify-between px-space-xs py-0.5 rounded transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-surface-container-high text-on-surface'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    <span className="font-code-inline text-[11px] text-primary truncate">
                      {item.tag}
                    </span>
                    <span className="font-code-inline text-[10px] text-outline px-1 rounded bg-surface-container tabular-nums">
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: File Explorer */}
          <div>
            <div className="flex items-center justify-between px-space-xs py-0.5 text-outline uppercase font-label-sm text-[10px] tracking-wider">
              <span>Files</span>
              <span className="material-symbols-outlined text-[13px]">
                folder_open
              </span>
            </div>

            <div className="mt-1 space-y-0.5 font-label-md text-label-md">
              {topFolders.map((folder) => {
                const childFolders = getChildFolders(folder.id);
                const directNotes = getFolderNotes(folder.id);
                const isExpanded =
                  folder.expanded || Boolean(normalizedFilter) || Boolean(selectedTag);

                return (
                  <div key={folder.id}>
                    <button
                      type="button"
                      onClick={() => onToggleFolder(folder.id)}
                      className={`w-full flex items-center gap-1.5 px-space-xs py-1 rounded hover:bg-surface-container cursor-pointer transition-colors text-left ${
                        isExpanded
                          ? 'text-on-surface font-medium'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px] text-outline">
                        {isExpanded ? 'expand_more' : 'chevron_right'}
                      </span>
                      <span
                        className={`material-symbols-outlined text-[15px] ${
                          isExpanded ? 'text-primary' : 'text-outline'
                        }`}
                      >
                        {isExpanded ? 'folder_open' : 'folder'}
                      </span>
                      <span className="truncate">{folder.name}</span>
                    </button>

                    {isExpanded && (
                      <div className="pl-3.5 ml-2 mt-0.5 space-y-0.5 bg-surface-container-high/10 rounded">
                        {/* Direct notes inside top-level folder */}
                        {directNotes.map((note) => {
                          const isSelected = note.id === activeNoteId;
                          return (
                            <button
                              key={note.id}
                              type="button"
                              onClick={() => onSelectNote(note.id)}
                              className={`w-full flex items-center justify-between px-1.5 py-1 rounded transition-colors text-left cursor-pointer relative ${
                                isSelected
                                  ? 'bg-surface-container-high text-primary font-medium shadow-sm'
                                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-primary rounded-full" />
                              )}
                              <div
                                className={`flex items-center gap-1.5 min-w-0 ${
                                  isSelected ? 'pl-1.5' : ''
                                }`}
                              >
                                <span
                                  className={`material-symbols-outlined text-[14px] flex-shrink-0 ${
                                    isSelected ? 'text-primary' : 'text-outline'
                                  }`}
                                >
                                  description
                                </span>
                                <span
                                  className={`truncate text-[12px] ${
                                    isSelected
                                      ? 'text-on-surface font-medium'
                                      : ''
                                  }`}
                                >
                                  {note.filename}
                                </span>
                              </div>
                              {isSelected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0 ml-1" />
                              )}
                            </button>
                          );
                        })}

                        {/* Level 2 Nested Subfolders */}
                        {childFolders.map((subFolder) => {
                          const subExpanded =
                            subFolder.expanded ||
                            Boolean(normalizedFilter) ||
                            Boolean(selectedTag);
                          const subNotes = getFolderNotes(subFolder.id);

                          return (
                            <div key={subFolder.id}>
                              <button
                                type="button"
                                onClick={() => onToggleFolder(subFolder.id)}
                                className={`w-full flex items-center gap-1 px-1 py-1 rounded hover:bg-surface-container cursor-pointer transition-colors text-left ${
                                  subExpanded
                                    ? 'text-on-surface font-medium'
                                    : 'text-on-surface-variant mt-1'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[13px] text-outline">
                                  {subExpanded ? 'expand_more' : 'chevron_right'}
                                </span>
                                <span
                                  className={`material-symbols-outlined text-[14px] ${
                                    subExpanded ? 'text-primary' : 'text-outline'
                                  }`}
                                >
                                  {subExpanded ? 'folder_open' : 'folder'}
                                </span>
                                <span className="truncate">{subFolder.name}</span>
                              </button>

                              {subExpanded && (
                                <div className="pl-3 ml-2 space-y-0.5">
                                  {subNotes.map((note) => {
                                    const isSelected = note.id === activeNoteId;
                                    return (
                                      <button
                                        key={note.id}
                                        type="button"
                                        onClick={() => onSelectNote(note.id)}
                                        className={`w-full flex items-center justify-between px-1.5 py-1 rounded transition-colors text-left cursor-pointer relative ${
                                          isSelected
                                            ? 'bg-surface-container-high text-primary font-medium shadow-sm'
                                            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                                        }`}
                                      >
                                        {isSelected && (
                                          <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-primary rounded-full" />
                                        )}
                                        <div
                                          className={`flex items-center gap-1.5 min-w-0 ${
                                            isSelected ? 'pl-1.5' : ''
                                          }`}
                                        >
                                          <span
                                            className={`material-symbols-outlined text-[14px] flex-shrink-0 ${
                                              isSelected
                                                ? 'text-primary'
                                                : 'text-outline'
                                            }`}
                                          >
                                            description
                                          </span>
                                          <span
                                            className={`truncate text-[12px] ${
                                              isSelected
                                                ? 'text-on-surface font-medium'
                                                : ''
                                            }`}
                                          >
                                            {note.filename}
                                          </span>
                                        </div>
                                        {isSelected && (
                                          <span className="w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0 ml-1" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Left Sidebar Bottom Status Bar */}
      <div className="h-10 px-space-sm bg-surface-container-low flex items-center justify-between text-outline">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1 rounded hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
            title="Vault Preferences"
            aria-label="Vault Preferences"
          >
            <span className="material-symbols-outlined text-[16px]">settings</span>
          </button>
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="p-1 rounded hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
            title="Help & Hotkeys"
            aria-label="Help & Hotkeys"
          >
            <span className="material-symbols-outlined text-[16px]">
              help_outline
            </span>
          </button>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-code-inline text-outline/80 tabular-nums">
          <span>412 notes</span>
          <span>•</span>
          <span>18.4 MB</span>
        </div>
      </div>
    </aside>
  );
};
