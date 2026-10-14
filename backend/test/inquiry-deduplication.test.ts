import assert from 'node:assert/strict';
import test from 'node:test';
import { buildApp } from '../src/app.js';

test('duplicate public inquiries reuse the stored row and do not authorize another browser Lead', async () => {
  const app = await buildApp();
  const email = `meta-dedupe-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const payload = {
    name: 'Meta Deduplication Test',
    email,
    message: 'Same inquiry submitted twice',
    sourcePage: '/contact',
    pageLanguage: 'en',
    metaEventId: 'meta-event-first',
  };

  try {
    const first = await app.inject({ method: 'POST', url: '/api/inquiries', payload });
    const second = await app.inject({
      method: 'POST',
      url: '/api/inquiries',
      payload: { ...payload, metaEventId: 'meta-event-second' },
    });

    assert.equal(first.statusCode, 200);
    assert.equal(first.json().data.created, true);
    assert.equal(second.statusCode, 200);
    assert.equal(second.json().data.created, false);
    assert.equal(second.json().data.id, first.json().data.id);
    assert.equal(await app.prisma.inquiry.count({ where: { email } }), 1);
  } finally {
    await app.prisma.inquiry.deleteMany({ where: { email } });
    await app.close();
  }
});
