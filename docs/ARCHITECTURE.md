# 技术架构

## 架构概览

应用采用三层架构 + DDD（领域驱动设计）模式：

```
┌─────────────────────────────────────────┐
│           UI Layer (React Native)        │
│   - Pages (app/)                        │
│   - Components (components/)            │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│       Context Layer (State Management)   │
│   - FinanceContext                       │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│       Service Layer (Business Logic)     │
│   - TransactionService                  │
│   - BudgetService                       │
│   - CategoryService                     │
│   - AccountService                       │
│   - AccountMonthlyBalanceService        │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│       Data Access Layer (Repository)     │
│   - TransactionRepository               │
│   - BudgetRepository                    │
│   - CategoryRepository                  │
│   - AccountRepository                   │
│   - AccountMonthlyBalanceRepository     │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│       Database Layer (SQLite)            │
│   - DatabaseService                     │
│   - Schemas (表结构定义)                 │
└─────────────────────────────────────────┘
```

## 各层职责

### 1. UI Layer (表现层)

负责用户界面展示和交互。

**位置：** `app/` 和 `components/`

**特点：**
- 函数式组件 + Hooks
- 原子化组件设计
- 路由使用 Expo Router

### 2. Context Layer (上下文层)

管理全局状态，提供组件间数据共享。

**位置：** `contexts/FinanceContext.tsx`

**提供的状态：**
- `transactions` - 交易列表
- `categories` - 分类列表
- `accounts` - 账户列表
- `budgets` - 预算列表
- `accountMonthlyBalances` - 账户月度余额记录

### 3. Service Layer (服务层)

封装业务逻辑，提供清晰的数据操作接口。

**位置：** `services/business/`

**主要服务：**
- `TransactionService` - 交易业务逻辑
- `BudgetService` - 预算业务逻辑
- `CategoryService` - 分类业务逻辑
- `AccountService` - 账户业务逻辑
- `AccountMonthlyBalanceService` - 账户月度余额业务逻辑

### 4. Repository Layer (数据访问层)

封装数据访问逻辑，提供 CRUD 操作。

**位置：** `services/database/repositories/`

**主要仓库：**
- `BaseRepository` - 基础仓库，提供通用 CRUD
- `TransactionRepository` - 交易数据访问
- `BudgetRepository` - 预算数据访问
- `CategoryRepository` - 分类数据访问
- `AccountRepository` - 账户数据访问
- `AccountMonthlyBalanceRepository` - 账户月度余额数据访问

### 5. Database Layer (数据库层)

管理数据库连接和表结构。

**位置：** `services/database/`

**核心文件：**
- `DatabaseService.ts` - 数据库连接管理
- `schemas/` - 各表结构定义
- `initialize.ts` - 数据库初始化

## 数据流程

### 添加交易流程

```
用户界面 → FinanceContext.addTransaction()
         → TransactionService.create()
         → TransactionRepository.insert()
         → DatabaseService.execute()
         → SQLite Database
```

### 查询交易流程

```
用户界面 → FinanceContext.loadTransactions()
         → TransactionService.getAll()
         → TransactionRepository.findAll()
         → DatabaseService.query()
         → SQLite Database
         → 层层返回到 UI
```

## 状态管理

应用使用 React Context 进行状态管理：

```typescript
// contexts/FinanceContext.tsx 核心结构
interface FinanceState {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  accounts: Account[];
  accountMonthlyBalances: AccountMonthlyBalance[];
}

interface FinanceContextType {
  state: FinanceState;
  // Actions
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: number, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  // ... 其他方法
}
```

## 服务定位模式

应用使用服务定位模式（Service Locator）来获取服务实例：

```typescript
// hooks/useDatabaseSetup.ts
const serviceLocator = useServiceLocator();
const transactionService = serviceLocator.get(TransactionService);
```

## 关键设计模式

### 1. Repository Pattern

每个数据实体对应一个 Repository，封装所有数据访问逻辑。

```typescript
// 通用接口
interface IRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: number): Promise<T | null>;
  insert(data: Omit<T, 'id'>): Promise<number>;
  update(id: number, data: Partial<T>): Promise<void>;
  delete(id: number): Promise<void>;
}
```

### 2. Service Layer Pattern

业务逻辑封装在 Service 层，UI 层不直接访问 Repository。

```typescript
// TransactionService 处理业务逻辑
class TransactionService {
  async create(data: CreateTransactionDTO): Promise<Transaction> {
    // 业务校验
    await this.validateBudget(data);

    // 调用 Repository
    return this.repository.insert(data);
  }
}
```

### 3. Schema + Queries Pattern

数据库表结构定义与 SQL 查询分离：

```typescript
// schemas/Transaction.ts
export const TransactionSchema = {
  name: 'transactions',
  columns: { /* ... */ }
};

export const TransactionQueries = {
  CREATE_TABLE: `CREATE TABLE ...`,
  INSERT: `INSERT INTO ...`,
  FIND_ALL: `SELECT * FROM ...`
};
```

## 依赖关系

```
┌──────────────┐
│    UI Layer   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Context    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Services   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Repository  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Database    │
└──────────────┘
```

**重要：** UI 层只依赖 Context 层，Context 层只依赖 Service 层，服务层只依赖 Repository 层，Repository 层依赖数据库层。
