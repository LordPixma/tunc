import type {
  D1Database,
  R2Bucket,
  Queue,
  DurableObjectState
} from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  NOTIFY_QUEUE: Queue<any>;
  API_TOKEN: string;
  ALLOWED_ORIGINS: string;
}

interface TimelineItem {
  id: string;
  message: string;
  openingDate?: string;
  attachments?: string[];
  created_at: string;
}

let allowedOriginsCache: string[] | null = null;

function addCorsHeaders(res: Response, origin: string | null): Response {
  if (origin && allowedOriginsCache?.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
  }
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Capsule-ID, X-Requested-With'
  );
  return res;
}

function jsonResponse(
  data: any,
  status: number = 200,
  origin: string | null = null
): Response {
  return addCorsHeaders(
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    }),
    origin
  );
}

function errorResponse(
  message: string,
  status: number = 400,
  origin: string | null = null
): Response {
  return jsonResponse({ error: message }, status, origin);
}

function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
}

const MAX_MESSAGE_LENGTH = 1000;
const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_LENGTH = 2048;

function isValidAttachment(ref: string, capsuleId: string): boolean {
  try {
    const url = new URL(ref);
    return url.protocol === 'https:';
  } catch {
    const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
    const re = new RegExp(`^(${uuid})/(${uuid})$`, 'i');
    const match = ref.match(re);
    if (!match) {
      return false;
    }
    // ensure the capsule ID in the path matches the provided capsuleId
    return match[1].toLowerCase() === capsuleId.toLowerCase();
  }
}

export class TimelineDO {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    if (!allowedOriginsCache) {
      allowedOriginsCache = (this.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
    }
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      return addCorsHeaders(new Response(null, { status: 204 }), origin);
    }

    // Ensure the DB binding is present
    if (!this.env.DB) {
      return errorResponse('DB binding is missing', 500, origin);
    }

    // Authenticate
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${this.env.API_TOKEN}`) {
      return addCorsHeaders(new Response('Unauthorized', { status: 401 }), origin);
    }

    const url = new URL(request.url);
    const pathname = url.pathname;
    const capsuleId = request.headers.get('X-Capsule-ID');
    if (!capsuleId) {
      return errorResponse('missing capsule id', 400, origin);
    }

    // Handle adding a new item to the timeline
    if (request.method === "POST" && pathname === "/item") {
      const data = await request.json().catch(() => ({}));
      const message: string = (data.message ?? '').trim();
      const openingDate: string | undefined = data.openingDate;
      const attachments: string[] | undefined = data.attachments;

        if (!message) {
          return errorResponse('message is required', 400, origin);
        }
        if (message.length > MAX_MESSAGE_LENGTH) {
          return errorResponse(`message exceeds ${MAX_MESSAGE_LENGTH} characters`, 400, origin);
        }
        if (openingDate && !isValidDate(openingDate)) {
          return errorResponse('invalid openingDate format', 400, origin);
        }
        if (attachments) {
          if (!Array.isArray(attachments)) {
            return errorResponse('attachments must be an array', 400, origin);
          }
          if (attachments.length > MAX_ATTACHMENTS) {
            return errorResponse(`too many attachments (max ${MAX_ATTACHMENTS})`, 400, origin);
          }
          for (const ref of attachments) {
            if (typeof ref !== 'string') {
              return errorResponse('attachments must be strings', 400, origin);
            }
            if (ref.length > MAX_ATTACHMENT_LENGTH) {
              return errorResponse('attachment reference too long', 400, origin);
            }
            if (!isValidAttachment(ref, capsuleId)) {
              return errorResponse(`invalid attachment reference: ${ref}`, 400, origin);
            }
          }
        }

      const id = crypto.randomUUID();
      const created_at = new Date().toISOString();
      const item: TimelineItem = { id, message, openingDate, attachments, created_at };

      try {
        await this.env.DB.prepare(
          'INSERT INTO items (id, capsule_id, message, attachments, opening_date, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
        )
          .bind(
            id,
            capsuleId,
            message,
            attachments ? JSON.stringify(attachments) : null,
            openingDate,
            created_at
          )
          .run();
        } catch (err) {
          console.error('failed to insert timeline item', err);
          return errorResponse('db error', 500, origin);
        }

        return jsonResponse(item, 201, origin);
      }

    // Handle retrieving the timeline
      if (request.method === "GET" && (pathname === "/" || pathname === "")) {
        try {
          const { results } = await this.env.DB.prepare(
            'SELECT id, message, attachments, opening_date as openingDate, created_at FROM items WHERE capsule_id = ?1 ORDER BY created_at'
          )
          .bind(capsuleId)
          .all();

          const items = results.map((row: any) => ({
            id: row.id,
            message: row.message,
            attachments: row.attachments ? JSON.parse(row.attachments) : undefined,
            openingDate: row.openingDate || undefined,
            created_at: row.created_at,
          }));

          return jsonResponse(items, 200, origin);
        } catch (err) {
          console.error('failed to retrieve timeline', err);
          return errorResponse('db error', 500, origin);
        }
      }

    // Handle deleting an item from the timeline
    if (request.method === "DELETE" && pathname.startsWith("/item/")) {
      const parts = pathname.split("/");
      const itemId = parts[2];
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!itemId || !uuidPattern.test(itemId)) {
        return errorResponse('invalid item id', 400, origin);
      }
      try {
        const res = await this.env.DB.prepare(
          'DELETE FROM items WHERE capsule_id = ?1 AND id = ?2'
        )
        .bind(capsuleId, itemId)
        .run();

        const changes = (res.meta as any)?.changes ?? 0;
        if (changes > 0) {
          return addCorsHeaders(new Response(null, { status: 204 }), origin);
        }
      } catch (err) {
        console.error('failed to delete item', err);
        return errorResponse('db error', 500, origin);
      }

      return errorResponse('Not found', 404, origin);
    }

    // If no route matches, return a 404 response
    return addCorsHeaders(new Response("Not found", { status: 404 }), origin);
  }
}
