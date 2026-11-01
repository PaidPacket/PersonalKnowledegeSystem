import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractWikiLinks,
  resolveWikiLink,
  rewriteLinksOnRename,
  parseFrontmatterAndBody,
  serializeFrontmatterAndBody,
  computeBacklinks,
  computeOutgoingLinks,
  buildVaultGraph,
} from './vaultEngine';
import { INITIAL_NOTES } from './seedVault';

test('extractWikiLinks parses standard, aliased, and heading wiki-links', () => {
  const md =
    'Check [[Thread Pools & Executors]] and [[Java Memory Model & Volatile#Fences|JMM Fences]] plus [[Virtual Threads & Loom.md]].';
  const links = extractWikiLinks(md);
  assert.equal(links.length, 3);
  assert.equal(links[0].target, 'Thread Pools & Executors');
  assert.equal(links[1].target, 'Java Memory Model & Volatile');
  assert.equal(links[1].heading, 'Fences');
  assert.equal(links[1].alias, 'JMM Fences');
  assert.equal(links[2].target, 'Virtual Threads & Loom');
});

test('resolveWikiLink resolves by filename, title, and frontmatter alias', () => {
  const byFile = resolveWikiLink('Virtual Threads & Loom', INITIAL_NOTES);
  assert.ok(byFile);
  assert.equal(byFile.id, 'note-virtual-threads');

  const byAlias = resolveWikiLink('Memory Model & Virtual Threads', INITIAL_NOTES);
  assert.ok(byAlias);
  assert.equal(byAlias.id, 'note-virtual-threads');
});

test('rewriteLinksOnRename updates target while preserving heading and alias', () => {
  const original =
    'See [[Thread Pools & Executors]] and [[Thread Pools & Executors#Sizing|Pools]].';
  const updated = rewriteLinksOnRename(
    original,
    'Thread Pools & Executors',
    'JVM Executor Framework'
  );
  assert.equal(
    updated,
    'See [[JVM Executor Framework]] and [[JVM Executor Framework#Sizing|Pools]].'
  );
});

test('parseFrontmatterAndBody and serializeFrontmatterAndBody round-trip cleanly', () => {
  const fm = {
    tags: ['java', 'concurrency'],
    status: 'in-progress' as const,
    created: '2024-03-22',
    priority: 'high' as const,
    aliases: ['Loom'],
  };
  const body = '# Heading\n\nBody with [[Link]] and unknown syntax `x = 1`.';
  const serialized = serializeFrontmatterAndBody(fm, body);
  const parsed = parseFrontmatterAndBody(serialized);
  assert.deepEqual(parsed.frontmatter, fm);
  assert.equal(parsed.body, body);
});

test('computeBacklinks and computeOutgoingLinks derive accurate bidirectional references', () => {
  const vtNote = INITIAL_NOTES.find((n) => n.id === 'note-virtual-threads')!;
  const backlinks = computeBacklinks(vtNote, INITIAL_NOTES);
  assert.ok(backlinks.length >= 4, `Expected >= 4 backlinks, got ${backlinks.length}`);

  const outgoing = computeOutgoingLinks(vtNote, INITIAL_NOTES);
  assert.equal(outgoing.length, 6, `Expected 6 outgoing links, got ${outgoing.length}`);
});

test('buildVaultGraph builds nodes, edges, and degree counts accurately', () => {
  const graph = buildVaultGraph(INITIAL_NOTES);
  assert.equal(graph.nodes.length, INITIAL_NOTES.length);
  assert.ok(graph.edges.length > 8);
  const vtNode = graph.nodes.find((n) => n.id === 'note-virtual-threads')!;
  assert.ok(vtNode.inDegree >= 4);
  assert.equal(vtNode.outDegree, 6);
});
