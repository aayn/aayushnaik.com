// src/lib/remark-sentence-spans.ts
// Remark plugin: wraps each sentence in body text in <span data-sentence>.
// Used by Sidenote.astro's mobile expand mechanic to find sentence boundaries
// without runtime regex (which is fragile around abbreviations and decimals).

import type { Root, Paragraph, PhrasingContent } from 'mdast';
import { visit, SKIP } from 'unist-util-visit';

// Common abbreviations to avoid splitting on (case-sensitive).
const ABBREV = new Set([
  'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'Sr.', 'Jr.',
  'St.', 'Mt.', 'Ave.', 'Blvd.', 'Rd.',
  'i.e.', 'e.g.', 'etc.', 'vs.', 'cf.', 'viz.',
  'Jan.', 'Feb.', 'Mar.', 'Apr.', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Sept.', 'Oct.', 'Nov.', 'Dec.',
]);

function splitSentences(text: string): string[] {
  // Split on `.`, `!`, or `?` followed by whitespace + capital letter,
  // but not after an abbreviation.
  const out: string[] = [];
  let buf = '';
  let i = 0;
  while (i < text.length) {
    buf += text[i];
    if (/[.!?]/.test(text[i])) {
      const next = text.slice(i + 1).match(/^\s+(\S)/);
      if (next && /[A-Z"'(]/.test(next[1])) {
        // Could be a sentence break — check if buf ends in an abbreviation.
        const tail = buf.match(/\b\S+\.?\s*$/)?.[0]?.trim();
        if (!tail || !ABBREV.has(tail)) {
          out.push(buf.trim());
          buf = '';
          i += 1 + (text.slice(i + 1).match(/^\s+/)?.[0].length || 0);
          continue;
        }
      } else if (i === text.length - 1) {
        // Final sentence terminator at end of text.
        out.push(buf.trim());
        buf = '';
      }
    }
    i++;
  }
  if (buf.trim().length > 0) out.push(buf.trim());
  return out;
}

export function remarkSentenceSpans() {
  return (tree: Root) => {
    visit(tree, 'paragraph', (node: Paragraph) => {
      // Idempotency check: if the paragraph already has html nodes that look
      // like our spans, skip.
      const childrenStr = JSON.stringify(node.children);
      if (childrenStr.includes('data-sentence')) return SKIP;

      // Concatenate all phrasing content into a single string. We accept some
      // loss of inline formatting (links, emphasis) inside sentences for v1.
      // A more sophisticated version would walk the children and split between
      // text nodes while preserving inline-formatting siblings — out of scope
      // for v1.
      const text = node.children
        .filter((c) => c.type === 'text')
        .map((c) => (c as { value: string }).value)
        .join('');

      if (!text.trim()) return SKIP;

      const sentences = splitSentences(text);
      if (sentences.length === 0) return SKIP;

      const newChildren: PhrasingContent[] = sentences.map((s) => ({
        type: 'html',
        value: `<span data-sentence>${escapeHtml(s)}</span>`,
      }));

      // Replace children with the wrapped sentences.
      node.children = newChildren;
      return SKIP;
    });
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
