import { IncomingWebhook } from '@slack/webhook';
import type { Queue, MessageBatch, ExecutionContext } from '@cloudflare/workers-types';

interface Env {
  NOTIFY_DLQ: Queue;
  SLACK_WEBHOOK_URL: string;
}

const MAX_ATTEMPTS = 3;

export default {
  async queue(batch: MessageBatch<any>, env: Env, ctx: ExecutionContext): Promise<void> {
    if (!env.NOTIFY_DLQ) {
      throw new Error('NOTIFY_DLQ queue binding is missing');
    }
    if (!env.SLACK_WEBHOOK_URL) {
      console.error('SLACK_WEBHOOK_URL is not set; moving messages to dead-letter queue');
      for (const message of batch.messages) {
        await env.NOTIFY_DLQ.send(message.body);
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
            console.error('Moving message to dead-letter queue');
            await env.NOTIFY_DLQ.send(message.body);
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
