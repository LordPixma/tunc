// Cloudflare Worker entrypoint for Tunc serverless platform

import type {
  D1Database,
  Queue,
  R2Bucket,
  DurableObjectNamespace,
  ExecutionContext,
  MessageBatch,
} from '@cloudflare/workers-types';

import notifyWorker from './notify';
import { TimelineDO } from './timeline';

// Node's Buffer is not available in the Workers runtime, but the tests run in
// a Node environment where it exists. Declare it here so TypeScript does not
// complain when compiling under the "webworker" lib configuration.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Buffer: any;

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

interface JWTPayload {
  sub: string;
  role?: string;
  [key: string]: unknown;
}

function base64UrlEncode(data: Uint8Array): string {
  let str: string;
  if (typeof btoa === 'function') {
    let binary = '';
    for (const b of data) binary += String.fromCharCode(b);
    str = btoa(binary);
  } else {
    str = Buffer.from(data).toString('base64');
  }
  return str.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  if (str.length % 4) str += '='.repeat(4 - (str.length % 4));
  let binary: string;
  if (typeof atob === 'function') {
    binary = atob(str);
  } else {
    binary = Buffer.from(str, 'base64').toString('binary');
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function createJWT(payload: JWTPayload, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(enc.encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(enc.encode(JSON.stringify(payload)));
  const data = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const encodedSig = base64UrlEncode(new Uint8Array(sig));
  return `${data}.${encodedSig}`;
}

async function verifyJWT(token: string, secret: string): Promise<JWTPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('invalid token');
  const [headerB64, payloadB64, sigB64] = parts;
  const enc = new TextEncoder();
  const data = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlDecode(sigB64),
    enc.encode(data)
  );
  if (!valid) throw new Error('invalid signature');
  const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
  return JSON.parse(payloadJson);
}

// ---------------------------------------------------------------------------
// Env definition and helpers
// ---------------------------------------------------------------------------

export interface Env {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket & { bucketName?: string };
  NOTIFY_QUEUE: Queue;
  TIMELINE_DO: DurableObjectNamespace;
  API_TOKEN: string; // used by durable object tests
  JWT_SECRET: string;
}

function addCorsHeaders(res: Response): Response {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}

function jsonResponse(data: unknown, status = 200): Response {
  return addCorsHeaders(
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

function getBearer(req: Request): string | null {
  const auth = req.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice('Bearer '.length);
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async function handleCreateCapsule(req: Request, env: Env): Promise<Response> {
  const token = getBearer(req);
  if (!token) return addCorsHeaders(new Response('Unauthorized', { status: 401 }));

  let payload: JWTPayload;
  try {
    payload = await verifyJWT(token, env.JWT_SECRET);
  } catch {
    return addCorsHeaders(new Response('Unauthorized', { status: 401 }));
  }

  if (payload.role !== 'admin') {
    return addCorsHeaders(new Response('Forbidden', { status: 403 }));
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    Object.keys(body).length !== 1 ||
    typeof body.name !== 'string'
  ) {
    return jsonResponse({ error: 'Request body must contain only the "name" field' }, 400);
  }

  const name = body.name.trim();
  if (name.length > 100) {
    return jsonResponse({ error: 'name must be 100 characters or fewer' }, 400);
  }

  const id = crypto.randomUUID();
  try {
    await env.DB.prepare('INSERT INTO capsules (id, name) VALUES (?1, ?2)')
      .bind(id, name)
      .run();
  } catch {
    return jsonResponse({ error: 'db error' }, 500);
  }

  try {
    const objId = env.TIMELINE_DO.idFromName(id);
    const obj = env.TIMELINE_DO.get(objId);
    await obj.fetch('https://timeline.init');
  } catch {
    // ignore failures; this is best effort
  }

  return jsonResponse({ id }, 201);
}

async function handleUpload(req: Request, env: Env, capsuleId: string): Promise<Response> {
  const token = getBearer(req);
  if (!token) return addCorsHeaders(new Response('Unauthorized', { status: 401 }));

  try {
    await verifyJWT(token, env.JWT_SECRET);
  } catch {
    return addCorsHeaders(new Response('Unauthorized', { status: 401 }));
  }

  const id = crypto.randomUUID();
  const key = `${capsuleId}/${id}`;
  const body = await req.arrayBuffer();
  const contentType = req.headers.get('content-type') || 'application/octet-stream';
  await env.MEDIA_BUCKET.put(key, body, { httpMetadata: { contentType } });
  const url = `https://${env.MEDIA_BUCKET.bucketName}.r2.dev/${key}`;
  return jsonResponse({ url }, 201);
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

const worker = {
  async fetch(
    req: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // CORS preflight request handling
    if (req.method === 'OPTIONS') {
      return addCorsHeaders(new Response(null, { status: 204 }));
    }

    const url = new URL(req.url);

    if (req.method === 'POST' && url.pathname === '/capsule') {
      return handleCreateCapsule(req, env);
    }

    if (req.method === 'POST' && url.pathname.startsWith('/upload/')) {
      const [, , capsuleId] = url.pathname.split('/');
      return handleUpload(req, env, capsuleId);
    }

    return addCorsHeaders(new Response('Not Found', { status: 404 }));
  },

  async queue(batch: MessageBatch, env: Env, ctx: ExecutionContext): Promise<void> {
    if (typeof notifyWorker.queue === 'function') {
      return notifyWorker.queue(batch as any, env as any, ctx);
    }
    console.error('Notify worker does not implement a queue handler');
  },

  // also expose createJWT for convenience
  createJWT,
};

export default worker;
export const fetch = worker.fetch;
export const queue = worker.queue;
export { handleCreateCapsule, handleUpload, TimelineDO };
