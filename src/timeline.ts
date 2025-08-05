export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  NOTIFY_QUEUE: Queue;
}

interface TimelineItem {
  id: string;
  message: string;
  openingDate?: string;
  attachments?: string[];
  created_at: string;
  notified?: boolean;
}

export class Timeline {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  private async checkUnlocks(items?: TimelineItem[]): Promise<void> {
    if (!items) {
      items = (await this.state.storage.get("items")) || [];
    }

    const now = Date.now();
    let updated = false;

    for (const item of items) {
      if (item.openingDate && !item.notified) {
        const openTime = new Date(item.openingDate).getTime();
        if (openTime <= now) {
          const payload = { capsuleId: this.state.id.toString(), itemId: item.id };
          await this.env.NOTIFY_QUEUE.send(payload);
          console.log("Enqueued notification", payload);
          item.notified = true;
          updated = true;
        }
      }
    }

    if (updated) {
      await this.state.storage.put("items", items);
    }

    const next = items
      .filter(i => i.openingDate && !i.notified)
      .map(i => new Date(i.openingDate as string).getTime())
      .filter(t => t > now);

    if (next.length > 0) {
      const earliest = Math.min(...next);
      await this.state.storage.setAlarm(earliest);
    } else {
      await this.state.storage.deleteAlarm();
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle adding a new item to the timeline
    if (request.method === "POST" && pathname === "/item") {
      const data = await request.json() as any;
      const message: string = data.message ?? "";
      const openingDate: string | undefined = data.openingDate;
      const attachments: string[] | undefined = data.attachments;

      const id = crypto.randomUUID();
      const created_at = new Date().toISOString();
      const item: TimelineItem = { id, message, openingDate, attachments, created_at };

      const items: TimelineItem[] = (await this.state.storage.get("items")) || [];
      items.push(item);
      await this.state.storage.put("items", items);

      await this.checkUnlocks(items);

      return new Response(JSON.stringify(item), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Handle retrieving the timeline
    if (request.method === "GET" && (pathname === "/" || pathname === "")) {
      const items: TimelineItem[] = (await this.state.storage.get("items")) || [];
      await this.checkUnlocks(items);
      return new Response(JSON.stringify(items), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Handle deleting an item from the timeline
    if (request.method === "DELETE" && pathname.startsWith("/item/")) {
      const parts = pathname.split("/");
      const itemId = parts[2];
      let items: TimelineItem[] = (await this.state.storage.get("items")) || [];
      const index = items.findIndex(item => item.id === itemId);

      if (index >= 0) {
        items.splice(index, 1);
        await this.state.storage.put("items", items);
        return new Response(null, { status: 204 });
      }

      return new Response("Not found", { status: 404 });
    }

    // If no route matches, return a 404 response
    return new Response("Not found", { status: 404 });
  }

  async alarm(): Promise<void> {
    await this.checkUnlocks();
  }
}
