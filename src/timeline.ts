export interface Env {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  NOTIFY_QUEUE: Queue<any>;
}

interface TimelineItem {
  id: string;
  message: string;
  openingDate?: string;
  attachments?: string[];
  created_at: string;
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

function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
}

export class TimelineDO {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const capsuleId = request.headers.get('X-Capsule-ID');
    if (!capsuleId) {
      return errorResponse('missing capsule id', 400);
    }

    // Handle adding a new item to the timeline
    if (request.method === "POST" && pathname === "/item") {
      const data = await request.json().catch(() => ({}));
      const message: string = (data.message ?? '').trim();
      const openingDate: string | undefined = data.openingDate;
      const attachments: string[] | undefined = data.attachments;

      if (!message) {
        return errorResponse('message is required', 400);
      }

      if (openingDate && !isValidDate(openingDate)) {
        return errorResponse('invalid openingDate format', 400);
      }

      const id = crypto.randomUUID();
      const created_at = new Date().toISOString();
      const item: TimelineItem = { id, message, openingDate, attachments, created_at };

      try {
        await this.env.DB.prepare(
          'INSERT INTO items (id, capsule_id, message, attachments, opening_date, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
        )
          .bind(id, capsuleId, message, attachments ? JSON.stringify(attachments) : null, openingDate, created_at)
          .run();
      } catch (err) {
        return errorResponse('db error', 500);
      }

      return jsonResponse(item, 201);
    }

    // Handle retrieving the timeline
    if (request.method === "GET" && (pathname === "/" || pathname === "")) {
      try {
        const { results } = await this.env.DB.prepare(
          'SELECT id, message, attachments, opening_date as openingDate, created_at FROM items WHERE capsule_id = ?1 ORDER BY created_at'
        ).bind(capsuleId).all();
        const items = results.map((row: any) => ({
          id: row.id,
          message: row.message,
          attachments: row.attachments ? JSON.parse(row.attachments) : undefined,
          openingDate: row.openingDate || undefined,
          created_at: row.created_at,
        }));
        return jsonResponse(items, 200);
      } catch (err) {
        return errorResponse('db error', 500);
      }
    }

    // Handle deleting an item from the timeline
    if (request.method === "DELETE" && pathname.startsWith("/item/")) {
      const parts = pathname.split("/");
      const itemId = parts[2];
      try {
        const res = await this.env.DB.prepare(
          'DELETE FROM items WHERE capsule_id = ?1 AND id = ?2'
        ).bind(capsuleId, itemId).run();
        const changes = (res.meta as any)?.changes ?? 0;
        if (changes > 0) {
          return new Response(null, { status: 204 });
        }
      } catch (err) {
        return errorResponse('db error', 500);
      }

      return errorResponse('Not found', 404);
    }

    // If no route matches, return a 404 response
    return new Response("Not found", { status: 404 });
  }
}
