interface Env {
  NOTIFY_QUEUE: Queue;
}

export default {
  async queue(batch: MessageBatch<any>, env: Env, ctx: ExecutionContext): Promise<void> {
    for (const message of batch.messages) {
      try {
        console.log('Handling notification', message.body);
        // Placeholder: send email or other notification
      } catch (err) {
        console.error('Failed to process notification', err);
      }
    }
  }
};
