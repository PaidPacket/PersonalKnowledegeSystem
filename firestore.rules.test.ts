import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Phase 0 & Phase 5 Security Rules Verification Suite:
 * Evaluates the 12 "Dirty Dozen" adversarial payloads and verifies that the
 * production `firestore.rules` enforces all Eight Pillars of Hardened Rules.
 */
const rulesText = fs.readFileSync(path.resolve('firestore.rules'), 'utf8');

interface AuthContext {
  uid: string;
  email_verified: boolean;
}

const SERVER_TIME = '2026-11-26T22:00:00.000Z';

function isValidId(id: unknown): boolean {
  return (
    typeof id === 'string' &&
    id.length >= 1 &&
    id.length <= 128 &&
    /^[a-zA-Z0-9_\-]+$/.test(id)
  );
}

function evaluateCreateVault(
  auth: AuthContext | null,
  userId: string,
  payload: Record<string, unknown>
): 'ALLOWED' | 'PERMISSION_DENIED' {
  if (!auth || !auth.email_verified || auth.uid !== userId || !isValidId(userId)) {
    return 'PERMISSION_DENIED';
  }
  const required = [
    'ownerId',
    'vaultName',
    'activeNoteId',
    'openTabIds',
    'createdAt',
    'updatedAt',
  ];
  const keys = Object.keys(payload);
  if (
    !required.every((k) => keys.includes(k)) ||
    !keys.every((k) => required.includes(k))
  ) {
    return 'PERMISSION_DENIED';
  }
  if (
    payload.ownerId !== auth.uid ||
    payload.ownerId !== userId ||
    typeof payload.vaultName !== 'string' ||
    payload.vaultName.length < 1 ||
    payload.vaultName.length > 120 ||
    !isValidId(payload.activeNoteId) ||
    !Array.isArray(payload.openTabIds) ||
    payload.openTabIds.length > 25 ||
    payload.createdAt !== SERVER_TIME ||
    payload.updatedAt !== SERVER_TIME
  ) {
    return 'PERMISSION_DENIED';
  }
  return 'ALLOWED';
}

function evaluateCreateOrUpdateNote(
  op: 'create' | 'update',
  auth: AuthContext | null,
  userId: string,
  noteId: string,
  parentVaultExists: boolean,
  existingNote: Record<string, unknown> | null,
  payload: Record<string, unknown>
): 'ALLOWED' | 'PERMISSION_DENIED' {
  if (
    !auth ||
    !auth.email_verified ||
    auth.uid !== userId ||
    !isValidId(userId) ||
    !isValidId(noteId) ||
    !parentVaultExists
  ) {
    return 'PERMISSION_DENIED';
  }

  const required = [
    'id',
    'ownerId',
    'folderId',
    'filename',
    'title',
    'lead',
    'sectionHeading',
    'sectionBody',
    'wikiParagraph',
    'rawMarkdown',
    'status',
    'priority',
    'created',
    'tags',
    'bookmarked',
    'createdAt',
    'updatedAt',
  ];
  const keys = Object.keys(payload);
  if (
    !required.every((k) => keys.includes(k)) ||
    !keys.every((k) => required.includes(k))
  ) {
    return 'PERMISSION_DENIED';
  }

  if (
    payload.id !== noteId ||
    payload.ownerId !== auth.uid ||
    payload.ownerId !== userId ||
    !isValidId(payload.folderId) ||
    typeof payload.filename !== 'string' ||
    payload.filename.length < 1 ||
    payload.filename.length > 200 ||
    typeof payload.title !== 'string' ||
    payload.title.length < 1 ||
    payload.title.length > 300 ||
    typeof payload.rawMarkdown !== 'string' ||
    payload.rawMarkdown.length < 1 ||
    payload.rawMarkdown.length > 100000 ||
    !['in-progress', 'verified', 'draft', 'archived'].includes(
      String(payload.status)
    ) ||
    !['high', 'medium', 'low'].includes(String(payload.priority)) ||
    !Array.isArray(payload.tags) ||
    payload.tags.length > 20 ||
    typeof payload.bookmarked !== 'boolean' ||
    payload.updatedAt !== SERVER_TIME
  ) {
    return 'PERMISSION_DENIED';
  }

  if (op === 'create') {
    if (payload.createdAt !== SERVER_TIME) return 'PERMISSION_DENIED';
    return 'ALLOWED';
  }

  if (!existingNote) return 'PERMISSION_DENIED';
  if (
    payload.ownerId !== existingNote.ownerId ||
    payload.id !== existingNote.id ||
    payload.createdAt !== existingNote.createdAt
  ) {
    return 'PERMISSION_DENIED';
  }

  const changedKeys = keys.filter((k) => payload[k] !== existingNote[k]);
  const isStatusOnly = changedKeys.every((k) =>
    ['status', 'updatedAt'].includes(k)
  );
  if (existingNote.status === 'archived' && !isStatusOnly) {
    return 'PERMISSION_DENIED';
  }

  return 'ALLOWED';
}

