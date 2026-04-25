# API 参考

## FinanceContext

全局状态管理上下文，提供所有财务数据的访问和管理接口。

### 类型定义

```typescript
interface FinanceState {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  accounts: Account[];
  bankBalances: BankBalance[];
}

interface FinanceContextType {
  state: FinanceState;
  isLoading: boolean;
  error: string | null;
  // 交易操作
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: number, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  getTransactionById: (id: number) => Promise<Transaction | null>;
  getTransactionsByDateRange: (start: string, end: string) => Promise<Transaction[]>;
  // 分类操作
  addCategory: (cat: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: number, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  // 预算操作
  addBudget: (budget: Omit<Budget, 'id'>) => Promise<void>;
  updateBudget: (id: number, data: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: number) => Promise<void>;
  // 账户操作
  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  updateAccount: (id: number, data: Partial<Account>) => Promise<void>;
  deleteAccount: (id: number) => Promise<void>;
  // 银行余额操作
  addBankBalance: (balance: Omit<BankBalance, 'id'>) => Promise<void>;
  updateBankBalance: (id: number, data: Partial<BankBalance>) => Promise<void>;
  // 数据重载
  reloadData: () => Promise<void>;
}
```

### 使用方法

```typescript
import { useFinance } from '@/contexts/FinanceContext';

function MyComponent() {
  const { state, addTransaction } = useFinance();

  const handleAdd = async () => {
    await addTransaction({
      amount: 100,
      categoryId: 1,
      description: '午餐',
      date: new Date().toISOString(),
      type: 'expense',
    });
  };

  return (
    // ...
  );
}
```

---

## TransactionService

交易业务逻辑服务。

### 方法

#### `getAll(): Promise<Transaction[]>`

获取所有交易记录。

```typescript
const transactions = await transactionService.getAll();
```

#### `getById(id: number): Promise<Transaction | null>`

根据 ID 获取交易记录。

```typescript
const transaction = await transactionService.getById(1);
```

#### `getByCategoryId(categoryId: number): Promise<Transaction[]>`

根据分类 ID 获取交易记录。

```typescript
const transactions = await transactionService.getByCategoryId(1);
```

#### `getByDateRange(startDate: string, endDate: string): Promise<Transaction[]>`

根据日期范围获取交易记录。

```typescript
const transactions = await transactionService.getByDateRange('2026-01-01', '2026-01-31');
```

#### `create(data: CreateTransactionDTO): Promise<Transaction>`

创建新交易。

```typescript
const newTransaction = await transactionService.create({
  amount: 100,
  categoryId: 1,
  budgetId: 1,
  accountId: 1,
  description: '午餐',
  date: '2026-01-15 12:00:00',
  type: 'expense',
});
```

#### `update(id: number, data: Partial<Transaction>): Promise<void>`

更新交易记录。

```typescript
await transactionService.update(1, {
  amount: 150,
  description: '晚餐',
});
```

#### `delete(id: number): Promise<void>`

删除交易记录。

```typescript
await transactionService.delete(1);
```

#### `getTotalByType(type: 'income' | 'expense'): Promise<number>`

获取某种类型交易的总金额。

```typescript
const totalExpense = await transactionService.getTotalByType('expense');
```

#### `getSummaryByCategory(startDate: string, endDate: string): Promise<CategorySummary[]>`

获取按分类统计的摘要。

```typescript
const summary = await transactionService.getSummaryByCategory('2026-01-01', '2026-01-31');
// 返回: [{ categoryId: 1, categoryName: '餐饮', total: 1500, count: 15 }, ...]
```

---

## CategoryService

分类业务逻辑服务。

### 方法

#### `getAll(): Promise<Category[]>`

获取所有分类。

```typescript
const categories = await categoryService.getAll();
```

#### `getById(id: number): Promise<Category | null>`

根据 ID 获取分类。

```typescript
const category = await categoryService.getById(1);
```

#### `getByType(type: 'income' | 'expense'): Promise<Category[]>`

根据类型获取分类。

```typescript
const expenseCategories = await categoryService.getByType('expense');
```

#### `create(data: CreateCategoryDTO): Promise<Category>`

创建新分类。

```typescript
const newCategory = await categoryService.create({
  name: '娱乐',
  icon: '🎮',
  type: 'expense',
});
```

#### `update(id: number, data: Partial<Category>): Promise<void>`

更新分类。

```typescript
await categoryService.update(1, {
  icon: '🎯',
});
```

#### `delete(id: number): Promise<void>`

删除分类。

```typescript
await categoryService.delete(1);
```

---

## BudgetService

预算业务逻辑服务。

