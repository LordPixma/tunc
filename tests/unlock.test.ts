import { Timeline } from '../src/timeline';

class MockStorage {
  private data = new Map<string, any>();
  private alarm: number | undefined;
  async get(key: string) { return this.data.get(key); }
  async put(key: string, value: any) { this.data.set(key, value); }
  async setAlarm(time: number) { this.alarm = time; }
  async getAlarm() { return this.alarm; }
  async deleteAlarm() { this.alarm = undefined; }
}

(async () => {
  const messages: any[] = [];
  const env: any = {
    NOTIFY_QUEUE: { send: async (msg: any) => { messages.push(msg); } }
  };
  const state: any = {
    storage: new MockStorage(),
    id: { toString: () => 'capsule123' }
  };
  const timeline = new Timeline(state, env);

  const past = new Date(Date.now() - 1000).toISOString();
  await timeline.fetch(new Request('http://internal/item', { method: 'POST', body: JSON.stringify({ message: 'hi', openingDate: past }) }));
  await timeline.fetch(new Request('http://internal/', { method: 'GET' }));

  console.log('Emitted messages:', messages);
})();
