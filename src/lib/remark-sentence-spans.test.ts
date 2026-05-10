// src/lib/remark-sentence-spans.test.ts
import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { remarkSentenceSpans } from './remark-sentence-spans';
import type { Root, Paragraph } from 'mdast';

async function transform(md: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkSentenceSpans)
    .use(remarkStringify)
    .process(md);
  return String(result);
}

describe('remark-sentence-spans', () => {
  it('wraps a single sentence', async () => {
    const out = await transform('This is one sentence.');
    expect(out).toContain('<span data-sentence>This is one sentence.</span>');
  });

  it('wraps multiple sentences in one paragraph', async () => {
    const out = await transform('First sentence. Second one.');
    expect(out).toContain('<span data-sentence>First sentence.</span>');
    expect(out).toContain('<span data-sentence>Second one.</span>');
  });

  it('handles abbreviations without splitting (e.g., Mr. Smith)', async () => {
    // Conservative behavior: do NOT split on common abbreviations.
    const out = await transform('Mr. Smith arrived. He was tired.');
    expect(out).toContain('<span data-sentence>Mr. Smith arrived.</span>');
    expect(out).toContain('<span data-sentence>He was tired.</span>');
  });

  it('does not wrap headings', async () => {
    const out = await transform('# A Heading.\n\nA sentence.');
    expect(out).not.toContain('<span data-sentence>A Heading.</span>');
    expect(out).toContain('<span data-sentence>A sentence.</span>');
  });

  it('does not double-wrap if already wrapped (idempotent)', async () => {
    const out = await transform('Some sentence.');
    const out2 = await transform(out);
    // Don't get nested spans like <span data-sentence><span data-sentence>...
    expect(out2).not.toMatch(/<span data-sentence><span data-sentence>/);
  });
});

describe('remark-sentence-spans — inline content preservation', () => {
  it('preserves non-text inline children inside sentence spans', () => {
    const tree: Root = {
      type: 'root',
      children: [{
        type: 'paragraph',
        children: [
          { type: 'text', value: 'The move ' },
          { type: 'emphasis', children: [{ type: 'text', value: 'feels' }] },
          { type: 'text', value: ' wrong. The next.' },
        ],
      }],
    };
    remarkSentenceSpans()(tree);
    const p = tree.children[0] as Paragraph;
    // The emphasis node must still exist somewhere in p.children.
    const stillHasEmphasis = p.children.some((c) => c.type === 'emphasis');
    expect(stillHasEmphasis).toBe(true);
    // There should be exactly two opening sentence spans (for two sentences).
    const openSpans = p.children.filter(
      (c) => c.type === 'html' && (c as { value: string }).value === '<span data-sentence>'
    );
    expect(openSpans).toHaveLength(2);
  });

  it('preserves inline links between sentences', () => {
    const tree: Root = {
      type: 'root',
      children: [{
        type: 'paragraph',
        children: [
          { type: 'text', value: 'See ' },
          { type: 'link', url: '/essays/foo', children: [{ type: 'text', value: 'foo' }] },
          { type: 'text', value: ' for details. Next sentence.' },
        ],
      }],
    };
    remarkSentenceSpans()(tree);
    const p = tree.children[0] as Paragraph;
    const stillHasLink = p.children.some((c) => c.type === 'link');
    expect(stillHasLink).toBe(true);
  });

  it('keeps an inline JSX-like element (simulated as html node) inside its sentence', () => {
    // Simulating an MDX inline element by using an html node as a stand-in;
    // mdxJsxTextElement type isn't loaded in the test environment without remark-mdx.
    const tree: Root = {
      type: 'root',
      children: [{
        type: 'paragraph',
        children: [
          { type: 'text', value: 'Foo ' },
          { type: 'html', value: '<x-marker />' },
          { type: 'text', value: ' bar. Baz.' },
        ],
      }],
    };
    remarkSentenceSpans()(tree);
    const p = tree.children[0] as Paragraph;
    // The custom html element must survive (other than the open/close span html nodes).
    const stillHasMarker = p.children.some(
      (c) => c.type === 'html' && (c as { value: string }).value === '<x-marker />'
    );
    expect(stillHasMarker).toBe(true);
  });
});
