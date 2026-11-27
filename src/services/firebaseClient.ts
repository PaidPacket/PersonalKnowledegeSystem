import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  Unsubscribe,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  NoteFrontmatter,
  NoteRecord,
  syncStructuredFieldsFromRawMarkdown,
} from '../domain/vaultEngine';
import { VaultStateSnapshot } from './vaultStorage';

// Initialize Firebase App, Auth, and Firestore with provisioned database ID
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Startup Firestore connectivity check as required by connection validation guidelines.
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
      return false;
    }
    // Permission denied on /test/connection means the client is online and reaching Firestore rules
    return true;
  }
}

// Run startup connection check
testConnection().catch(() => {});

/**
 * Defensive payload sanitization helpers matching `firebase-blueprint.json` and `firestore.rules`.
 * Constants match the exact blueprint schema boundaries:
 * - ID pattern: ^[a-zA-Z0-9_\-]+$ (maxLength 128)
 * - vaultName: maxLength 120
 * - openTabIds: max 25 items
 * - filename: maxLength 200
 * - title: maxLength 300
 * - lead: maxLength 2000
 * - sectionHeading: maxLength 300
 * - sectionBody: maxLength 5000
 * - wikiParagraph: maxLength 3000
 * - rawMarkdown: maxLength 100000
 * - created: maxLength 40
 * - tags: max 20 items, each maxLength 60
 */
const ID_REGEX = /^[a-zA-Z0-9_\-]+$/;

export function sanitizeId(raw: string, fallback = 'item-default'): string {
  const cleaned = (raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_\-]/g, '-')
    .slice(0, 128);
  return cleaned && ID_REGEX.test(cleaned) ? cleaned : fallback;
}

function clampString(val: string | undefined, maxLen: number, minLen = 0, fallback = ''): string {
  const str = (val ?? '').slice(0, maxLen);
  if (str.length < minLen) {
    return fallback.slice(0, maxLen);
  }
  return str;
}

function sanitizeStatus(status: string): NoteFrontmatter['status'] {
  if (
    status === 'in-progress' ||
    status === 'verified' ||
    status === 'draft' ||
    status === 'archived'
  ) {
    return status;
  }
  return 'in-progress';
}

function sanitizePriority(priority: string): NoteFrontmatter['priority'] {
  if (priority === 'high' || priority === 'medium' || priority === 'low') {
    return priority;
  }
  return 'medium';
}

