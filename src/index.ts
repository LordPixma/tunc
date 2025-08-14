// Cloudflare Worker entrypoint for Tunc serverless event platform
// Provides REST endpoints for creating capsules, adding items and retrieving timelines.
// This worker delegates stateful operations to a Durable Object defined in src/timeline.ts

import type {
  ExportedHandler,
  MessageBatch,
  DurableObjectNamespace,
  R2Bucket,
  D1Database,
  Queue,
  ExecutionContext
} from '@cloudflare/workers-types';

export { TimelineDO } from "./timeline";

import notifyWorker from './notify';

interface Env {
  TIMELINE_DO: DurableObjectNamespace;
  MEDIA_BUCKET: R2Bucket;
  DB: D1Database;
  NOTIFY_QUEUE: Queue;
  API_TOKEN: string;
  JWT_SECRET: string;
}

function addCorsHeaders(res: Response): Response {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Content-Security-Policy', "default-src 'self'; object-src 'none'; frame-ancestors 'none';");
  res.headers.set('Referrer-Policy', 'no-referrer-when-downgrade');
  return res;
}

function jsonResponse(data: any, status: number = 200): Response {
  return addCorsHeaders(new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  }));
}

function errorResponse(message: string, status: number = 400): Response {
  return jsonResponse({ error: message }, status);
}

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64urlEncode(data: Uint8Array): string {
  let str = '';
  data.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = str.length % 4;
  if (pad) str += '='.repeat(4 - pad);
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function createJWT(payload: any, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const header = base64urlEncode(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payloadPart = base64urlEncode(encoder.encode(JSON.stringify(payload)));
  const unsigned = `${header}.${payloadPart}`;
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(unsigned));
  return `${unsigned}.${base64urlEncode(new Uint8Array(signature))}`;
}

export async function verifyJWT(token: string, secret: string): Promise<any | null> {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) return null;
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const unsigned = `${header}.${payload}`;
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    base64urlDecode(signature),
    encoder.encode(unsigned)
  );
  if (!valid) return null;
  return JSON.parse(decoder.decode(base64urlDecode(payload)));
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'video/mp4',
  'application/pdf'
]);

