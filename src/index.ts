// Cloudflare Worker entrypoint for Tunc serverless event platform
// Provides REST endpoints for creating capsules, adding items and retrieving timelines.
// This worker delegates stateful operations to a Durable Object defined in src/timeline.ts

export { TimelineDO } from "./timeline";

interface Env {
  TIMELINE_DO: DurableObjectNamespace;
  MEDIA_BUCKET: R2Bucket;
  DB: D1Database;
  NOTIFY_QUEUE: Queue;
  API_TOKEN: string;
}

function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function errorResponse(message: string, status: number = 400): Response {
  return jsonResponse({ error: message }, status);
}

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
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
    // Validate required environment bindings
    const required: (keyof Env)[] = ['TIMELINE_DO', 'MEDIA_BUCKET', 'DB', 'NOTIFY_QUEUE', 'API_TOKEN'];
    const missing = required.filter((key) => !(env as any)[key]);
    if (missing.length > 0) {
      return new Response(`Missing bindings: ${missing.join(', ')}`, { status: 500 });
    }

    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${env.API_TOKEN}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);

    // POST /capsule -> create new capsule (timeline)
    if (req.method === 'POST' && parts[0] === 'capsule' && parts.length === 1) {
      const body = await req.json().catch(() => ({}));
      const name = (body.name ?? '').trim();
      if (!name) {
        return errorResponse('name is required', 400);
      }
      const id = crypto.randomUUID();
      try {
        await env.DB.prepare(
          'INSERT INTO capsules(id, name, created_at) VALUES(?1, ?2, datetime("now"))'
        ).bind(id, name).run();
      } catch (err) {
        return errorResponse('failed to store capsule', 500);
      }
      try {
        const stub = env.TIMELINE_DO.get(env.TIMELINE_DO.idFromName(id));
        const initReq = new Request('https://tunc.internal/init', {
          headers: {
            'Authorization': `Bearer ${env.API_TOKEN}`,
            'X-Capsule-ID': id,
          }
        });
        await stub.fetch(initReq);
      } catch (err) {
        return errorResponse('failed to initialize capsule', 500);
      }
      return jsonResponse({ id }, 201);
    }

    // POST /upload/:capsuleId -> upload an attachment
    if (req.method === 'POST' && parts[0] === 'upload' && parts.length === 2) {
      const capsuleId = parts[1];
      if (!isValidUUID(capsuleId)) {
        return new Response('Invalid capsuleId', { status: 400 });
      }

      const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB
      const contentLengthHeader = req.headers.get('content-length');
      if (contentLengthHeader && parseInt(contentLengthHeader, 10) > MAX_UPLOAD_SIZE) {
        return new Response('File too large', { status: 413 });
      }

      const contentType = req.headers.get('content-type') || '';
      let data: Uint8Array;
      let fileType: string;

      if (contentType.includes('multipart/form-data')) {
        const form = await req.formData();
        const file = form.get('file');
        if (!(file instanceof File)) {
          return new Response('File not provided', { status: 400 });
        }
        fileType = file.type || '';
        if (!ALLOWED_MIME_TYPES.has(fileType)) {
          return new Response('Unsupported file type', { status: 415 });
        }
        if (file.size > MAX_UPLOAD_SIZE) {
          return new Response('File too large', { status: 413 });
        }
        try {
          data = await readStreamLimited(file.stream(), MAX_UPLOAD_SIZE);
        } catch (err) {
          return new Response('File too large', { status: 413 });
        }
      } else {
        fileType = req.headers.get('content-type') || '';
        if (!ALLOWED_MIME_TYPES.has(fileType)) {
          return new Response('Unsupported file type', { status: 415 });
        }
        const bodyStream = req.body;
        if (!bodyStream) {
          return new Response('No data', { status: 400 });
        }
        try {
          data = await readStreamLimited(bodyStream, MAX_UPLOAD_SIZE);
        } catch (err) {
          return new Response('File too large', { status: 413 });
        }
        if (!data || data.byteLength === 0) {
          return new Response('No data', { status: 400 });
        }
      }

      const objectId = crypto.randomUUID();
      const key = `${capsuleId}/${objectId}`;
      try {
        await env.MEDIA_BUCKET.put(key, data, { httpMetadata: { contentType: fileType } });
      } catch (err) {
        return errorResponse('failed to store file', 500);
      }

      const bucketName = (env.MEDIA_BUCKET as any).bucketName || (env.MEDIA_BUCKET as any).name || '';
      const baseUrl = bucketName ? `https://${bucketName}.r2.dev` : '';
      const urlResponse = baseUrl ? `${baseUrl}/${key}` : key;

      return new Response(JSON.stringify({ url: urlResponse }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // POST /capsule/:id/item -> add an item to a capsule timeline
    if (req.method === 'POST' && parts[0] === 'capsule' && parts.length === 3 && parts[2] === 'item') {
      const capsuleId = parts[1];
      if (!isValidUUID(capsuleId)) {
        return errorResponse('invalid capsule id', 400);
      }
      const stub = env.TIMELINE_DO.get(env.TIMELINE_DO.idFromName(capsuleId));
      try {
        const forwardUrl = new URL(req.url);
        forwardUrl.pathname = '/item';
        const forwardRequest = new Request(forwardUrl.toString(), req);
        forwardRequest.headers.set('X-Capsule-ID', capsuleId);
        forwardRequest.headers.set('Authorization', `Bearer ${env.API_TOKEN}`);
        return await stub.fetch(forwardRequest);
      } catch (err) {
        return errorResponse('failed to add item', 500);
      }
    }

    // GET /capsule/:id -> retrieve timeline
    if (req.method === 'GET' && parts[0] === 'capsule' && parts.length === 2) {
      const capsuleId = parts[1];
      if (!isValidUUID(capsuleId)) {
        return errorResponse('invalid capsule id', 400);
      }
      const stub = env.TIMELINE_DO.get(env.TIMELINE_DO.idFromName(capsuleId));
      try {
        const forwardUrl = new URL(req.url);
        forwardUrl.pathname = '/';
        const forwardRequest = new Request(forwardUrl.toString(), req);
        forwardRequest.headers.set('X-Capsule-ID', capsuleId);
        forwardRequest.headers.set('Authorization', `Bearer ${env.API_TOKEN}`);
        return await stub.fetch(forwardRequest);
      } catch (err) {
        return errorResponse('failed to retrieve capsule', 500);
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};
