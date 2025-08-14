import { describe, it, expect, vi } from 'vitest';
import worker from '../src/index';

// Tests for the /events endpoint which logs timeline events.
describe('timeline events endpoint', () => {
  it('stores an event in the database', async () => {
    const run = vi.fn().mockResolvedValue({ success: true });
    const bind = vi.fn().mockReturnValue({ run });
    const prepare = vi.fn().mockReturnValue({ bind });

    const env: any = { DB: { prepare }, API_TOKEN: 'token' };

    const req = new Request('https://example.com/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Token': 'token',
      },
      body: JSON.stringify({ name: 'test-event', value: 42, type: 'metric', details: { a: 1 } }),
    });

    const res = await worker.fetch(req, env, {} as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(prepare).toHaveBeenCalledWith(
      'INSERT INTO timeline_events (name, timestamp, value, type, details) VALUES (?, ?, ?, ?, ?)'
    );
    expect(bind).toHaveBeenCalled();
    expect(run).toHaveBeenCalled();
  });

  it('rejects unauthorized requests', async () => {
    const env: any = { DB: {}, API_TOKEN: 'token' };
    const req = new Request('https://example.com/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test' }),
    });
    const res = await worker.fetch(req, env, {} as any);
    expect(res.status).toBe(401);
  });
});
