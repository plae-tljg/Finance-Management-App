import { EventBus } from './EventBus';

export interface EventHandlerRegistry {
  register(eventBus: EventBus): void;
} 