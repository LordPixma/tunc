import { IncomingWebhook } from '@slack/webhook';
import type { Queue, MessageBatch, ExecutionContext } from '@cloudflare/workers-types';

interface Env {
  NOTIFY_DLQ: Queue;
  SLACK_WEBHOOK_URL: string;
}

const MAX_ATTEMPTS = 3;

async function sendToDlq(message: any, env: Env, error: unknown): Promise<void> {
  const err = error instanceof Error ? error.message : String(error);
  console.error('Moving message to dead-letter queue', {
    body: message.body,
    attempts: message.attempts ?? 0,
    error: err,
  });
  await env.NOTIFY_DLQ.send({
    originalBody: message.body,
    attempts: message.attempts ?? 0,
    error: err,
  });
}

interface ExportedHandler<Env> {
  queue?(batch: MessageBatch<any>, env: Env, ctx: ExecutionContext): Promise<void>;
}

const worker: ExportedHandler<Env> = {
  async queue(batch: MessageBatch<any>, env: Env, ctx: ExecutionContext): Promise<void> {
    if (!env.NOTIFY_DLQ) {
      console.error('NOTIFY_DLQ queue binding is missing');
      return;
    }
    if (!env.SLACK_WEBHOOK_URL) {
      console.error('SLACK_WEBHOOK_URL is not set; moving messages to dead-letter queue');
      for (const message of batch.messages) {
        await sendToDlq(message, env, 'missing webhook URL');
      }
      return;
    }

    const webhook = new IncomingWebhook(env.SLACK_WEBHOOK_URL);
    const promises: Promise<void>[] = [];

    for (const message of batch.messages) {
      const promise = (async () => {
        try {
          console.log('Handling notification', message.body);
          const text =
            typeof message.body === 'string'
              ? message.body
              : JSON.stringify(message.body);
          await webhook.send({ text });
        } catch (err) {
          console.error('Failed to process notification', err);
          if ((message.attempts ?? 0) >= MAX_ATTEMPTS) {
            await sendToDlq(message, env, err);
          } else {
            message.retry();
          }
        }
      })();
      promises.push(promise);
    }

    ctx.waitUntil(Promise.all(promises));
  }
};

export default worker;