### 方法

#### `getAll(): Promise<Budget[]>`

获取所有预算。

```typescript
const budgets = await budgetService.getAll();
```

#### `getByMonth(month: string): Promise<Budget[]>`

根据月份获取预算。

```typescript
const budgets = await budgetService.getByMonth('2026-01');
```

#### `getBudgetExecution(month: string): Promise<BudgetExecution[]>`

获取预算执行情况。

```typescript
const execution = await budgetService.getBudgetExecution('2026-01');
// 返回: [{ budgetId: 1, name: '餐饮', budgetAmount: 2000, totalSpent: 1500, isExceeded: false }, ...]
```

#### `create(data: CreateBudgetDTO): Promise<Budget>`

创建新预算。

```typescript
const newBudget = await budgetService.create({
  name: '餐饮预算',
  categoryId: 1,
  amount: 2000,
  period: 'monthly',
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  month: '2026-01',
});
```

#### `update(id: number, data: Partial<Budget>): Promise<void>`

更新预算。

#### `delete(id: number): Promise<void>`

删除预算。

---

## AccountService

账户业务逻辑服务。

### 方法

#### `getAll(): Promise<Account[]>`

获取所有账户。

```typescript
const accounts = await accountService.getAll();
```

#### `getActive(): Promise<Account[]>`

获取活跃账户。

```typescript
const accounts = await accountService.getActive();
```

#### `getById(id: number): Promise<Account | null>`

根据 ID 获取账户。

#### `create(data: CreateAccountDTO): Promise<Account>`

创建新账户。

```typescript
const newAccount = await accountService.create({
  name: '我的银行卡',
  type: 'bank',
  icon: '💳',
  color: '#007AFF',
});
```

#### `updateBalance(id: number, balance: number): Promise<void>`

更新账户余额。

```typescript
await accountService.updateBalance(1, 5000);
```

#### `delete(id: number): Promise<void>`

删除账户。

---

## BankBalanceService

银行余额业务逻辑服务。

### 方法

#### `getAll(): Promise<BankBalance[]>`

获取所有银行余额记录。

```typescript
const balances = await bankBalanceService.getAll();
```

#### `getByYear(year: number): Promise<BankBalance[]>`

根据年份获取银行余额记录。

```typescript
const balances = await bankBalanceService.getByYear(2026);
```

#### `getByYearMonth(year: number, month: number): Promise<BankBalance | null>`

根据年月获取银行余额记录。

```typescript
const balance = await bankBalanceService.getByYearMonth(2026, 1);
```

#### `create(data: CreateBankBalanceDTO): Promise<BankBalance>`

创建银行余额记录。

```typescript
const newBalance = await bankBalanceService.create({
  year: 2026,
  month: 1,
  openingBalance: 87708.12,
  closingBalance: 97170.96,
});
```

#### `update(id: number, data: Partial<BankBalance>): Promise<void>`

更新银行余额记录。

---

## Repository 接口

基础数据访问接口。

### IRepository<T>

```typescript
interface IRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: number): Promise<T | null>;
  insert(data: Omit<T, 'id'>): Promise<number>;
  update(id: number, data: Partial<T>): Promise<void>;
  delete(id: number): Promise<void>;
}
```

### 使用示例

```typescript
class TransactionRepository extends BaseRepository<Transaction> {
  constructor(db: SQLiteDatabase) {
    super(db, TransactionSchema, TransactionQueries);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    const result = await this.databaseService.query(
      TransactionQueries.FIND_BY_DATE_RANGE,
      [startDate, endDate]
    );
    return result.rows._array as Transaction[];
  }
}
```

---

## 数据类型

### Transaction

```typescript
interface Transaction {
  id: number;
  amount: number;
  categoryId: number;
  budgetId: number;
  accountId: number;
  description: string | null;
  date: string;
  type: 'income' | 'expense';
  createdAt: string;
  updatedAt: string;
}
```

### Category

```typescript
interface Category {
  id: number;
  name: string;
  icon: string;
  type: 'income' | 'expense';
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Budget

```typescript
interface Budget {
  id: number;
  name: string;
  categoryId: number;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  month: string;
  isRegular: boolean;
  isBudgetExceeded: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Account

```typescript
interface Account {
  id: number;
  name: string;
  type: 'cash' | 'bank' | 'digital_wallet' | 'savings' | 'other';
  icon: string;
  color: string;
  balance: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
```

### BankBalance

```typescript
interface BankBalance {
  id: number;
  year: number;
  month: number;
  openingBalance: number;
  closingBalance: number;
  createdAt: string;
  updatedAt: string;
}
```
