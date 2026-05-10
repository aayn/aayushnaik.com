// src/lib/backlinks.test.ts
import { describe, it, expect } from 'vitest';
import { extractInternalLinks, buildReverseMap, type EssayEntry } from './backlinks';

describe('extractInternalLinks', () => {
  it('extracts markdown internal links', () => {
    const body = 'Some text linking to [moral weight](/essays/moral-weight) and another [link](/essays/grief).';
    const links = extractInternalLinks(body);
    expect(links.map((l) => l.targetSlug).sort()).toEqual(['grief', 'moral-weight']);
  });

  it('extracts HTML <a> internal links', () => {
    const html = 'Some text <a href="/essays/foo">link</a> and <a href="/essays/bar">another</a>.';
    const links = extractInternalLinks(html);
    expect(links.map((l) => l.targetSlug).sort()).toEqual(['bar', 'foo']);
  });

  it('ignores external and non-essay links', () => {
    const body = '[Google](https://google.com) and [Home](/) and [Hyper](https://hypercubic.ai)';
    const links = extractInternalLinks(body);
    expect(links).toEqual([]);
  });

  it('captures the linking phrase', () => {
    const links = extractInternalLinks('See [Strawson on free will](/essays/free-will) for details.');
    expect(links[0]).toMatchObject({
      targetSlug: 'free-will',
      linkedPhrase: 'Strawson on free will',
    });
  });
});

describe('buildReverseMap', () => {
  const entries: EssayEntry[] = [
    {
      slug: 'free-will',
      data: { title: 'On free will', subtitle: 'Reading Strawson' },
      body: 'Linking to [moral weight](/essays/moral-weight).',
    },
    {
      slug: 'moral-weight',
      data: { title: 'On moral weight', subtitle: 'Suffering' },
      body: 'Refers to [free will](/essays/free-will).',
    },
    {
      slug: 'grief',
      data: { title: 'Grief', subtitle: 'Six months' },
      body: 'No links.',
    },
  ];

  it('builds reverse map: targetSlug → list of linking essays', () => {
    const map = buildReverseMap(entries);
    expect(map.get('free-will')).toHaveLength(1);
    expect(map.get('free-will')?.[0]).toMatchObject({
      fromSlug: 'moral-weight',
      fromTitle: 'On moral weight',
    });
    expect(map.get('moral-weight')).toHaveLength(1);
    expect(map.get('grief')).toBeUndefined();
  });

  it('produces a snippet for each backlink', () => {
    const map = buildReverseMap(entries);
    const fwBacklinks = map.get('free-will')!;
    expect(fwBacklinks[0].snippet).toMatch(/free will/);
    expect(fwBacklinks[0].snippet.length).toBeLessThanOrEqual(200);
  });
});
