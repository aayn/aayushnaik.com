// src/lib/backlinks.ts
// Build-time scan of writing for references within each collection.
// The reverse map is computed once per collection per build.

export interface EssayEntry {
  slug: string;
  data: {
    title: string;
    subtitle?: string;
  };
  body: string;
}

export interface InternalLink {
  targetSlug: string;
  linkedPhrase: string;
  context: string;
}

export interface Backlink {
  fromSlug: string;
  fromTitle: string;
  fromSubtitle?: string;
  linkedPhrase: string;
  snippet: string;
}

type WritingCollection = 'essays' | 'thoughts';

const SNIPPET_MAX = 180;

export function extractInternalLinks(body: string, collection: WritingCollection = 'essays'): InternalLink[] {
  const out: InternalLink[] = [];

  // Accept legacy essay URLs as well as their canonical archive URLs.
  const path = collection === 'essays' ? '(?:archive/)?essays' : 'thoughts';
  const mdRe = new RegExp(String.raw`\[([^\]]+)\]\(/${path}/([a-z0-9][a-z0-9-]*)\)`, 'g');
  for (const m of body.matchAll(mdRe)) {
    const idx = m.index ?? 0;
    out.push({
      targetSlug: m[2],
      linkedPhrase: m[1],
      context: body.slice(Math.max(0, idx - 80), Math.min(body.length, idx + m[0].length + 80)),
    });
  }

  const htmlRe = new RegExp(String.raw`<a\s+href="/${path}/([a-z0-9][a-z0-9-]*)"[^>]*>([^<]+)</a>`, 'g');
  for (const m of body.matchAll(htmlRe)) {
    const idx = m.index ?? 0;
    out.push({
      targetSlug: m[1],
      linkedPhrase: m[2],
      context: body.slice(Math.max(0, idx - 80), Math.min(body.length, idx + m[0].length + 80)),
    });
  }

  return out;
}

function makeSnippet(context: string, linkedPhrase: string): string {
  let s = context.replace(/\s+/g, ' ').trim();
  if (s.length > SNIPPET_MAX) {
    const idx = s.indexOf(linkedPhrase);
    if (idx >= 0) {
      const start = Math.max(0, idx - Math.floor((SNIPPET_MAX - linkedPhrase.length) / 2));
      s = s.slice(start, start + SNIPPET_MAX);
      if (start > 0) s = '…' + s;
      if (start + SNIPPET_MAX < context.length) s = s + '…';
    } else {
      s = s.slice(0, SNIPPET_MAX) + '…';
    }
  }
  return s;
}

const reverseMaps = new Map<WritingCollection, Map<string, Backlink[]>>();

export function buildReverseMap(entries: EssayEntry[], collection: WritingCollection = 'essays'): Map<string, Backlink[]> {
  const map = new Map<string, Backlink[]>();
  for (const entry of entries) {
    const links = extractInternalLinks(entry.body, collection);
    for (const link of links) {
      const target = link.targetSlug;
      if (!map.has(target)) map.set(target, []);
      const list = map.get(target)!;
      // Skip duplicates (same fromSlug → targetSlug + linkedPhrase)
      if (list.some((b) => b.fromSlug === entry.slug && b.linkedPhrase === link.linkedPhrase)) continue;
      list.push({
        fromSlug: entry.slug,
        fromTitle: entry.data.title,
        fromSubtitle: entry.data.subtitle,
        linkedPhrase: link.linkedPhrase,
        snippet: makeSnippet(link.context, link.linkedPhrase),
      });
    }
  }
  return map;
}

export function clearMemoForTest(): void {
  reverseMaps.clear();
}

export async function getBacklinks(slug: string, collectionName: WritingCollection = 'essays'): Promise<Backlink[]> {
  if (!reverseMaps.has(collectionName)) {
    // Lazy import to avoid bundling astro:content into the test environment.
    const { getCollection } = await import('astro:content');
    const collection = await getCollection(collectionName);
    const entries: EssayEntry[] = collection.map((c) => ({
      slug: c.id,
      data: { title: c.data.title, subtitle: c.data.subtitle },
      body: c.body ?? '',
    }));
    reverseMaps.set(collectionName, buildReverseMap(entries, collectionName));
  }
  return reverseMaps.get(collectionName)?.get(slug) ?? [];
}
