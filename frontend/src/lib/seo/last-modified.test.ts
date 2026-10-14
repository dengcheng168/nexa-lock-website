import assert from 'node:assert/strict';
import test from 'node:test';
import { latestLastModified } from './last-modified';

test('latestLastModified returns the newest valid content timestamp', () => {
  const result = latestLastModified(
    [{ updatedAt: '2026-01-01T00:00:00.000Z' }],
    [{ updatedAt: null }, { updatedAt: '2026-03-01T00:00:00.000Z' }],
  );
  assert.equal(result?.toISOString(), '2026-03-01T00:00:00.000Z');
});

test('latestLastModified does not invent a date when content has no valid timestamp', () => {
  assert.equal(latestLastModified([{ updatedAt: null }, { updatedAt: 'invalid' }]), undefined);
});
