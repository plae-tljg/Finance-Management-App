import { DomainEvent } from './DomainEvent';

type EventHandler<T extends DomainEvent> = (event: T) => Promise<void>;

export class EventBus {
  private static instance: EventBus;
  private handlers: Map<string, EventHandler<any>[]>;

  private constructor() {
    this.handlers = new Map();
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler as EventHandler<any>);
  }

  unsubscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      return;
    }
    const handlers = this.handlers.get(eventType)!;
    const index = handlers.indexOf(handler as EventHandler<any>);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    await Promise.all(handlers.map(handler => handler(event)));
  }
} 