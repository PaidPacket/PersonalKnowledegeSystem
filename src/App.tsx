/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import {
  CanvasNode,
  FolderRecord,
  NoteRecord,
  buildCanonicalMarkdownExport,
  computeBacklinks,
  computeDocumentMetrics,
  computeOutgoingLinks,
  extractOutlineHeadings,
  normalizeNoteTitle,
  parseFrontmatterAndBody,
  rebuildRawMarkdownFromNote,
  resolveWikiLink,
  rewriteLinksOnRename,
  serializeFrontmatterAndBody,
  syncStructuredFieldsFromRawMarkdown,
} from './domain/vaultEngine';
import {
  VaultStateSnapshot,
  loadVaultSnapshotSync,
  saveVaultSnapshot,
} from './services/vaultStorage';
import {
  bootstrapAndSyncUserVault,
  deleteNoteFromFirestore,
  signInWithGooglePopup,
  signOutFirebaseUser,
  subscribeToFirebaseAuth,
  subscribeToRemoteVaultNotes,
  syncNoteToFirestore,
  syncVaultWorkspaceToFirestore,
} from './services/firebaseClient';
import { TopHeaderBar, WorkspaceView } from './components/TopHeaderBar';
import { LeftNavigationRail } from './components/LeftNavigationRail';
import { FileExplorerSidebar } from './components/FileExplorerSidebar';
import { EditorCenterStage } from './components/EditorCenterStage';
import { RightInspectorSidebar } from './components/RightInspectorSidebar';
import { GraphVisualizerView } from './components/GraphVisualizerView';
import { CanvasBoardView } from './components/CanvasBoardView';
import { DailyJournalView } from './components/DailyJournalView';
import { VaultPreferencesView } from './components/VaultPreferencesView';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { HighThinkingModal } from './components/HighThinkingModal';
import { PresentationDeckModal } from './components/PresentationDeckModal';

