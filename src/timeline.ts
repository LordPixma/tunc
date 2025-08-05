export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  QUEUE: Queue<any>;
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

export class Timeline {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

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

      let items: TimelineItem[] = [];
      try {
        items = (await this.state.storage.get("items")) || [];
      } catch (err) {
        return errorResponse('storage error', 500);
      }
      items.push(item);
      try {
        await this.state.storage.put("items", items);
      } catch (err) {
        return errorResponse('storage error', 500);
      }

      return jsonResponse(item, 201);
    }

    // Handle retrieving the timeline
    if (request.method === "GET" && (pathname === "/" || pathname === "")) {
      try {
        const items: TimelineItem[] = (await this.state.storage.get("items")) || [];
        return jsonResponse(items, 200);
      } catch (err) {
        return errorResponse('storage error', 500);
      }
    }

    // Handle deleting an item from the timeline
    if (request.method === "DELETE" && pathname.startsWith("/item/")) {
      const parts = pathname.split("/");
      const itemId = parts[2];
      let items: TimelineItem[] = [];
      try {
        items = (await this.state.storage.get("items")) || [];
      } catch (err) {
        return errorResponse('storage error', 500);
      }
      const index = items.findIndex(item => item.id === itemId);

      if (index >= 0) {
        items.splice(index, 1);
        try {
          await this.state.storage.put("items", items);
        } catch (err) {
          return errorResponse('storage error', 500);
        }
        return new Response(null, { status: 204 });
      }

      return errorResponse('Not found', 404);
    }

    // If no route matches, return a 404 response
    return new Response("Not found", { status: 404 });
  }
}
