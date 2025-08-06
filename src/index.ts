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

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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
      let data: ArrayBuffer;
      let fileType: string | undefined;

      if (contentType.includes('multipart/form-data')) {
        const form = await req.formData();
        const file = form.get('file');
        if (!(file instanceof File)) {
          return new Response('File not provided', { status: 400 });
        }
        data = await file.arrayBuffer();
        fileType = file.type || undefined;
      } else {
        data = await req.arrayBuffer();
        fileType = req.headers.get('content-type') || undefined;
        if (!data || data.byteLength === 0) {
          return new Response('No data', { status: 400 });
        }
      }

      if (data.byteLength > MAX_UPLOAD_SIZE) {
        return new Response('File too large', { status: 413 });
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
      const url = baseUrl ? `${baseUrl}/${key}` : key;

      return new Response(JSON.stringify({ url }), {
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