export default function App() {
  const [vault, setVault] = useState<VaultStateSnapshot>(() =>
    loadVaultSnapshotSync()
  );
  const [activeView, setActiveView] =
    useState<WorkspaceView>('markdown-editor');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [thinkingModalOpen, setThinkingModalOpen] = useState(false);
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState('Local IndexedDB');
  const [highlightedHeading, setHighlightedHeading] = useState<string | null>(
    null
  );
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const vaultRef = useRef<VaultStateSnapshot>(vault);
  vaultRef.current = vault;

  const activeNote: NoteRecord =
    vault.notes.find((n) => n.id === vault.activeNoteId) ?? vault.notes[0];

  // Helper to queue a single note write to Firestore if authenticated
  const queueFirestoreNoteSync = (note: NoteRecord) => {
    if (!firebaseUser || !isFirebaseReady) return;
    setSyncStatusText('Syncing Firebase...');
    syncNoteToFirestore(firebaseUser.uid, note)
      .then(() => {
        setSyncStatusText('Firebase Synced');
      })
      .catch(() => {
        setSyncStatusText('Sync Error');
      });
  };

  // Subscribe to Firebase Authentication and attach Firestore real-time listener when signed in
  useEffect(() => {
    let unsubscribeRemoteNotes: (() => void) | null = null;

    const unsubscribeAuth = subscribeToFirebaseAuth(async (user) => {
      setFirebaseUser(user);
      if (unsubscribeRemoteNotes) {
        unsubscribeRemoteNotes();
        unsubscribeRemoteNotes = null;
      }

      if (!user) {
        setIsFirebaseReady(false);
        setSyncStatusText('Local IndexedDB');
        return;
      }

      setSyncStatusText('Connecting Firebase...');
      try {
        const merged = await bootstrapAndSyncUserVault(user, vaultRef.current);
        setVault((prev) => ({
          ...prev,
          notes: merged.notes,
          activeNoteId: merged.activeNoteId || prev.activeNoteId,
          openTabIds:
            merged.openTabIds && merged.openTabIds.length > 0
              ? merged.openTabIds
              : prev.openTabIds,
        }));
        setIsFirebaseReady(true);
        setSyncStatusText('Firebase Synced');

        unsubscribeRemoteNotes = subscribeToRemoteVaultNotes(
          user.uid,
          (remoteDocs) => {
            setVault((prev) => {
              const localMap = new Map<string, NoteRecord>(
                prev.notes.map((n) => [n.id, n])
              );
              const nextNotes = [...prev.notes];

              for (const remote of remoteDocs) {
                const existing = localMap.get(remote.id);
                const fm = {
                  tags: remote.tags,
                  status: remote.status,
                  priority: remote.priority,
                  created: remote.created,
                  ...(existing?.frontmatter.aliases
                    ? { aliases: existing.frontmatter.aliases }
                    : {}),
                };
                const baseNote: NoteRecord = {
                  ...(existing ?? {
                    id: remote.id,
                    folderId: remote.folderId,
                    filename: remote.filename,
                    title: remote.title,
                    lead: remote.lead,
                    frontmatter: fm,
                    sectionHeading: remote.sectionHeading,
                    sectionBody: remote.sectionBody,
                    checklist: [],
                    wikiParagraph: remote.wikiParagraph,
                    rawMarkdown: remote.rawMarkdown,
                    updatedAt: 'Firebase Synced',
                  }),
                  id: remote.id,
                  folderId: remote.folderId,
                  filename: remote.filename,
                  title: remote.title,
                  lead: remote.lead,
                  frontmatter: fm,
                  sectionHeading: remote.sectionHeading,
                  sectionBody: remote.sectionBody,
                  wikiParagraph: remote.wikiParagraph,
                  rawMarkdown: remote.rawMarkdown,
                  bookmarked: remote.bookmarked,
                };
                const hydrated = syncStructuredFieldsFromRawMarkdown(
                  baseNote,
                  remote.rawMarkdown
                );
                const idx = nextNotes.findIndex((n) => n.id === remote.id);
                if (idx !== -1) {
                  nextNotes[idx] = hydrated;
                } else {
                  nextNotes.push(hydrated);
                }
              }

              return {
                ...prev,
                notes: nextNotes,
              };
            });
            setSyncStatusText('Firebase Synced');
          }
        );
      } catch (err) {
        console.error('Firebase bootstrap error:', err);
        setSyncStatusText('Firebase Auth Error');
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeRemoteNotes) {
        unsubscribeRemoteNotes();
      }
    };
  }, []);

  // Persist changes to IndexedDB + LocalStorage and sync active workspace metadata to Firestore
  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveVaultSnapshot(vault).then((res) => {
        if (res.ok && !firebaseUser) {
          setSyncStatusText('Local IndexedDB');
        }
      });
      if (firebaseUser && isFirebaseReady) {
        syncVaultWorkspaceToFirestore(firebaseUser.uid, vault).catch(() => {});
      }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [vault, firebaseUser, isFirebaseReady]);

  // Global keyboard shortcuts (Cmd/Ctrl+K Command Palette, Cmd/Ctrl+P Presentation, Cmd/Ctrl+S Export .md)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setPresentationOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const currentNote =
          vaultRef.current.notes.find(
            (n) => n.id === vaultRef.current.activeNoteId
          ) ?? vaultRef.current.notes[0];
        if (currentNote) {
          const canonicalMd = buildCanonicalMarkdownExport(currentNote);
          const safeFilename = currentNote.filename
            .toLowerCase()
            .endsWith('.md')
            ? currentNote.filename
            : `${currentNote.title || 'Untitled Note'}.md`;
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
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSignInFirebase = async () => {
    try {
      setSyncStatusText('Signing in...');
      await signInWithGooglePopup();
    } catch (err) {
      console.error('Firebase Google Sign-In cancelled or failed:', err);
      setSyncStatusText(firebaseUser ? 'Firebase Synced' : 'Local IndexedDB');
    }
  };

  const handleSignOutFirebase = async () => {
    try {
      await signOutFirebaseUser();
      setSyncStatusText('Local IndexedDB');
    } catch (err) {
      console.error('Firebase sign-out error:', err);
    }
  };

  const handleForceCloudSync = async () => {
    if (!firebaseUser) return;
    setSyncStatusText('Syncing Firebase...');
    try {
      await syncVaultWorkspaceToFirestore(firebaseUser.uid, vault);
      for (const note of vault.notes) {
        await syncNoteToFirestore(firebaseUser.uid, note);
      }
      setSyncStatusText('Firebase Synced');
    } catch (err) {
      console.error('Manual cloud sync error:', err);
      setSyncStatusText('Sync Error');
    }
  };

  const openTabs: NoteRecord[] = vault.openTabIds
    .map((id) => vault.notes.find((n) => n.id === id))
    .filter((n): n is NoteRecord => Boolean(n));

  const outline = extractOutlineHeadings(activeNote);
  const backlinks = computeBacklinks(activeNote, vault.notes);
  const outgoingLinks = computeOutgoingLinks(activeNote, vault.notes);
  const metrics = computeDocumentMetrics(activeNote);

  const handleSelectNote = (noteId: string) => {
    setVault((prev) => {
      const nextTabs = prev.openTabIds.includes(noteId)
        ? prev.openTabIds
        : [...prev.openTabIds, noteId];
      return {
        ...prev,
        activeNoteId: noteId,
        openTabIds: nextTabs,
      };
    });
    setActiveView('markdown-editor');
  };

  const handleOpenNoteByTitle = (titleOrName: string) => {
    const resolved = resolveWikiLink(titleOrName, vault.notes);
    if (resolved) {
      handleSelectNote(resolved.id);
      return;
    }
    // Create missing linked note on-demand if it doesn't exist yet
    const cleanTitle = normalizeNoteTitle(titleOrName);
    const newId = `note-${Date.now()}`;
    const fm = {
      tags: ['java/concurrency', 'architecture/oop'],
      status: 'draft' as const,
      created: '2026-11-01',
      priority: 'medium' as const,
    };
    const body = `# ${cleanTitle}\n\nCreated from wiki-link reference in [[${normalizeNoteTitle(
      activeNote.filename
    )}]].`;
    const newNote: NoteRecord = {
      id: newId,
      folderId: activeNote.folderId,
      filename: `${cleanTitle}.md`,
      title: cleanTitle,
      lead: `Architectural specification and cross-references for ${cleanTitle}.`,
      frontmatter: fm,
      sectionHeading: 'Core Architectural Notes',
      sectionBody: `Documenting runtime invariants and design decisions for ${cleanTitle}.`,
      checklist: [
        {
          id: `chk-${Date.now()}`,
          text: `Complete cross-reference verification for ${cleanTitle}`,
          checked: false,
        },
      ],
      wikiParagraph: `Referenced from [[${normalizeNoteTitle(
        activeNote.filename
      )}]].`,
      rawMarkdown: serializeFrontmatterAndBody(fm, body),
      updatedAt: 'Just now',
    };

    const syncedNewNote: NoteRecord = {
      ...newNote,
      rawMarkdown: rebuildRawMarkdownFromNote(newNote),
    };

    setVault((prev) => ({
      ...prev,
      notes: [...prev.notes, syncedNewNote],
      openTabIds: [...prev.openTabIds, newId],
      activeNoteId: newId,
    }));
    queueFirestoreNoteSync(syncedNewNote);
    setActiveView('markdown-editor');
  };

  const handleCloseTab = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVault((prev) => {
      if (prev.openTabIds.length <= 1) return prev;
      const nextTabs = prev.openTabIds.filter((id) => id !== noteId);
      const nextActive =
        prev.activeNoteId === noteId ? nextTabs[0] : prev.activeNoteId;
      return {
        ...prev,
        openTabIds: nextTabs,
        activeNoteId: nextActive,
      };
    });
  };

  const handleToggleFolder = (folderId: string) => {
    setVault((prev) => ({
      ...prev,
      folders: prev.folders.map((f) =>
        f.id === folderId ? { ...f, expanded: !f.expanded } : f
      ),
    }));
  };

  const handleCollapseAllFolders = () => {
    setVault((prev) => ({
      ...prev,
      folders: prev.folders.map((f) => ({ ...f, expanded: false })),
    }));
  };

  const handleCreateNote = (folderId = 'folder-02-concurrency') => {
    const index = vault.notes.length + 1;
    const title = `Structured Concurrency Spec ${index}`;
    const filename = `${title}.md`;
    const newId = `note-${Date.now()}`;
    const fm = {
      tags: ['java/concurrency', 'project-loom'],
      status: 'in-progress' as const,
      created: '2026-11-01',
      priority: 'high' as const,
    };
    const body = `# ${title}\n\nLinked with [[Virtual Threads & Loom]] and [[Thread Pools & Executors]].`;

    const draftNote: NoteRecord = {
      id: newId,
      folderId,
      filename,
      title,
      lead: 'Scoped task hierarchy ensuring child virtual threads complete or cancel atomically within lexical scope.',
      frontmatter: fm,
      sectionHeading: 'StructuredTaskScope Invariants',
      sectionBody:
        'ShutdownOnFailure cancels sibling subtasks immediately when any fork throws an exception, eliminating thread leaks.',
      checklist: [
        {
          id: `chk-${Date.now()}-1`,
          text: 'Adopt StructuredTaskScope.ShutdownOnFailure for parallel fan-out RPCs',
          checked: false,
        },
      ],
      wikiParagraph:
        'Builds directly on [[Virtual Threads & Loom]] and replaces manual Future orchestration in [[Thread Pools & Executors]].',
      rawMarkdown: serializeFrontmatterAndBody(fm, body),
      updatedAt: 'Just now',
    };

    const newNote: NoteRecord = {
      ...draftNote,
      rawMarkdown: rebuildRawMarkdownFromNote(draftNote),
    };

    setVault((prev) => ({
      ...prev,
      folders: prev.folders.map((f) =>
        f.id === folderId || f.id === 'folder-02'
          ? { ...f, expanded: true }
          : f
      ),
      notes: [...prev.notes, newNote],
      openTabIds: [...prev.openTabIds, newId],
      activeNoteId: newId,
    }));
    queueFirestoreNoteSync(newNote);
    setActiveView('markdown-editor');
  };

  const handleCreateFolder = () => {
    const count = vault.folders.filter((f) => f.parentId === null).length + 1;
    const padded = String(count).padStart(2, '0');
    const newFolder: FolderRecord = {
      id: `folder-${Date.now()}`,
      parentId: null,
      name: `${padded} - Runtime Benchmarks`,
      expanded: true,
      order: count,
    };
    setVault((prev) => ({
      ...prev,
      folders: [...prev.folders, newFolder],
    }));
  };

  const handleToggleChecklistItem = (noteId: string, checklistId: string) => {
    let updatedTarget: NoteRecord | null = null;
    setVault((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => {
        if (n.id !== noteId) return n;
        const nextNote: NoteRecord = {
          ...n,
          updatedAt: 'Just now',
          checklist: n.checklist.map((item) =>
            item.id === checklistId
              ? { ...item, checked: !item.checked }
              : item
          ),
        };
        updatedTarget = {
          ...nextNote,
          rawMarkdown: rebuildRawMarkdownFromNote(nextNote),
        };
        return updatedTarget;
      }),
    }));
    if (updatedTarget) {
      queueFirestoreNoteSync(updatedTarget);
    }
  };

  const handleAddChecklistItem = (noteId: string, text: string) => {
    let updatedTarget: NoteRecord | null = null;
    setVault((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => {
        if (n.id !== noteId) return n;
        const nextNote: NoteRecord = {
          ...n,
          updatedAt: 'Just now',
          checklist: [
            ...n.checklist,
            {
              id: `chk-${Date.now()}`,
              text,
              checked: false,
            },
          ],
        };
        updatedTarget = {
          ...nextNote,
          rawMarkdown: rebuildRawMarkdownFromNote(nextNote),
        };
        return updatedTarget;
      }),
    }));
    if (updatedTarget) {
      queueFirestoreNoteSync(updatedTarget);
    }
  };

  const handleUpdateNote = (
    noteId: string,
    updater: (prev: NoteRecord) => NoteRecord
  ) => {
    let updatedTarget: NoteRecord | null = null;
    setVault((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => {
        if (n.id !== noteId) return n;
        updatedTarget = updater(n);
        return updatedTarget;
      }),
    }));
    if (updatedTarget) {
      queueFirestoreNoteSync(updatedTarget);
    }
  };

  const handleRenameNote = (noteId: string, newTitleOrFilename: string) => {
    const cleanBase = normalizeNoteTitle(newTitleOrFilename);
    if (!cleanBase) return;
    const newFilename = `${cleanBase}.md`;

    const changedNotes: NoteRecord[] = [];
    setVault((prev) => {
      const target = prev.notes.find((n) => n.id === noteId);
      if (!target) return prev;
      const oldBase = normalizeNoteTitle(target.filename);

      const updatedNotes = prev.notes.map((n) => {
        if (n.id === noteId) {
          const renamed: NoteRecord = {
            ...n,
            filename: newFilename,
            title: cleanBase,
            updatedAt: 'Just now',
          };
          const synced: NoteRecord = {
            ...renamed,
            rawMarkdown: rebuildRawMarkdownFromNote(renamed),
          };
          changedNotes.push(synced);
          return synced;
        }
        const nextWiki = rewriteLinksOnRename(
          n.wikiParagraph,
          oldBase,
          cleanBase
        );
        const nextRaw = rewriteLinksOnRename(n.rawMarkdown, oldBase, cleanBase);
        if (nextWiki !== n.wikiParagraph || nextRaw !== n.rawMarkdown) {
          const updatedRef: NoteRecord = {
            ...n,
            wikiParagraph: nextWiki,
            rawMarkdown: nextRaw,
          };
          changedNotes.push(updatedRef);
          return updatedRef;
        }
        return n;
      });

      return {
        ...prev,
        notes: updatedNotes,
      };
    });

    for (const cn of changedNotes) {
      queueFirestoreNoteSync(cn);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    if (vault.notes.length <= 1) return;
    setVault((prev) => {
      if (prev.notes.length <= 1) return prev;
      const nextNotes = prev.notes.filter((n) => n.id !== noteId);
      const nextTabs = prev.openTabIds.filter((id) => id !== noteId);
      const safeTabs = nextTabs.length > 0 ? nextTabs : [nextNotes[0].id];
      const nextActive =
        prev.activeNoteId === noteId ? safeTabs[0] : prev.activeNoteId;
      return {
        ...prev,
        notes: nextNotes,
        openTabIds: safeTabs,
        activeNoteId: nextActive,
      };
    });
    if (firebaseUser && isFirebaseReady) {
      deleteNoteFromFirestore(firebaseUser.uid, noteId).catch(() => {});
    }
  };

  const handleAddCanvasNode = (newNode: CanvasNode, connectFromId?: string) => {
    setVault((prev) => ({
      ...prev,
      canvasNodes: [...prev.canvasNodes, newNode],
      canvasEdges: connectFromId
        ? [
            ...prev.canvasEdges,
            {
              id: `edge-${Date.now()}`,
              fromId: connectFromId,
              toId: newNode.id,
              label: 'references',
            },
          ]
        : prev.canvasEdges,
    }));
  };

  const handleMoveCanvasNode = (nodeId: string, dx: number, dy: number) => {
    setVault((prev) => ({
      ...prev,
      canvasNodes: prev.canvasNodes.map((n) =>
        n.id === nodeId ? { ...n, x: n.x + dx, y: n.y + dy } : n
      ),
    }));
  };

  const handleAddDailyEntry = (entryText: string) => {
    let updatedDaily: NoteRecord | null = null;
    setVault((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => {
        if (!n.isDailyNote) return n;
        const nextDaily: NoteRecord = {
          ...n,
          updatedAt: 'Just now',
          checklist: [
            ...n.checklist,
            {
              id: `dj-${Date.now()}`,
              text: entryText,
              checked: false,
            },
          ],
        };
        updatedDaily = {
          ...nextDaily,
          rawMarkdown: rebuildRawMarkdownFromNote(nextDaily),
        };
        return updatedDaily;
      }),
    }));
    if (updatedDaily) {
      queueFirestoreNoteSync(updatedDaily);
    }
  };

  const handleImportMarkdownNote = (filename: string, rawMarkdown: string) => {
    const { frontmatter, body } = parseFrontmatterAndBody(rawMarkdown);
    const cleanTitle = normalizeNoteTitle(filename);
    const newId = `note-${Date.now()}`;
    const baseNote: NoteRecord = {
      id: newId,
      folderId: 'folder-02-concurrency',
      filename,
      title: cleanTitle,
      lead:
        body.split(/\r?\n/).find((l) => l && !l.startsWith('#')) || cleanTitle,
      frontmatter,
      sectionHeading: 'Imported Specification',
      sectionBody: body,
      checklist: [],
      wikiParagraph: body,
      rawMarkdown: serializeFrontmatterAndBody(frontmatter, body),
      updatedAt: 'Just now',
    };
    const newNote = syncStructuredFieldsFromRawMarkdown(
      baseNote,
      baseNote.rawMarkdown
    );
    setVault((prev) => ({
      ...prev,
      notes: [...prev.notes, newNote],
      openTabIds: [...prev.openTabIds, newId],
      activeNoteId: newId,
    }));
    queueFirestoreNoteSync(newNote);
  };

  const handleExportVaultJson = () => {
    const blob = new Blob([JSON.stringify(vault, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'engineering-knowledge-vault-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleJumpToHeading = (headingText: string) => {
    setHighlightedHeading(headingText);
    window.setTimeout(() => setHighlightedHeading(null), 1600);
  };

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md antialiased min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Fixed Header */}
      <TopHeaderBar
        vaultName={vault.vaultName}
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenThinkingModal={() => setThinkingModalOpen(true)}
        onOpenPresentationDeck={() => setPresentationOpen(true)}
        syncStatusText={syncStatusText}
        noteCount={vault.notes.length}
        firebaseUser={
          firebaseUser
            ? {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName,
                email: firebaseUser.email,
                photoURL: firebaseUser.photoURL,
              }
            : null
        }
        onSignInFirebase={handleSignInFirebase}
        onSignOutFirebase={handleSignOutFirebase}
      />

      {/* Outer Fixed Left Navigation Rail */}
      <LeftNavigationRail
        activeView={activeView}
        onSelectView={setActiveView}
        onCreateFolder={handleCreateFolder}
        onOpenPresentationDeck={() => setPresentationOpen(true)}
      />

      {/* Main Content Container Offset by Left Navigation Rail */}
      <div className="pl-64">
        <main className="w-full min-h-[calc(100vh-3.5rem)] pt-14 bg-surface text-on-surface">
          <div className="flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-hidden select-none text-on-surface">
            {activeView === 'markdown-editor' && (
              /* 3-PANE WORKSPACE WRAPPER */
              <div className="flex flex-1 h-full w-full overflow-hidden">
                {/* 1. LEFT SIDEBAR: FILE EXPLORER & TREE */}
                <FileExplorerSidebar
                  folders={vault.folders}
                  notes={vault.notes}
                  activeNoteId={activeNote.id}
                  selectedTag={selectedTag}
                  onSelectNote={handleSelectNote}
                  onToggleFolder={handleToggleFolder}
                  onCollapseAllFolders={handleCollapseAllFolders}
                  onCreateNote={handleCreateNote}
                  onCreateFolder={handleCreateFolder}
                  onSelectTag={setSelectedTag}
                  onOpenSettings={() => setActiveView('vault-settings')}
                  onOpenCommandPalette={() => setCommandPaletteOpen(true)}
                />

                {/* 2. CENTER STAGE: EDITOR & WORKSPACE */}
                <EditorCenterStage
                  activeNote={activeNote}
                  openTabs={openTabs}
                  folders={vault.folders}
                  onSelectTab={handleSelectNote}
                  onCloseTab={handleCloseTab}
                  onToggleChecklistItem={handleToggleChecklistItem}
                  onAddChecklistItem={handleAddChecklistItem}
                  onUpdateNote={handleUpdateNote}
                  onRenameNote={handleRenameNote}
                  onDeleteNote={handleDeleteNote}
                  onOpenNoteByTitle={handleOpenNoteByTitle}
                  onSelectFolderFilter={(folderId) => {
                    if (folderId) {
                      setVault((prev) => ({
                        ...prev,
                        folders: prev.folders.map((f) =>
                          f.id === folderId ? { ...f, expanded: true } : f
                        ),
                      }));
                    }
                  }}
                  onOpenThinkingModal={() => setThinkingModalOpen(true)}
                  highlightedHeading={highlightedHeading}
                />

                {/* 3. RIGHT SIDEBAR: INSPECTOR & BACKLINKS */}
                <RightInspectorSidebar
                  activeNote={activeNote}
                  allNotes={vault.notes}
                  outline={outline}
                  backlinks={backlinks}
                  outgoingLinks={outgoingLinks}
                  sizeKb={metrics.sizeKb}
                  onSelectNoteById={handleSelectNote}
                  onOpenNoteByTitle={handleOpenNoteByTitle}
                  onJumpToHeading={handleJumpToHeading}
                  onOpenGraphView={() => setActiveView('graph-view')}
                />
              </div>
            )}

            {activeView === 'graph-view' && (
              <GraphVisualizerView
                notes={vault.notes}
                activeNoteId={activeNote.id}
                onOpenNoteInEditor={handleSelectNote}
              />
            )}

            {activeView === 'canvas-view' && (
              <CanvasBoardView
                nodes={vault.canvasNodes}
                edges={vault.canvasEdges}
                notes={vault.notes}
                onAddCanvasNode={handleAddCanvasNode}
                onMoveCanvasNode={handleMoveCanvasNode}
                onOpenNoteInEditor={handleSelectNote}
              />
            )}

            {activeView === 'daily-notes' && (
              <DailyJournalView
                notes={vault.notes}
                onOpenNoteInEditor={handleSelectNote}
                onAddDailyEntry={handleAddDailyEntry}
              />
            )}

            {activeView === 'vault-settings' && (
              <VaultPreferencesView
                vaultName={vault.vaultName}
                notes={vault.notes}
                onImportMarkdownNote={handleImportMarkdownNote}
                onExportVaultJson={handleExportVaultJson}
                onOpenThinkingModal={() => setThinkingModalOpen(true)}
                firebaseUser={
                  firebaseUser
                    ? {
                        uid: firebaseUser.uid,
                        displayName: firebaseUser.displayName,
                        email: firebaseUser.email,
                      }
                    : null
                }
                onSignInFirebase={handleSignInFirebase}
                onSignOutFirebase={handleSignOutFirebase}
                onForceCloudSync={handleForceCloudSync}
              />
            )}
          </div>
        </main>
      </div>

      {/* Command Palette Modal (Cmd/Ctrl + K) */}
      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        notes={vault.notes}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectNote={handleSelectNote}
        onCreateNote={() => handleCreateNote('folder-02-concurrency')}
        onSelectView={setActiveView}
        onOpenThinkingModal={() => setThinkingModalOpen(true)}
        onOpenPresentationDeck={() => setPresentationOpen(true)}
      />

      {/* High-Thinking Synthesis Modal (gemini-4-argon + ThinkingLevel.HIGH) */}
      <HighThinkingModal
        isOpen={thinkingModalOpen}
        activeNote={activeNote}
        outgoingTitles={outgoingLinks.map((l) => l.title)}
        onClose={() => setThinkingModalOpen(false)}
      />

      {/* 11-Slide College Software Engineering Presentation Deck */}
      <PresentationDeckModal
        isOpen={presentationOpen}
        onClose={() => setPresentationOpen(false)}
      />
    </div>
  );
}

