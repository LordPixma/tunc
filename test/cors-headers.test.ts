import { describe, it, expect } from 'vitest';
import worker from '../src/index.ts';

describe('CORS headers', () => {
  it('returns correct headers on preflight', async () => {
    const req = new Request('https://example.com/test', { method: 'OPTIONS' });
    const res = await worker.fetch(req, {} as any, {} as any);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, DELETE, OPTIONS');
    expect(res.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, X-API-Token');
  });
});
