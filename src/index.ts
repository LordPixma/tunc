// Cloudflare Worker entrypoint for Tunc serverless event platform
// Provides REST endpoints for creating capsules, adding items and retrieving timelines.
// This worker delegates stateful operations to a Durable Object defined in src/timeline.ts

export { TimelineDO } from "./timeline";

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
