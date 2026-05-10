// src/lib/backlinks.ts
// Build-time scan of essay bodies for cross-essay references.
// Top-level memoized — reverse map is computed once per build.

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

const SNIPPET_MAX = 180;

export function extractInternalLinks(body: string): InternalLink[] {
  const out: InternalLink[] = [];

  // Markdown: [text](/essays/slug)
  const mdRe = /\[([^\]]+)\]\(\/essays\/([a-z0-9][a-z0-9-]*)\)/g;
  for (const m of body.matchAll(mdRe)) {
    const idx = m.index ?? 0;
    out.push({
      targetSlug: m[2],
      linkedPhrase: m[1],
      context: body.slice(Math.max(0, idx - 80), Math.min(body.length, idx + m[0].length + 80)),
    });
  }

  // HTML: <a href="/essays/slug">text</a>
  const htmlRe = /<a\s+href="\/essays\/([a-z0-9][a-z0-9-]*)"[^>]*>([^<]+)<\/a>/g;
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

let _reverseMap: Map<string, Backlink[]> | null = null;

export function buildReverseMap(entries: EssayEntry[]): Map<string, Backlink[]> {
  const map = new Map<string, Backlink[]>();
  for (const entry of entries) {
    const links = extractInternalLinks(entry.body);
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
  _reverseMap = null;
}

export async function getBacklinks(slug: string): Promise<Backlink[]> {
  if (_reverseMap === null) {
    // Lazy import to avoid bundling astro:content into the test environment.
    const { getCollection } = await import('astro:content');
    const collection = await getCollection('essays');
    const entries: EssayEntry[] = collection.map((c) => ({
      slug: c.id,
      data: { title: c.data.title, subtitle: c.data.subtitle },
      body: c.body ?? '',
    }));
    _reverseMap = buildReverseMap(entries);
  }
  return _reverseMap.get(slug) ?? [];
}
