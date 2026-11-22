/**
 * [test:uuid:61dbfee5-60ad-49fd-8a57-efd3520b58cc] R42.2 ReleaseWorkflow.tagOnMerge — CI tags a merge only when it bumps the version
 */
import { describe, it, expect } from 'vitest';
import { tagOnMerge } from '../../scripts/tag-on-merge.mjs';

describe('R42.2 ReleaseWorkflow.tagOnMerge', () => {
  it('tags v<version> when the merge bumps the version and the tag is new', () => {
    expect(tagOnMerge({ prevVersion: '0.8.247', newVersion: '0.8.248', existingTags: ['v0.8.235'] })).toBe('v0.8.248');
  });
  it('makes no tag when the version did not change (an untagged old version is never stamped on a newer commit)', () => {
    expect(tagOnMerge({ prevVersion: '0.8.247', newVersion: '0.8.247', existingTags: [] })).toBeNull();
  });
  it('never re-tags an existing tag', () => {
    expect(tagOnMerge({ prevVersion: '0.8.247', newVersion: '0.8.248', existingTags: ['v0.8.248'] })).toBeNull();
  });
  it('makes no tag for a missing or non-semver version', () => {
    expect(tagOnMerge({ prevVersion: '1.0.0', newVersion: null, existingTags: [] })).toBeNull();
    expect(tagOnMerge({ prevVersion: '1.0.0', newVersion: '1.0', existingTags: [] })).toBeNull();
  });
  it('treats an unknown previous version (new branch) as a bump', () => {
    expect(tagOnMerge({ prevVersion: null, newVersion: '0.9.0', existingTags: [] })).toBe('v0.9.0');
  });
});
