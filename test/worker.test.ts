import { describe, it, expect, vi } from 'vitest';
import worker from '../src/index';
import { TimelineDO } from '../src/timeline';

// Simple in-memory DB mock used by TimelineDO tests
class MemoryDB {
  items: any[] = [];
  prepare(query: string) {
    return {
      bind: (...args: any[]) => ({
        run: async () => {
          if (query.startsWith('INSERT INTO items')) {
            const [id, capsuleId, message, attachments, openingDate, created_at] = args;
            this.items.push({
              id,
              capsule_id: capsuleId,
              message,
              attachments,
              opening_date: openingDate,
              created_at,
            });
          }
          return {};
        },
        all: async () => {
          if (query.startsWith('SELECT id, message')) {
            const [capsuleId] = args;
            const results = this.items
              .filter((i) => i.capsule_id === capsuleId)
              .map((i) => ({
                id: i.id,
                message: i.message,
                attachments: i.attachments,
                openingDate: i.opening_date,
                created_at: i.created_at,
              }));
            return { results };
          }
          return { results: [] };
        },
      }),
    };
  }
}

describe('Worker endpoints', () => {
  it('creates a capsule', async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({ run: vi.fn().mockResolvedValue({}) }),
      }),
    };
    const doFetch = vi.fn().mockResolvedValue(new Response(null));
    const env: any = {
      DB: db,
      MEDIA_BUCKET: {},
      NOTIFY_QUEUE: {},
      TIMELINE_DO: {
        idFromName: vi.fn().mockReturnValue('id'),
        get: vi.fn().mockReturnValue({ fetch: doFetch }),
      },
      API_TOKEN: 'token',
    };
    const req = new Request('https://example.com/capsule', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer token',
      },
      body: JSON.stringify({ name: 'My Event' }),
    });
    const res = await worker.fetch(req, env, {} as any);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(db.prepare).toHaveBeenCalled();
    expect(doFetch).toHaveBeenCalled();
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('rejects overly long capsule names', async () => {
    const db = {
      prepare: vi.fn(),
    };
    const env: any = {
      DB: db,
      MEDIA_BUCKET: {},
      NOTIFY_QUEUE: {},
      TIMELINE_DO: {},
      API_TOKEN: 'token',
    };
    const longName = 'a'.repeat(101);
    const req = new Request('https://example.com/capsule', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer token' },
      body: JSON.stringify({ name: longName }),
    });
    const res = await worker.fetch(req, env, {} as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('name must be 100 characters or fewer');
    expect(db.prepare).not.toHaveBeenCalled();
  });

  it('uploads a file to R2', async () => {
    const put = vi.fn().mockResolvedValue({});
    const env: any = {
      MEDIA_BUCKET: { put, bucketName: 'bucket' },
      DB: {},
      TIMELINE_DO: {},
      NOTIFY_QUEUE: {},
      API_TOKEN: 'token',
    };
    const capsuleId = '123e4567-e89b-12d3-a456-426614174000';
    const body = new Uint8Array([1, 2, 3]);
    const req = new Request(`https://example.com/upload/${capsuleId}`, {
      method: 'POST',
      headers: {
        'content-type': 'image/png',
        'content-length': String(body.length),
        'Authorization': 'Bearer token',
      },
      body,
    });
    const res = await worker.fetch(req, env, {} as any);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.url.startsWith(`https://bucket.r2.dev/${capsuleId}/`)).toBe(true);
    expect(put).toHaveBeenCalled();
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});

describe('Timeline Durable Object', () => {
  it('adds and retrieves items with attachments', async () => {
    const db = new MemoryDB();
    const env: any = { DB: db, MEDIA_BUCKET: {}, NOTIFY_QUEUE: {}, API_TOKEN: 'token' };
    const timeline = new TimelineDO({} as any, env);
    const capsuleId = '123e4567-e89b-12d3-a456-426614174000';
    const attachmentId = '11111111-1111-4111-8111-111111111111';

    const addReq = new Request('https://example.com/item', {
      method: 'POST',
      headers: {
        'X-Capsule-ID': capsuleId,
        'Authorization': 'Bearer token',
      },
      body: JSON.stringify({
        message: 'hello',
        attachments: [`${capsuleId}/${attachmentId}`],
      }),
    });
    const addRes = await timeline.fetch(addReq);
    expect(addRes.status).toBe(201);
    expect(addRes.headers.get('Access-Control-Allow-Origin')).toBe('*');

    const getReq = new Request('https://example.com/', {
      method: 'GET',
      headers: {
        'X-Capsule-ID': capsuleId,
        'Authorization': 'Bearer token',
      },
    });
    const getRes = await timeline.fetch(getReq);
    expect(getRes.status).toBe(200);
    const items = await getRes.json();
    expect(items).toHaveLength(1);
    expect(items[0].message).toBe('hello');
    expect(getRes.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(items[0].attachments).toEqual([`${capsuleId}/${attachmentId}`]);
  });

  it('handles OPTIONS requests with CORS headers', async () => {
    const env: any = { DB: {}, MEDIA_BUCKET: {}, NOTIFY_QUEUE: {}, API_TOKEN: 'token' };
    const timeline = new TimelineDO({} as any, env);
    const res = await timeline.fetch(new Request('https://example.com/', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('rejects attachments referencing other capsules', async () => {
    const db = new MemoryDB();
    const env: any = { DB: db, MEDIA_BUCKET: {}, NOTIFY_QUEUE: {}, API_TOKEN: 'token' };
    const timeline = new TimelineDO({} as any, env);
    const capsuleId = '123e4567-e89b-12d3-a456-426614174000';
    const otherCapsuleId = '223e4567-e89b-12d3-a456-426614174000';
    const attachmentId = '22222222-2222-4222-8222-222222222222';

    const addReq = new Request('https://example.com/item', {
      method: 'POST',
      headers: {
        'X-Capsule-ID': capsuleId,
        'Authorization': 'Bearer token',
      },
      body: JSON.stringify({
        message: 'hi',
        attachments: [`${otherCapsuleId}/${attachmentId}`],
      }),
    });
    const addRes = await timeline.fetch(addReq);
    expect(addRes.status).toBe(400);
  });

  it('validates item id on delete', async () => {
    const db = new MemoryDB();
    const env: any = { DB: db, MEDIA_BUCKET: {}, NOTIFY_QUEUE: {}, API_TOKEN: 'token' };
    const timeline = new TimelineDO({} as any, env);
    const capsuleId = '123e4567-e89b-12d3-a456-426614174000';

    const delReq = new Request('https://example.com/item/not-a-uuid', {
      method: 'DELETE',
      headers: {
        'X-Capsule-ID': capsuleId,
        'Authorization': 'Bearer token',
      },
    });
    const delRes = await timeline.fetch(delReq);
    expect(delRes.status).toBe(400);
    const err = await delRes.json();
    expect(err.error).toBe('invalid item id');
  });
});

describe('CORS', () => {
  it('responds to OPTIONS with headers in worker', async () => {
    const env: any = {
      TIMELINE_DO: {},
      MEDIA_BUCKET: {},
      DB: {},
      NOTIFY_QUEUE: {},
      API_TOKEN: 'token',
    };
    const res = await worker.fetch(new Request('https://example.com/capsule', { method: 'OPTIONS' }), env, {} as any);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
