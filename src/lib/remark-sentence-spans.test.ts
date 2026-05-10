// src/lib/remark-sentence-spans.test.ts
import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { remarkSentenceSpans } from './remark-sentence-spans';

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
