import { describe, it, expect, vi } from 'vitest';
import worker, { createJWT } from '../src/index.js';
import { TimelineDO } from '../src/timeline.js';

// Simple in-memory DB mock
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

describe('Bug fixes', () => {
  it('rejects capsule creation with empty name after trimming', async () => {
    const db = { prepare: vi.fn() };
    const jwtSecret = 'secret';
    const token = await createJWT({ sub: 'user', role: 'admin' }, jwtSecret);
    const env: any = {
      DB: db,
      MEDIA_BUCKET: {},
      NOTIFY_QUEUE: {},
      TIMELINE_DO: {},
      API_TOKEN: 'token',
      JWT_SECRET: jwtSecret,
    };
    
    // Test with whitespace-only name
    const req = new Request('https://example.com/capsule', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: '   ' }), // Only whitespace
    });
    const res = await worker.fetch(req, env, {} as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('name is required');
    expect(db.prepare).not.toHaveBeenCalled();
  });

  it('validates capsule ID format in upload', async () => {
    const jwtSecret = 'secret';
    const token = await createJWT({ sub: 'user', role: 'user' }, jwtSecret);
    const env: any = {
      MEDIA_BUCKET: { bucketName: 'bucket' },
      DB: {},
      TIMELINE_DO: {},
      NOTIFY_QUEUE: {},
      API_TOKEN: 'token',
      JWT_SECRET: jwtSecret,
    };
    
    // Invalid capsule ID format
    const invalidCapsuleId = 'invalid-uuid-format';
    const req = new Request(`https://example.com/upload/${invalidCapsuleId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: new Uint8Array([1, 2, 3]),
    });
    const res = await worker.fetch(req, env, {} as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('invalid capsule id format');
  });

  it('handles missing bucket name in upload', async () => {
    const put = vi.fn().mockResolvedValue({});
    const jwtSecret = 'secret';
    const token = await createJWT({ sub: 'user', role: 'user' }, jwtSecret);
    const env: any = {
      MEDIA_BUCKET: { put }, // No bucketName
      DB: {},
      TIMELINE_DO: {},
      NOTIFY_QUEUE: {},
      API_TOKEN: 'token',
      JWT_SECRET: jwtSecret,
    };
    
    const capsuleId = '123e4567-e89b-12d3-a456-426614174000';
    const req = new Request(`https://example.com/upload/${capsuleId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: new Uint8Array([1, 2, 3]),
    });
    const res = await worker.fetch(req, env, {} as any);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('bucket configuration error');
  });

  it('handles invalid JSON in timeline POST request', async () => {
    const db = new MemoryDB();
    const env: any = { DB: db, MEDIA_BUCKET: {}, NOTIFY_QUEUE: {}, API_TOKEN: 'token' };
    const timeline = new TimelineDO({} as any, env);
    const capsuleId = '123e4567-e89b-12d3-a456-426614174000';

    // Create a request with invalid JSON
    const req = new Request('https://example.com/item', {
      method: 'POST',
      headers: {
        'X-Capsule-ID': capsuleId,
        'Authorization': 'Bearer token',
        'Content-Type': 'application/json',
      },
      body: '{invalid json}', // Malformed JSON
    });
    
    const res = await timeline.fetch(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('invalid JSON in request body');
  });

  it('sanitizes HTML from message content', async () => {
    const db = new MemoryDB();
    const env: any = { DB: db, MEDIA_BUCKET: {}, NOTIFY_QUEUE: {}, API_TOKEN: 'token' };
    const timeline = new TimelineDO({} as any, env);
    const capsuleId = '123e4567-e89b-12d3-a456-426614174000';

    const req = new Request('https://example.com/item', {
      method: 'POST',
      headers: {
        'X-Capsule-ID': capsuleId,
        'Authorization': 'Bearer token',
      },
      body: JSON.stringify({
        message: 'Hello <script>alert("xss")</script> <b>world</b>!',
      }),
    });
    
    const res = await timeline.fetch(req);
    expect(res.status).toBe(201);
    const item = await res.json();
    // Should have stripped script tags and HTML
    expect(item.message).toBe('Hello  world!');
  });
});