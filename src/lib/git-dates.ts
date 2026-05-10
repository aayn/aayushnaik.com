// src/lib/git-dates.ts
import { execFileSync } from 'node:child_process';

const createdCache = new Map<string, string | null>();
const modifiedCache = new Map<string, string | null>();

function gitLog(args: string[]): string | null {
  try {
    const out = execFileSync('git', ['log', ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const trimmed = out.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

export function getCreatedDate(filePath: string): string | null {
  if (createdCache.has(filePath)) return createdCache.get(filePath)!;
  // First commit that added the file. --follow handles renames.
  // Take the LAST line because git log lists newest first; the addition is the oldest = last line.
  const out = gitLog(['--diff-filter=A', '--follow', '--format=%aI', '--', filePath]);
  const result = out ? out.split('\n').slice(-1)[0] : null;
  createdCache.set(filePath, result);
  return result;
}

export function getModifiedDate(filePath: string): string | null {
  if (modifiedCache.has(filePath)) return modifiedCache.get(filePath)!;
  const out = gitLog(['-1', '--follow', '--format=%aI', '--', filePath]);
  modifiedCache.set(filePath, out);
  return out;
}
