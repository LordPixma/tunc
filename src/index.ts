// Cloudflare Worker entrypoint for Tunc serverless event platform

import { IncomingRequestCfProperties, MessageBatch, ExecutionContext } from '@cloudflare/workers-types';
import { IncomingWebhook } from '@slack/webhook'; // Assuming you have this installed

import notifyWorker from './notify';

interface Env {
  API_TOKEN: string;
  DB: D1Database;
  NOTIFY_QUEUE: Queue;
  NOTIFY_DLQ: Queue; // Assuming a Dead Letter Queue binding
  MEDIA_BUCKET: R2Bucket; // Assuming an R2 bucket binding
  SLACK_WEBHOOK_URL?: string; // Assuming an optional Slack webhook URL
  ALLOWED_ORIGINS?: string; // Assuming allowed origins for CORS
  MAX_UPLOAD_SIZE?: string; // Assuming max upload size for file uploads
}

// Define a simple router (you might have a more sophisticated one)
type RouteHandler = (req: Request, env: Env, ctx: ExecutionContext) => Promise<Response>;

const routes: Record<string, Record<string, RouteHandler>> = {
  'POST': {
    '/events': async (req, env, ctx) => {
      try {
        // Check for API token in headers
        const apiToken = req.headers.get('X-API-Token');
        if (!apiToken || apiToken !== env.API_TOKEN) {
          return new Response('Unauthorized', { status: 401 });
        }

        const { name, timestamp, value, type, details } = await req.json();

        if (!name) {
          return new Response('name is required', { status: 400 });
        }

        const event: Omit<TimelineEvent, 'id' | 'timestamp'> = {
          name,
          value,
          type,
          details,
        };

        // Use server timestamp if not provided by client
        const eventTimestamp = timestamp ? new Date(timestamp) : new Date();

        const result = await env.DB.prepare(
          'INSERT INTO timeline_events (name, timestamp, value, type, details) VALUES (?, ?, ?, ?, ?)'
        )
          .bind(
            event.name,
            eventTimestamp.toISOString(),
            event.value,
            event.type,
            JSON.stringify(event.details)
          )
          .run();

        return new Response(JSON.stringify({ success: result.success }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error creating timeline event:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    },
    // Add other POST routes here
  },
  'GET': {
    // Add GET routes here
  },
  // Add other HTTP methods as needed
};

// Basic CORS handling (you might need a more robust solution)
function addCorsHeaders(response: Response): Response {
  response.headers.set('Access-Control-Allow-Origin', '* '); // Replace with allowed origins
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Token');
  return response;
}

// Define the TimelineEvent type (adjust based on your schema)
interface TimelineEvent {
  id: string;
  name: string;
  timestamp: string;
  value?: any;
  type?: string;
  details?: any;
}

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
    const method = req.method;
    const path = url.pathname;

    const handler = routes[method]?.[path];

    if (handler) {
      const response = await handler(req, env, ctx);
      return addCorsHeaders(response);
    } else {
      console.warn(`Route not found: ${req.method} ${req.url}`);
      return addCorsHeaders(new Response('Not Found', { status: 404 }));
    }
  },

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

export default worker;