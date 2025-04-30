import { DomainEvent } from './DomainEvent';
import { Transaction } from '../entities/Transaction';
import { EventTypes } from './EventTypes';

export class TransactionCreatedEvent implements DomainEvent {
  eventId: string;
  occurredOn: Date;
  eventType: string;
  transaction: Transaction;

  constructor(transaction: Transaction) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.eventType = EventTypes.TRANSACTION.CREATED;
    this.transaction = transaction;
  }
}

export class TransactionUpdatedEvent implements DomainEvent {
  eventId: string;
  occurredOn: Date;
  eventType: string;
  transaction: Transaction;
  oldAmount: number;
  oldType: string;

  constructor(transaction: Transaction, oldAmount: number, oldType: string) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.eventType = EventTypes.TRANSACTION.UPDATED;
    this.transaction = transaction;
    this.oldAmount = oldAmount;
    this.oldType = oldType;
  }
}

export class TransactionDeletedEvent implements DomainEvent {
  eventId: string;
  occurredOn: Date;
  eventType: string;
  transaction: Transaction;

  constructor(transaction: Transaction) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.eventType = EventTypes.TRANSACTION.DELETED;
    this.transaction = transaction;
  }
} 