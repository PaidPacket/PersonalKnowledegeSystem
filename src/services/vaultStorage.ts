import {
  CanvasEdge,
  CanvasNode,
  FolderRecord,
  NoteRecord,
} from '../domain/vaultEngine';
import {
  INITIAL_CANVAS_EDGES,
  INITIAL_CANVAS_NODES,
  INITIAL_FOLDERS,
  INITIAL_NOTES,
} from '../domain/seedVault';

const STORAGE_KEY_V1 = 'your_notes_engineering_vault_v1';
const IDB_NAME = 'YourNotesKnowledgeVaultDB';
const IDB_VERSION = 1;

export interface VaultStateSnapshot {
  schemaVersion: number;
  vaultName: string;
  notes: NoteRecord[];
  folders: FolderRecord[];
  openTabIds: string[];
  activeNoteId: string;
  canvasNodes: CanvasNode[];
  canvasEdges: CanvasEdge[];
  lastSavedAt: string;
}

const DEFAULT_SNAPSHOT: VaultStateSnapshot = {
  schemaVersion: 1,
  vaultName: 'Engineering Knowledge Vault',
  notes: INITIAL_NOTES,
  folders: INITIAL_FOLDERS,
  openTabIds: ['note-virtual-threads', 'note-thread-pools', 'note-solid'],
  activeNoteId: 'note-virtual-threads',
  canvasNodes: INITIAL_CANVAS_NODES,
  canvasEdges: INITIAL_CANVAS_EDGES,
  lastSavedAt: new Date().toISOString(),
};

/**
 * Loads the persisted vault state synchronously from localStorage cache,
 * falling back to deterministic seed state if empty or malformed.
 */
export function loadVaultSnapshotSync(): VaultStateSnapshot {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_V1);
    if (!raw) return DEFAULT_SNAPSHOT;
    const parsed = JSON.parse(raw) as Partial<VaultStateSnapshot>;
    if (
      !parsed ||
      !Array.isArray(parsed.notes) ||
      parsed.notes.length === 0 ||
      !Array.isArray(parsed.folders)
    ) {
      return DEFAULT_SNAPSHOT;
    }
    const activeNoteId =
      parsed.activeNoteId && parsed.notes.some((n) => n.id === parsed.activeNoteId)
        ? parsed.activeNoteId
        : parsed.notes[0].id;
    const openTabIds =
      Array.isArray(parsed.openTabIds) && parsed.openTabIds.length > 0
        ? parsed.openTabIds.filter((id) => parsed.notes!.some((n) => n.id === id))
        : [activeNoteId];

    return {
      schemaVersion: parsed.schemaVersion ?? 1,
      vaultName: parsed.vaultName || 'Engineering Knowledge Vault',
      notes: parsed.notes,
      folders: parsed.folders,
      openTabIds: openTabIds.length > 0 ? openTabIds : [activeNoteId],
      activeNoteId,
      canvasNodes: Array.isArray(parsed.canvasNodes)
        ? parsed.canvasNodes
        : INITIAL_CANVAS_NODES,
      canvasEdges: Array.isArray(parsed.canvasEdges)
        ? parsed.canvasEdges
        : INITIAL_CANVAS_EDGES,
      lastSavedAt: parsed.lastSavedAt || new Date().toISOString(),
    };
  } catch {
    return DEFAULT_SNAPSHOT;
  }
}

/**
 * Persists vault snapshot to both localStorage and IndexedDB transactionally.
 */
export async function saveVaultSnapshot(
  snapshot: VaultStateSnapshot
): Promise<{ ok: boolean; error?: string }> {
  try {
    const payload: VaultStateSnapshot = {
      ...snapshot,
      lastSavedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY_V1, JSON.stringify(payload));
    await writeToIndexedDB(payload);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Storage write failed';
    return { ok: false, error: message };
  }
}

function writeToIndexedDB(snapshot: VaultStateSnapshot): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      resolve();
      return;
    }
    try {
      const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('vault_snapshots')) {
          db.createObjectStore('vault_snapshots', { keyPath: 'id' });
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('vault_snapshots', 'readwrite');
        const store = tx.objectStore('vault_snapshots');
        store.put({ id: 'primary', ...snapshot });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          resolve();
        };
      };
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}
