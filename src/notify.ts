export interface Env {
  NOTIFY_QUEUE: Queue;
}

interface NotifyMessage {
  capsuleId: string;
  itemId: string;
}

export default {
  async queue(batch: MessageBatch<NotifyMessage>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      const { capsuleId, itemId } = msg.body;
      // Placeholder for real notification delivery
      console.log(`Notify capsule ${capsuleId} item ${itemId}`);
      msg.ack();
    }
  }
};
