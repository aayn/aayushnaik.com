// src/lib/remark-sentence-spans.ts
// Remark plugin: wraps each sentence in body text in <span data-sentence>.
// Used by Sidenote.astro's mobile expand mechanic to find sentence boundaries
// without runtime regex (which is fragile around abbreviations and decimals).
//
// We use *paired* html nodes (open `<span data-sentence>` + close `</span>`)
// as siblings in the paragraph children list rather than a single html node
// with a fixed string. That way non-text inline children — emphasis, links,
// inlineCode, mdxJsxTextElement (e.g. <Sidenote/>), etc. — survive intact
// inside their sentence span.

import type { Root, Paragraph, PhrasingContent, Text } from 'mdast';
import { visit, SKIP } from 'unist-util-visit';

// Common abbreviations to avoid splitting on (case-sensitive).
const ABBREV = new Set([
  'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'Sr.', 'Jr.',
  'St.', 'Mt.', 'Ave.', 'Blvd.', 'Rd.',
  'i.e.', 'e.g.', 'etc.', 'vs.', 'cf.', 'viz.',
  'Jan.', 'Feb.', 'Mar.', 'Apr.', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Sept.', 'Oct.', 'Nov.', 'Dec.',
]);

const OPEN_SPAN: PhrasingContent = { type: 'html', value: '<span data-sentence>' };
const CLOSE_SPAN: PhrasingContent = { type: 'html', value: '</span>' };

// Split a single text string into segments at sentence boundaries.
// Each segment carries its trailing terminator + whitespace. The last
// segment of a multi-sentence string ends with a `.endsBoundary: false`
// flag so the caller knows whether to flush before continuing.
// A segment is either a piece of sentence content (text up to + including
// a sentence terminator), or a piece of inter-sentence whitespace that
// should sit OUTSIDE the sentence span as a sibling.
type Segment =
  | { kind: 'sentence'; value: string }
  | { kind: 'gap'; value: string };

function splitTextSegments(text: string): Segment[] {
  const out: Segment[] = [];
  let buf = '';
  let i = 0;
  while (i < text.length) {
    buf += text[i];
    if (/[.!?]/.test(text[i])) {
      const rest = text.slice(i + 1);
      const next = rest.match(/^(\s+)(\S)/);
      if (next && /[A-Z"'(]/.test(next[2])) {
        // Could be a sentence break — check if buf ends in an abbreviation.
        const tail = buf.match(/\b\S+\.?\s*$/)?.[0]?.trim();
        if (!tail || !ABBREV.has(tail)) {
          out.push({ kind: 'sentence', value: buf });
          out.push({ kind: 'gap', value: next[1] });
          buf = '';
          i += 1 + next[1].length;
          continue;
        }
      } else if (i === text.length - 1) {
        // Final terminator at end of text — boundary, no trailing gap.
        out.push({ kind: 'sentence', value: buf });
        buf = '';
      }
    }
    i++;
  }
  if (buf.length > 0) out.push({ kind: 'sentence', value: buf });
  return out;
}

export function remarkSentenceSpans() {
  return (tree: Root) => {
    visit(tree, 'paragraph', (node: Paragraph) => {
      // Idempotency: skip if we've already wrapped this paragraph.
      if (
        node.children.some(
          (c) => c.type === 'html' && (c as { value: string }).value === '<span data-sentence>'
        )
      ) {
        return SKIP;
      }

      // Walk children sequentially, building up "buckets" of children that
      // belong to a single sentence. When a text node contains a sentence
      // boundary we split it, flush the current bucket as a sentence span,
      // and start a new bucket.
      const out: PhrasingContent[] = [];
      let bucket: PhrasingContent[] = [];

      const flushBucket = () => {
        if (bucket.length === 0) return;
        // If the bucket only contains pure whitespace text, drop it rather
        // than emit an empty sentence span.
        const isAllWhitespace = bucket.every(
          (c) => c.type === 'text' && /^\s*$/.test((c as Text).value)
        );
        if (isAllWhitespace) {
          // Preserve any whitespace as a sibling so spacing isn't lost.
          out.push(...bucket);
          bucket = [];
          return;
        }
        out.push(OPEN_SPAN, ...bucket, CLOSE_SPAN);
        bucket = [];
      };

      for (const child of node.children) {
        if (child.type !== 'text') {
          bucket.push(child);
          continue;
        }
        const segments = splitTextSegments((child as Text).value);
        for (const seg of segments) {
          if (seg.kind === 'gap') {
            // Boundary between sentences. Close the current span; emit the
            // whitespace as a sibling so it sits outside both spans.
            flushBucket();
            out.push({ type: 'text', value: seg.value });
          } else {
            bucket.push({ type: 'text', value: seg.value });
          }
        }
      }
      flushBucket();

      // If the result contains no sentence wrappers (i.e., the paragraph had
      // no boundary-terminated sentence at all), keep the original children
      // intact — wrapping a fragment without a terminator would be misleading.
      const wrappedAny = out.some(
        (c) => c.type === 'html' && (c as { value: string }).value === '<span data-sentence>'
      );
      if (!wrappedAny) return SKIP;

      node.children = out;
      return SKIP;
    });
  };
}
