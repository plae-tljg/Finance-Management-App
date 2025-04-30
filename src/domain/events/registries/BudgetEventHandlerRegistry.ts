import { EventBus } from '../EventBus';
import { EventHandlerRegistry } from '../EventHandlerRegistry';
import { BudgetEventHandler } from '../handlers/BudgetEventHandler';
import { BudgetService } from '../../services/BudgetService';
import { EventTypes } from '../EventTypes';
import { TransactionCreatedEvent, TransactionUpdatedEvent, TransactionDeletedEvent } from '../TransactionEvents';

export class BudgetEventHandlerRegistry implements EventHandlerRegistry {
  constructor(private budgetService: BudgetService) {}

  register(eventBus: EventBus): void {
    const budgetEventHandler = new BudgetEventHandler(this.budgetService);

    eventBus.subscribe<TransactionCreatedEvent>(EventTypes.TRANSACTION.CREATED, (event) => 
      budgetEventHandler.handleTransactionCreated(event)
    );
    eventBus.subscribe<TransactionUpdatedEvent>(EventTypes.TRANSACTION.UPDATED, (event) => 
      budgetEventHandler.handleTransactionUpdated(event)
    );
    eventBus.subscribe<TransactionDeletedEvent>(EventTypes.TRANSACTION.DELETED, (event) => 
      budgetEventHandler.handleTransactionDeleted(event)
    );
  }
} 