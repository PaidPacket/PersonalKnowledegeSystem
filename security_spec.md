# Firestore Security Specification (Phase 0: Payload-First Security TDD)

## 1. Data Invariants

1. **Zero-Trust Ownership Invariant**: Every `/vaults/{userId}` document and `/vaults/{userId}/notes/{noteId}` subcollection document belongs exclusively to the authenticated user whose verified account matches `request.auth.uid == userId` and `data.ownerId == request.auth.uid`.
2. **Verified Email Mandate**: All read and write operations require `request.auth != null && request.auth.token.email_verified == true`.
3. **Master Gate Relational Invariant**: A `/vaults/{userId}/notes/{noteId}` document cannot be created, updated, or deleted unless the parent `/vaults/{userId}` document exists and its `ownerId` equals `request.auth.uid`.
4. **Immortal Identity & Temporal Fields**: `ownerId`, `id`, and `createdAt` are immutable after document creation. `createdAt` and `updatedAt` must equal `request.time` on creation, and `updatedAt` must equal `request.time` on every update.
5. **Strict Key & Volumetric Boundaries**: Every string and array is strictly bounded by `.size()` limits matching `firebase-blueprint.json`. Shadow fields are rejected via `.keys().hasOnly(...)` and `affectedKeys().hasOnly(...)`.
6. **Terminal State Locking**: When a note's `status` is set to `'archived'`, content mutations are locked until the note is explicitly unarchived via a dedicated status-transition action.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Identity Spoofing on Vault Create)**: Authenticated user `user_A` attempts to create `/vaults/user_A` with `ownerId: "user_B"`. -> `PERMISSION_DENIED`
2. **Payload 2 (Unverified Email Spoof)**: User with `email_verified: false` attempts to create `/vaults/user_A`. -> `PERMISSION_DENIED`
3. **Payload 3 (Shadow Field Injection on Create)**: User attempts to create `/vaults/user_A` with an extra field `isAdmin: true`. -> `PERMISSION_DENIED`
4. **Payload 4 (Client Timestamp Forgery)**: User attempts to create `/vaults/user_A` with `createdAt` set to a past timestamp instead of `request.time`. -> `PERMISSION_DENIED`
5. **Payload 5 (ID Poisoning / Oversized Document ID)**: User attempts to create a note with a 300-character or special-character document ID containing spaces/slashes. -> `PERMISSION_DENIED`
6. **Payload 6 (Orphaned Subcollection Write)**: User attempts to create `/vaults/user_A/notes/note_1` when parent `/vaults/user_A` does not exist. -> `PERMISSION_DENIED`
7. **Payload 7 (Immortal Field Mutation on Update)**: User attempts to update `/vaults/user_A/notes/note_1` and change `ownerId` or `createdAt`. -> `PERMISSION_DENIED`
8. **Payload 8 (Terminal State Lock Bypass)**: User attempts to update `rawMarkdown` on a note whose existing `status` is `'archived'`. -> `PERMISSION_DENIED`
9. **Payload 9 (Denial-of-Wallet Array Overflow)**: User attempts to update `openTabIds` with 50 items (exceeding max 25) or `tags` with 30 items (exceeding max 20). -> `PERMISSION_DENIED`
10. **Payload 10 (Value Poisoning on Allowed Key)**: User updates an allowed key `status` with a non-enum value `"hacked-status"` or a 1MB string. -> `PERMISSION_DENIED`
11. **Payload 11 (Cross-Tenant PII/Vault Read)**: Authenticated user `user_B` attempts `get` or `list` on `/vaults/user_A/notes`. -> `PERMISSION_DENIED`
12. **Payload 12 (Shadow Update via Unlisted Key)**: User attempts an `update` on `/vaults/user_A` modifying an unapproved key alongside `vaultName`. -> `PERMISSION_DENIED`