export async function signInWithGooglePopup(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutFirebaseUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeToFirebaseAuth(
  callback: (user: User | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

/**
 * Builds a blueprint-validated note payload for Firestore `/vaults/{userId}/notes/{noteId}`.
 */
function buildFirestoreNotePayload(
  userId: string,
  note: NoteRecord,
  includeCreatedAt: boolean
) {
  const cleanId = sanitizeId(note.id, 'note-default');
  const cleanFolderId = sanitizeId(note.folderId, 'folder-02-concurrency');
  const cleanTags = (note.frontmatter.tags || [])
    .map((t) => clampString(t.trim(), 60))
    .filter((t) => t.length >= 1)
    .slice(0, 20);

  const base = {
    id: cleanId,
    ownerId: userId,
    folderId: cleanFolderId,
    filename: clampString(note.filename, 200, 1, 'Untitled Note.md'),
    title: clampString(note.title, 300, 1, 'Untitled Note'),
    lead: clampString(note.lead, 2000),
    sectionHeading: clampString(note.sectionHeading, 300),
    sectionBody: clampString(note.sectionBody, 5000),
    wikiParagraph: clampString(note.wikiParagraph, 3000),
    rawMarkdown: clampString(
      note.rawMarkdown,
      100000,
      1,
      `# ${note.title || 'Untitled Note'}`
    ),
    status: sanitizeStatus(note.frontmatter.status),
    priority: sanitizePriority(note.frontmatter.priority),
    created: clampString(note.frontmatter.created, 40, 1, '2026-03-22'),
    tags: cleanTags.length > 0 ? cleanTags : ['engineering'],
    bookmarked: Boolean(note.bookmarked),
    updatedAt: serverTimestamp(),
  };

  if (includeCreatedAt) {
    return {
      ...base,
      createdAt: serverTimestamp(),
    };
  }
  return base;
}

/**
 * Ensures the user's `/vaults/{userId}` document and `/vaults/{userId}/notes` subcollection
 * are initialized in Firestore, seeding from the local vault snapshot if the user has no cloud vault yet.
 */
export async function bootstrapAndSyncUserVault(
  user: User,
  localSnapshot: VaultStateSnapshot
): Promise<{ notes: NoteRecord[]; activeNoteId?: string; openTabIds?: string[] }> {
  const userId = user.uid;
  const vaultPath = `vaults/${userId}`;
  const vaultRef = doc(db, 'vaults', userId);

  let vaultDocSnap;
  try {
    vaultDocSnap = await getDoc(vaultRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, vaultPath);
  }

  const cleanActiveNoteId = sanitizeId(
    localSnapshot.activeNoteId,
    'note-virtual-threads'
  );
  const cleanOpenTabs = (localSnapshot.openTabIds || [])
    .map((id) => sanitizeId(id))
    .filter((id) => id.length >= 1)
    .slice(0, 25);

  if (!vaultDocSnap.exists()) {
    // 1. Create root `/vaults/{userId}` document first (required by Master Gate in firestore.rules)
    try {
      await setDoc(vaultRef, {
        ownerId: userId,
        vaultName: clampString(
          localSnapshot.vaultName,
          120,
          1,
          'Engineering Knowledge Vault'
        ),
        activeNoteId: cleanActiveNoteId,
        openTabIds:
          cleanOpenTabs.length > 0 ? cleanOpenTabs : [cleanActiveNoteId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, vaultPath);
    }

    // 2. Seed all local notes into `/vaults/{userId}/notes/{noteId}`
    for (const note of localSnapshot.notes) {
      const noteId = sanitizeId(note.id, 'note-default');
      const notePath = `vaults/${userId}/notes/${noteId}`;
      try {
        await setDoc(
          doc(db, 'vaults', userId, 'notes', noteId),
          buildFirestoreNotePayload(userId, note, true)
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, notePath);
      }
    }

    return {
      notes: localSnapshot.notes,
      activeNoteId: cleanActiveNoteId,
      openTabIds: cleanOpenTabs,
    };
  }

  // Vault exists in Firestore: fetch remote notes and merge with local notes
  const notesColPath = `vaults/${userId}/notes`;
  let remoteNotesSnap;
  try {
    remoteNotesSnap = await getDocs(collection(db, 'vaults', userId, 'notes'));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, notesColPath);
  }

  const localMap = new Map<string, NoteRecord>(
    localSnapshot.notes.map((n) => [n.id, n])
  );
  const mergedNotes: NoteRecord[] = [...localSnapshot.notes];

  remoteNotesSnap.forEach((docSnap) => {
    const data = docSnap.data();
    const id = String(data.id || docSnap.id);
    const existingLocal = localMap.get(id);

    const frontmatter: NoteFrontmatter = {
      tags: Array.isArray(data.tags) ? data.tags.map(String) : ['engineering'],
      status: sanitizeStatus(String(data.status || 'in-progress')),
      priority: sanitizePriority(String(data.priority || 'medium')),
      created: String(data.created || '2026-03-22'),
      ...(existingLocal?.frontmatter.aliases
        ? { aliases: existingLocal.frontmatter.aliases }
        : {}),
    };

    const rawMarkdown = String(
      data.rawMarkdown || existingLocal?.rawMarkdown || `# ${data.title || id}`
    );

    const baseNote: NoteRecord = {
      ...(existingLocal ?? {
        id,
        folderId: String(data.folderId || 'folder-02-concurrency'),
        filename: String(data.filename || `${id}.md`),
        title: String(data.title || id),
        lead: String(data.lead || ''),
        frontmatter,
        sectionHeading: String(data.sectionHeading || 'Overview'),
        sectionBody: String(data.sectionBody || ''),
        checklist: [],
        wikiParagraph: String(data.wikiParagraph || ''),
        rawMarkdown,
        updatedAt: 'Synced from Firebase',
      }),
      id,
      folderId: String(data.folderId || existingLocal?.folderId || 'folder-02-concurrency'),
      filename: String(data.filename || existingLocal?.filename || `${id}.md`),
      title: String(data.title || existingLocal?.title || id),
      lead: String(data.lead ?? existingLocal?.lead ?? ''),
      frontmatter,
      sectionHeading: String(
        data.sectionHeading ?? existingLocal?.sectionHeading ?? 'Overview'
      ),
      sectionBody: String(data.sectionBody ?? existingLocal?.sectionBody ?? ''),
      wikiParagraph: String(
        data.wikiParagraph ?? existingLocal?.wikiParagraph ?? ''
      ),
      rawMarkdown,
      bookmarked: Boolean(data.bookmarked ?? existingLocal?.bookmarked),
      updatedAt: 'Synced from Firebase',
    };

    const hydrated = syncStructuredFieldsFromRawMarkdown(baseNote, rawMarkdown);
    const idx = mergedNotes.findIndex((n) => n.id === id);
    if (idx !== -1) {
      mergedNotes[idx] = hydrated;
    } else {
      mergedNotes.push(hydrated);
    }
  });

  const vaultData = vaultDocSnap.data();
  return {
    notes: mergedNotes,
    activeNoteId:
      typeof vaultData?.activeNoteId === 'string'
        ? vaultData.activeNoteId
        : localSnapshot.activeNoteId,
    openTabIds: Array.isArray(vaultData?.openTabIds)
      ? vaultData.openTabIds.map(String)
      : localSnapshot.openTabIds,
  };
}

/**
 * Syncs a single created or updated note to Firestore `/vaults/{userId}/notes/{noteId}`,
 * respecting immutable `createdAt` and terminal `'archived'` state rules.
 */
export async function syncNoteToFirestore(
  userId: string,
  note: NoteRecord
): Promise<void> {
  const noteId = sanitizeId(note.id, 'note-default');
  const notePath = `vaults/${userId}/notes/${noteId}`;
  const noteRef = doc(db, 'vaults', userId, 'notes', noteId);

  let existingSnap;
  try {
    existingSnap = await getDoc(noteRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, notePath);
  }

  if (!existingSnap.exists()) {
    try {
      await setDoc(noteRef, buildFirestoreNotePayload(userId, note, true));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, notePath);
    }
    return;
  }

  const existingData = existingSnap.data();
  // If existing note is in terminal 'archived' state in Firestore, unarchive first if status changed,
  // or skip content update if still archived.
  if (existingData?.status === 'archived') {
    if (note.frontmatter.status !== 'archived') {
      try {
        await updateDoc(noteRef, {
          status: sanitizeStatus(note.frontmatter.status),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, notePath);
      }
    } else {
      return;
    }
  }

  const updatePayload = buildFirestoreNotePayload(userId, note, false);
  const { id: _id, ownerId: _ownerId, ...mutableFields } = updatePayload;

  try {
    await updateDoc(noteRef, mutableFields);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, notePath);
  }
}

/**
 * Syncs the root `/vaults/{userId}` workspace metadata (activeNoteId, openTabIds) to Firestore.
 */
export async function syncVaultWorkspaceToFirestore(
  userId: string,
  snapshot: VaultStateSnapshot
): Promise<void> {
  const vaultPath = `vaults/${userId}`;
  const vaultRef = doc(db, 'vaults', userId);
  const cleanActiveNoteId = sanitizeId(
    snapshot.activeNoteId,
    'note-virtual-threads'
  );
  const cleanOpenTabs = (snapshot.openTabIds || [])
    .map((id) => sanitizeId(id))
    .filter((id) => id.length >= 1)
    .slice(0, 25);

  try {
    await updateDoc(vaultRef, {
      vaultName: clampString(
        snapshot.vaultName,
        120,
        1,
        'Engineering Knowledge Vault'
      ),
      activeNoteId: cleanActiveNoteId,
      openTabIds:
        cleanOpenTabs.length > 0 ? cleanOpenTabs : [cleanActiveNoteId],
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, vaultPath);
  }
}

/**
 * Deletes a note document from `/vaults/{userId}/notes/{noteId}`.
 */
export async function deleteNoteFromFirestore(
  userId: string,
  noteId: string
): Promise<void> {
  const cleanId = sanitizeId(noteId, 'note-default');
  const notePath = `vaults/${userId}/notes/${cleanId}`;
  try {
    await deleteDoc(doc(db, 'vaults', userId, 'notes', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, notePath);
  }
}

/**
 * Attaches a real-time `onSnapshot` listener to `/vaults/{userId}/notes`
 * with mandatory `handleFirestoreError` callback.
 */
export function subscribeToRemoteVaultNotes(
  userId: string,
  onRemoteNotesChanged: (
    remoteDocs: Array<{
      id: string;
      folderId: string;
      filename: string;
      title: string;
      lead: string;
      sectionHeading: string;
      sectionBody: string;
      wikiParagraph: string;
      rawMarkdown: string;
      status: NoteFrontmatter['status'];
      priority: NoteFrontmatter['priority'];
      created: string;
      tags: string[];
      bookmarked: boolean;
    }>
  ) => void
): Unsubscribe {
  const notesPath = `vaults/${userId}/notes`;
  const colRef = collection(db, 'vaults', userId, 'notes');

  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.metadata.hasPendingWrites) {
        return;
      }
      const docs = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: String(data.id || d.id),
          folderId: String(data.folderId || 'folder-02-concurrency'),
          filename: String(data.filename || `${d.id}.md`),
          title: String(data.title || d.id),
          lead: String(data.lead || ''),
          sectionHeading: String(data.sectionHeading || 'Overview'),
          sectionBody: String(data.sectionBody || ''),
          wikiParagraph: String(data.wikiParagraph || ''),
          rawMarkdown: String(data.rawMarkdown || `# ${data.title || d.id}`),
          status: sanitizeStatus(String(data.status || 'in-progress')),
          priority: sanitizePriority(String(data.priority || 'medium')),
          created: String(data.created || '2026-03-22'),
          tags: Array.isArray(data.tags)
            ? data.tags.map(String)
            : ['engineering'],
          bookmarked: Boolean(data.bookmarked),
        };
      });
      onRemoteNotesChanged(docs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, notesPath);
    }
  );
}
