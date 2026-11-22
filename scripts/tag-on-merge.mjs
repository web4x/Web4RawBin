#!/usr/bin/env node
// R42.2 ci-tags: release tags are made by CI, never by hand. On a push to main, if package.json's version CHANGED
// in that push and no tag v<version> exists yet, CI tags the pushed commit. A push that does not bump the
// version is not a release and gets no tag (so an old untagged version is never stamped onto a newer commit).
// Usage (CI): node scripts/tag-on-merge.mjs <before-sha> <after-sha>   → prints the tag to create, or nothing.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// [impl:uuid:776da5a6-9024-4785-ba0c-26d917e931b8] ReleaseWorkflow.tagOnMerge — decide the release tag for a merge to main (or none)
export function tagOnMerge({ prevVersion, newVersion, existingTags }) {
  if (!newVersion || !/^\d+\.\d+\.\d+$/.test(newVersion)) return null;   // no valid semver → no release
  if (prevVersion === newVersion) return null;                             // version not bumped → not a release
  const tag = `v${newVersion}`;
  return existingTags.includes(tag) ? null : tag;                          // never re-tag
}

function versionAt(sha) {
  try { return JSON.parse(execFileSync('git', ['show', `${sha}:package.json`], { encoding: 'utf8' })).version || null; }
  catch { return null; }                                                   // e.g. the zero sha of a new branch
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [before, after = 'HEAD'] = process.argv.slice(2);
  const existingTags = execFileSync('git', ['tag', '--list', 'v*'], { encoding: 'utf8' }).split('\n').filter(Boolean);
  const tag = tagOnMerge({ prevVersion: before ? versionAt(before) : null, newVersion: versionAt(after), existingTags });
  if (tag) process.stdout.write(tag);
}
