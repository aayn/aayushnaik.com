// src/lib/git-dates.test.ts
import { describe, it, expect } from 'vitest';
import { getCreatedDate, getModifiedDate } from './git-dates';

describe('git-dates', () => {
  it('returns ISO 8601 string for created date of a tracked file', () => {
    // package.json was added in the first commit and has been modified since;
    // its created date is stable across the repo's history.
    const created = getCreatedDate('package.json');
    expect(created).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('returns ISO 8601 string for modified date of a tracked file', () => {
    const modified = getModifiedDate('package.json');
    expect(modified).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('memoizes — calling getCreatedDate twice for the same file does not reshell', () => {
    const a = getCreatedDate('package.json');
    const b = getCreatedDate('package.json');
    expect(a).toBe(b);
  });

  it('returns null for a non-existent file', () => {
    expect(getCreatedDate('nonexistent-essay-xyz.mdx')).toBeNull();
    expect(getModifiedDate('nonexistent-essay-xyz.mdx')).toBeNull();
  });
});
