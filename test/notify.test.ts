import { describe, it, expect, vi, beforeEach } from 'vitest';

const webhookSendMock = vi.fn();
vi.mock('@slack/webhook', () => ({
  IncomingWebhook: vi.fn().mockImplementation(() => ({ send: webhookSendMock }))
}));

import worker from '../src/notify';

describe('notify queue worker', () => {
  beforeEach(() => {
    webhookSendMock.mockReset();
  });

  it('retries failed messages before max attempts', async () => {
    webhookSendMock.mockRejectedValue(new Error('oops'));
    const message = { body: 'hello', attempts: 1, retry: vi.fn() };
    const batch = { messages: [message] } as any;
    const env: any = { NOTIFY_DLQ: { send: vi.fn() }, SLACK_WEBHOOK_URL: 'https://hook' };
    await worker.queue!(batch, env, { waitUntil: () => {} } as any);
    expect(message.retry).toHaveBeenCalled();
    expect(env.NOTIFY_DLQ.send).not.toHaveBeenCalled();
  });

  it('moves messages to DLQ after max attempts', async () => {
    webhookSendMock.mockRejectedValue(new Error('fail'));
    const message = { body: 'bad', attempts: 3, retry: vi.fn() };
    const batch = { messages: [message] } as any;
    const dlqSend = vi.fn();
    const env: any = { NOTIFY_DLQ: { send: dlqSend }, SLACK_WEBHOOK_URL: 'https://hook' };
    await worker.queue!(batch, env, { waitUntil: () => {} } as any);
    expect(message.retry).not.toHaveBeenCalled();
    expect(dlqSend).toHaveBeenCalledWith(expect.objectContaining({ originalBody: 'bad', attempts: 3 }));
  });
});

