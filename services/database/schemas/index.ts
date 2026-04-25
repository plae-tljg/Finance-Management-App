import { CategoryQueries } from './Category';
import { TransactionQueries } from './Transaction';
import { BudgetQueries } from './Budget';
import { AccountMonthlyBalanceQueries } from './AccountMonthlyBalance';
import { RecurringTransactionQueries } from './RecurringTransaction';
import { AccountQueries } from './Account';
import { GoalQueries } from './Goal';
import { TagQueries, TransactionTagQueries } from './Tag';

export const SCHEMA_VERSIONS = {
  v1: '1.0.0',
  v2: '1.1.0',
  v3: '1.2.0',
  v4: '1.3.0',
  v5: '1.4.0',
};

export const SCHEMAS = {
  categories: CategoryQueries.CREATE_TABLE,
  budgets: BudgetQueries.CREATE_TABLE,
  account_monthly_balances: AccountMonthlyBalanceQueries.CREATE_TABLE,
  transactions: TransactionQueries.CREATE_TABLE,
  recurring_transactions: RecurringTransactionQueries.CREATE_TABLE,
  accounts: AccountQueries.CREATE_TABLE,
  goals: GoalQueries.CREATE_TABLE,
  tags: TagQueries.CREATE_TABLE,
  transaction_tags: TransactionTagQueries.CREATE_TABLE,
}; 