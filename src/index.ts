// Cloudflare Worker entrypoint for Tunc serverless event platform
// Provides REST endpoints for creating capsules, adding items and retrieving timelines.
// This worker delegates stateful operations to a Durable Object defined in src/timeline.ts

interface Env {
  TIMELINE_DO: DurableObjectNamespace;
  MEDIA_BUCKET: R2Bucket;
  DB: D1Database;
  NOTIFY_QUEUE: Queue;
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);

    // POST /capsule -> create new capsule (timeline)
    if (req.method === 'POST' && parts[0] === 'capsule' && parts.length === 1) {
      const body = await req.json().catch(() => ({}));
      const id = crypto.randomUUID();
      const name = body.name || '';
      // Store metadata in D1
      await env.DB.prepare(
        'INSERT INTO capsules(id, name, created_at) VALUES(?1, ?2, datetime("now"))'
      ).bind(id, name).run();
      // Initialize timeline durable object
      const stub = env.TIMELINE_DO.get(env.TIMELINE_DO.idFromName(id));
      await stub.fetch('https://tunc.internal/init');
      return new Response(JSON.stringify({ id }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    // POST /upload/:capsuleId -> upload an attachment
    if (req.method === 'POST' && parts[0] === 'upload' && parts.length === 2) {
      const capsuleId = parts[1];
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (!uuidRegex.test(capsuleId)) {
        return new Response('Invalid capsuleId', { status: 400 });
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

      const objectId = crypto.randomUUID();
      const key = `${capsuleId}/${objectId}`;
      await env.MEDIA_BUCKET.put(key, data, { httpMetadata: { contentType: fileType } });

      const bucketName = (env.MEDIA_BUCKET as any).bucketName || (env.MEDIA_BUCKET as any).name || '';
      const baseUrl = bucketName ? `https://${bucketName}.r2.dev` : '';
      const url = baseUrl ? `${baseUrl}/${key}` : key;

      return new Response(JSON.stringify({ url }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    // POST /capsule/:id/item -> add an item to a capsule timeline
    if (req.method === 'POST' && parts[0] === 'capsule' && parts.length === 3 && parts[2] === 'item') {
      const capsuleId = parts[1];
      const stub = env.TIMELINE_DO.get(env.TIMELINE_DO.idFromName(capsuleId));
      return await stub.fetch(req);
    }

    // GET /capsule/:id -> retrieve timeline
    if (req.method === 'GET' && parts[0] === 'capsule' && parts.length === 2) {
      const capsuleId = parts[1];
      const stub = env.TIMELINE_DO.get(env.TIMELINE_DO.idFromName(capsuleId));
      return await stub.fetch(req);
    }

    return new Response('Not Found', { status: 404 });
  }
};
