interface D1Database {
  prepare(query: string): { bind(...args: any[]): { run(): Promise<any> } };
}
interface R2Bucket {}
interface Queue<T = any> { send(msg: T): Promise<void>; }
interface DurableObjectState {
  storage: {
    get(key: string): Promise<any>;
    put(key: string, value: any): Promise<void>;
    setAlarm(time: number): Promise<void>;
    getAlarm(): Promise<number | undefined>;
    deleteAlarm(): Promise<void>;
  };
  id: { toString(): string };
}
interface MessageBatch<T = any> { messages: { body: T; ack(): void }[]; }
interface DurableObjectNamespace {
  get(id: any): any;
  idFromName(name: string): any;
}
interface ExecutionContext {
  waitUntil(p: Promise<any>): void;
}