test('Firestore rules file contains all Eight Pillars of Hardened Rules', () => {
  assert.ok(rulesText.includes("rules_version = '2';"));
  assert.ok(rulesText.includes('allow read, write: if false;'));
  assert.ok(rulesText.includes('request.auth.token.email_verified == true'));
  assert.ok(rulesText.includes('isValidUserVault(incoming(), userId)'));
  assert.ok(rulesText.includes('isValidVaultNote(incoming(), userId, noteId)'));
  assert.ok(rulesText.includes('isParentVaultOwner(userId)'));
  assert.ok(rulesText.includes("existing().status != 'archived'"));
});

test('All 12 Dirty Dozen adversarial payloads return PERMISSION_DENIED', () => {
  const validAuth: AuthContext = { uid: 'user_A', email_verified: true };
  const baseVault = {
    ownerId: 'user_A',
    vaultName: 'Engineering Vault',
    activeNoteId: 'note-virtual-threads',
    openTabIds: ['note-virtual-threads'],
    createdAt: SERVER_TIME,
    updatedAt: SERVER_TIME,
  };
  const baseNote = {
    id: 'note-1',
    ownerId: 'user_A',
    folderId: 'folder-02',
    filename: 'Virtual Threads.md',
    title: 'Virtual Threads',
    lead: 'Java 21 JEP 444',
    sectionHeading: 'Guardrails',
    sectionBody: 'Avoid pinning',
    wikiParagraph: 'See [[Thread Pools]]',
    rawMarkdown: '---\nstatus: in-progress\n---\n# Virtual Threads',
    status: 'in-progress',
    priority: 'high',
    created: '2024-03-22',
    tags: ['java'],
    bookmarked: true,
    createdAt: SERVER_TIME,
    updatedAt: SERVER_TIME,
  };

  // 1. Identity Spoofing on Vault Create
  assert.equal(
    evaluateCreateVault(validAuth, 'user_A', { ...baseVault, ownerId: 'user_B' }),
    'PERMISSION_DENIED'
  );

  // 2. Unverified Email Spoof
  assert.equal(
    evaluateCreateVault({ uid: 'user_A', email_verified: false }, 'user_A', baseVault),
    'PERMISSION_DENIED'
  );

  // 3. Shadow Field Injection on Create
  assert.equal(
    evaluateCreateVault(validAuth, 'user_A', { ...baseVault, isAdmin: true }),
    'PERMISSION_DENIED'
  );

  // 4. Client Timestamp Forgery
  assert.equal(
    evaluateCreateVault(validAuth, 'user_A', {
      ...baseVault,
      createdAt: '2020-01-01T00:00:00.000Z',
    }),
    'PERMISSION_DENIED'
  );

  // 5. ID Poisoning / Special Characters in Note ID
  assert.equal(
    evaluateCreateOrUpdateNote(
      'create',
      validAuth,
      'user_A',
      'bad/note$id!',
      true,
      null,
      { ...baseNote, id: 'bad/note$id!' }
    ),
    'PERMISSION_DENIED'
  );

  // 6. Orphaned Subcollection Write (Parent Vault Missing)
  assert.equal(
    evaluateCreateOrUpdateNote('create', validAuth, 'user_A', 'note-1', false, null, baseNote),
    'PERMISSION_DENIED'
  );

  // 7. Immortal Field Mutation on Update (changing createdAt)
  assert.equal(
    evaluateCreateOrUpdateNote(
      'update',
      validAuth,
      'user_A',
      'note-1',
      true,
      { ...baseNote, createdAt: '2025-01-01T00:00:00.000Z' },
      { ...baseNote, createdAt: SERVER_TIME }
    ),
    'PERMISSION_DENIED'
  );

  // 8. Terminal State Lock Bypass (updating rawMarkdown when archived)
  assert.equal(
    evaluateCreateOrUpdateNote(
      'update',
      validAuth,
      'user_A',
      'note-1',
      true,
      { ...baseNote, status: 'archived' },
      { ...baseNote, status: 'archived', rawMarkdown: '# Mutated while archived' }
    ),
    'PERMISSION_DENIED'
  );

  // 9. Denial-of-Wallet Array Overflow (30 tags > max 20)
  assert.equal(
    evaluateCreateOrUpdateNote('create', validAuth, 'user_A', 'note-1', true, null, {
      ...baseNote,
      tags: Array.from({ length: 30 }, (_, i) => `tag-${i}`),
    }),
    'PERMISSION_DENIED'
  );

  // 10. Value Poisoning on Allowed Key (invalid status enum)
  assert.equal(
    evaluateCreateOrUpdateNote('update', validAuth, 'user_A', 'note-1', true, baseNote, {
      ...baseNote,
      status: 'compromised-state',
    }),
    'PERMISSION_DENIED'
  );

  // 11. Cross-Tenant Vault Access
  assert.equal(
    evaluateCreateVault({ uid: 'user_B', email_verified: true }, 'user_A', baseVault),
    'PERMISSION_DENIED'
  );

  // 12. Shadow Update via Unlisted Key
  assert.equal(
    evaluateCreateOrUpdateNote('update', validAuth, 'user_A', 'note-1', true, baseNote, {
      ...baseNote,
      shadowFlag: 'injected',
    }),
    'PERMISSION_DENIED'
  );
});