async function readStreamLimited(stream: ReadableStream<Uint8Array>, maxSize: number): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxSize) {
      throw new Error('File too large');
    }
    chunks.push(value);
  }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (req.method === 'OPTIONS') {
      // Handle CORS preflight requests
      console.log(`Handling OPTIONS preflight for ${req.url}`);
      return addCorsHeaders(new Response(null, { status: 204 }));
    }

    // Validate required environment bindings
    const required: (keyof Env)[] = ['TIMELINE_DO', 'MEDIA_BUCKET', 'DB', 'NOTIFY_QUEUE', 'API_TOKEN', 'JWT_SECRET'];
    const missing = required.filter((key) => !(env as any)[key]);
    if (missing.length > 0) {
      console.error(`Missing environment bindings: ${missing.join(', ')}`);
      return addCorsHeaders(new Response(`Missing bindings: ${missing.join(', ')}`, { status: 500 }));
    }

    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);

    // Token issuance endpoint
    if (req.method === 'POST' && parts[0] === 'auth' && parts[1] === 'token' && parts.length === 2) {
      console.log(`Handling POST /auth/token`);
      const authHeader = req.headers.get('Authorization');
      if (authHeader !== `Bearer ${env.API_TOKEN}`) {
        console.warn(`Unauthorized attempt to get token from ${req.url}`);
        return addCorsHeaders(new Response('Unauthorized', { status: 401 })); // Unauthorized
      }
      const body = await req.json().catch(() => ({}));
      const user = (body.user ?? '').trim();
      const role = (body.role ?? 'user').trim();
      if (!user) {
        return errorResponse('user is required', 400);
      }
      const token = await createJWT({ sub: user, role }, env.JWT_SECRET);
      console.log(`Successfully issued token for user: ${user}`);
      return jsonResponse({ token }, 201);
    }

    console.log(`Handling authenticated request: ${req.method} ${req.url}`);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.warn(`Missing or invalid Authorization header for ${req.url}`);
      return addCorsHeaders(new Response('Unauthorized', { status: 401 }));
    }
    const token = authHeader.slice(7);
    const payload = await verifyJWT(token, env.JWT_SECRET);
    if (!payload) {
      console.warn(`Invalid JWT token for ${req.url}`);
      return addCorsHeaders(new Response('Unauthorized', { status: 401 })); // Unauthorized
    }
    const user = payload as { sub: string; role?: string };

    // POST /capsule -> create new capsule (timeline)
    if (req.method === 'POST' && parts[0] === 'capsule' && parts.length === 1) {
      if (user.role !== 'admin') {
        return addCorsHeaders(new Response('Forbidden', { status: 403 }));
        console.warn(`Forbidden access to create capsule by user: ${user.sub}`);
      }
      let body: any;
      try {
        body = await req.json();
      } catch (e) {
        return errorResponse('Invalid JSON body', 400);
      }
      console.log(`Handling POST /capsule from user: ${user.sub}`);
      if (typeof body !== 'object' || body === null) {
        console.warn(`Invalid request body type for POST /capsule`);
        return errorResponse('Request body must be an object', 400);
      }
      if (Object.keys(body).length !== 1 || !('name' in body)) {
        console.warn(`Invalid request body fields for POST /capsule`);
        return errorResponse('Request body must contain only the "name" field', 400);
      }
      const name = body.name;
      if (typeof name !== 'string' || name.trim() === '') {
        console.warn(`Empty or non-string name provided for POST /capsule`);
        return errorResponse('Field "name" must be a non-empty string', 400);
      }
      if (name.length > 100) {
        console.warn(`Name too long for POST /capsule: ${name.length} characters`);
        return errorResponse('name must be 100 characters or fewer', 400);
      }
      const id = crypto.randomUUID();
      console.log(`Attempting to create capsule with ID: ${id} and name: "${name.trim()}"`);
      try {
        await env.DB.prepare(
          'INSERT INTO capsules(id, name, created_at) VALUES(?1, ?2, datetime("now"))'
        ).bind(id, name.trim()).run();
        console.log(`Successfully stored capsule in D1: ${id}`);

      } catch (err) {
        console.error('failed to store capsule', err);
        return errorResponse('failed to store capsule', 500);
      }
      try {
        const stub = env.TIMELINE_DO.get(env.TIMELINE_DO.idFromName(id)) as any;
        const initReq = new Request('https://tunc.internal/init', {
          headers: {
            'Authorization': `Bearer ${env.API_TOKEN}`,
            'X-Capsule-ID': id,
          }
        });
        await stub.fetch(initReq);
        console.log(`Successfully initialized Durable Object for capsule: ${id}`);
      } catch (err) {
        console.error('failed to initialize capsule', err);
        return errorResponse('failed to initialize capsule', 500);
      }
      return jsonResponse({ id }, 201);
    }

    // POST /upload/:capsuleId -> upload an attachment
    if (req.method === 'POST' && parts[0] === 'upload' && parts.length === 2) {
      console.log(`Handling POST /upload/:capsuleId for user: ${user.sub}`);
      const capsuleId = parts[1];
      if (!isValidUUID(capsuleId)) {
        return addCorsHeaders(new Response('Invalid capsuleId', { status: 400 }));
      }

      const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB
      const contentLengthHeader = req.headers.get('content-length');
      if (contentLengthHeader) {
        const contentLength = parseInt(contentLengthHeader, 10);
        if (isNaN(contentLength)) {
          return errorResponse('Invalid content-length', 400);
          console.warn(`Invalid content-length header for upload to capsule ${capsuleId}`);
        }
        if (contentLength > MAX_UPLOAD_SIZE) {
          return addCorsHeaders(new Response('File too large', { status: 413 }));
        }
      }

      const contentType = req.headers.get('content-type') || '';
      let data: Uint8Array;
      let fileType: string;

      if (contentType.includes('multipart/form-data')) {
        const form = await req.formData();
        const file = form.get('file');
        if (!(file instanceof File)) {
          return addCorsHeaders(new Response('File not provided', { status: 400 }));
          console.warn(`File not provided in multipart upload to capsule ${capsuleId}`);
        }
        fileType = file.type || '';
        if (!ALLOWED_MIME_TYPES.has(fileType)) {
          return addCorsHeaders(new Response('Unsupported file type', { status: 415 }));
        }
        if (file.size > MAX_UPLOAD_SIZE) {
          return addCorsHeaders(new Response('File too large', { status: 413 }));
        }
        try {
          console.log(`Reading multipart file stream for upload to capsule ${capsuleId}`);
          data = await readStreamLimited(file.stream(), MAX_UPLOAD_SIZE);
        } catch (err) {
          console.error('error reading multipart file stream', err);
          return addCorsHeaders(new Response('File too large', { status: 413 }));
        }
      } else {
        fileType = contentType;
        if (!ALLOWED_MIME_TYPES.has(fileType)) {
          return addCorsHeaders(new Response('Unsupported file type', { status: 415 }));
        }
        const bodyStream = req.body;
        if (!bodyStream) {
          return addCorsHeaders(new Response('No data', { status: 400 }));
          console.warn(`No data in request body for upload to capsule ${capsuleId}`);
        }
        try {
          data = await readStreamLimited(bodyStream, MAX_UPLOAD_SIZE);
        } catch (err) {
          console.error('error reading upload body', err);

          return addCorsHeaders(new Response('File too large', { status: 413 }));
        }
        if (data.byteLength === 0) {
          return addCorsHeaders(new Response('No data', { status: 400 }));
        }
      }

      const objectId = crypto.randomUUID();
      const key = `${capsuleId}/${objectId}`;
      try {
        console.log(`Attempting to upload file to R2 bucket: ${key}`);
        await env.MEDIA_BUCKET.put(key, data, { httpMetadata: { contentType: fileType } });
      } catch (err) {
        console.error('failed to store file', err);
        return errorResponse('failed to store file', 500);
      }

      const bucketName = (env.MEDIA_BUCKET as any).bucketName || (env.MEDIA_BUCKET as any).name || '';
      const baseUrl = bucketName ? `https://${bucketName}.r2.dev` : '';
      const urlResponse = baseUrl ? `${baseUrl}/${key}` : key;

      console.log(`Successfully uploaded file to R2: ${urlResponse}`);
      return addCorsHeaders(new Response(JSON.stringify({ url: urlResponse }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }));
    }

    // POST /capsule/:id/item -> add an item to a capsule timeline
    if (req.method === 'POST' && parts[0] === 'capsule' && parts.length === 3 && parts[2] === 'item') {
      console.log(`Handling POST /capsule/:id/item for user: ${user.sub}, capsule: ${parts[1]}`);
      const capsuleId = parts[1];
      if (!isValidUUID(capsuleId)) {
        return errorResponse('invalid capsule id', 400);
        console.warn(`Invalid capsule ID for POST /capsule/:id/item: ${capsuleId}`);
      }
      const stub = env.TIMELINE_DO.get(env.TIMELINE_DO.idFromName(capsuleId)) as any;
      try {
        const forwardUrl = new URL(req.url);
        forwardUrl.pathname = '/item';
        const forwardRequest = new Request(forwardUrl.toString(), req);
        forwardRequest.headers.set('X-Capsule-ID', capsuleId);
        forwardRequest.headers.set('Authorization', `Bearer ${env.API_TOKEN}`);
        console.log(`Forwarding item creation request to Durable Object for capsule: ${capsuleId}`);
        return addCorsHeaders(await stub.fetch(forwardRequest));
      } catch (err) {
        console.error('failed to add item', err);
        return errorResponse('failed to add item', 500);
      }
    }

    // GET /capsule/:id -> retrieve timeline
    if (req.method === 'GET' && parts[0] === 'capsule' && parts.length === 2) {
      console.log(`Handling GET /capsule/:id for user: ${user.sub}, capsule: ${parts[1]}`);
      const capsuleId = parts[1];
      if (!isValidUUID(capsuleId)) {
        return errorResponse('invalid capsule id', 400);
        console.warn(`Invalid capsule ID for GET /capsule/:id: ${capsuleId}`);
      }
      const stub = env.TIMELINE_DO.get(env.TIMELINE_DO.idFromName(capsuleId)) as any;
      try {
        const forwardUrl = new URL(req.url);
        forwardUrl.pathname = '/';
        const forwardRequest = new Request(forwardUrl.toString(), req);
        forwardRequest.headers.set('X-Capsule-ID', capsuleId);
        forwardRequest.headers.set('Authorization', `Bearer ${env.API_TOKEN}`);
        console.log(`Forwarding timeline retrieval request to Durable Object for capsule: ${capsuleId}`);
        return addCorsHeaders(await stub.fetch(forwardRequest));
      } catch (err) {
        console.error('failed to retrieve capsule', err);
        return errorResponse('failed to retrieve capsule', 500);
      }
    }

    console.warn(`Route not found: ${req.method} ${req.url}`);
    return addCorsHeaders(new Response('Not Found', { status: 404 }));
  }

  async queue(batch: MessageBatch, env: Env, ctx: ExecutionContext): Promise<void> {
    // delegate processing to notify.ts
    if (typeof notifyWorker.queue === 'function') {
      // Cast to any because the types might not align perfectly between index.ts and notify.ts due to separate compilation
      return notifyWorker.queue(batch as any, env as any, ctx);
    }
    // fallback: log and drop messages if handler isn’t defined
    console.error('Notify worker does not implement a queue handler');
    // Optionally, you could acknowledge the messages or send them to a DLQ here
  }
};
