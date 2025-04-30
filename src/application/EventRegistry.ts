import { EventBus } from '../domain/events/EventBus';
import { EventHandlerRegistry } from '../domain/events/EventHandlerRegistry';
import { BudgetEventHandlerRegistry } from '../domain/events/registries/BudgetEventHandlerRegistry';
import { BudgetService } from '../domain/services/BudgetService';

export class EventRegistry {
  private static eventBus = EventBus.getInstance();
  private static registries: EventHandlerRegistry[] = [];

  static registerBudgetHandlers(budgetService: BudgetService): void {
    const registry = new BudgetEventHandlerRegistry(budgetService);
    registry.register(this.eventBus);
    this.registries.push(registry);
  }

  // 可以添加更多注册方法
  // static registerAccountHandlers(accountService: AccountService): void { ... }
  // static registerReportHandlers(reportService: ReportService): void { ... }
} 