# 技术架构

## 架构概览

应用采用三层架构 + DDD（领域驱动设计）模式，并在此基础上做了**平台分叉**：
原生（Android / iOS）和 Web 共享同一份业务/服务/Repository 代码，**但底层的数据库服务在两个平台走完全不同的实现**——一个走 `expo-sqlite`，一个走 REST。

```
┌─────────────────────────────────────────────────────┐
│                  UI Layer (React Native)            │
│   Pages (app/) · Components (components/)            │
└──────────────────────┬──────────────────────────────┘
                       │  hooks + Context
┌──────────────────────▼──────────────────────────────┐
│            Context Layer (State Management)          │
│   FinanceContext  ·  useDatabaseSetup                │
└──────────────────────┬──────────────────────────────┘
                       │  DatabaseServiceFacade (单例)
┌──────────────────────▼──────────────────────────────┐
│              Service Layer (Business Logic)          │
│   TransactionService · BudgetService · CategoryService│
│   AccountService · AccountMonthlyBalanceService      │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│         Repository Layer (Data Access)               │
│   TransactionRepository · BudgetRepository · ...     │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼─────────┐         ┌─────────▼────────────┐
│ Native Database │         │   Web Database        │
│   (Android)     │         │   (Browser)           │
│  expo-sqlite    │         │  WebDatabase          │
│  DatabaseService│         │  SQL → REST 翻译器     │
└───────┬──────────┘         └─────────┬─────────────┘
        │                             │ HTTP /api/*
        │                             │
        ▼                             ▼
   ┌──────────────────────────────────────────┐
   │  Native HTTP Server (Kotlin / NanoHTTPD) │
   │  FinanceHttpServer                       │
   │  ├─ /api/*  →  SQLite (same DB file)     │
   │  └─ /*      →  assets/web/index.html      │
   └──────────────────┬───────────────────────┘
                      │
                      ▼
            ┌──────────────────┐
            │  FinanceManager.db│
            │  (shared SQLite)  │
            └──────────────────┘
```

## 平台分叉 (Platform Resolver)

`getDatabaseService()` 在 `services/database/index.ts` 根据 `Platform.OS` 返回不同的实例：

- **原生：** `services/database/DatabaseService.ts` —— 直接调 `expo-sqlite`
- **Web：** `services/database/web/WebDatabase.ts` —— 把 SQL 语句翻译成对原生 HTTP server 的 REST 请求

业务代码（Service、Repository）不需要关心运行在哪个平台——`DatabaseServiceFacade` 接口两边一致。

平台相关的初始化也用 `*.native.ts(x)` / `*.web.ts(x)` 文件分离：
- `hooks/useDatabaseSetup.native.ts` —— 初始化 expo-sqlite + 建表
- `hooks/useDatabaseSetup.web.ts` —— 从 URL `?token=` 取 token、连 REST
- `components/common/DatabaseProviders.{native,web}.tsx` —— 平台专属的 Provider 包装

`metro.config.js` 给 `expo-sqlite` 加了别名：Web 打包时所有 `require('expo-sqlite')` 都被替换成 `web/expo-sqlite.web.stub.js`（一个 no-op 桩），保证 Web bundle 里不会带原生模块。

## Web 模式 (LAN 访问)

应用内置一个轻量级 HTTP server（Kotlin + NanoHTTPD），跑在 Android 进程里，把 APK 内嵌的 Expo Web 产物（`assets/web/`）通过 LAN 暴露给同 Wi-Fi 的浏览器。浏览器侧的 SQL 操作被翻译成 REST 请求，写入**同一份 SQLite 文件**。

### 关键文件

| 路径 | 角色 |
|---|---|
| `android/app/src/main/java/.../webserver/FinanceHttpServer.kt` | NanoHTTPD 服务器，路由 /api/* 到 SQLite，路由 /* 到 assets/web/ |
| `android/app/src/main/java/.../webserver/Database.kt` | 共享数据库 helper（与原生 DatabaseService 读同一份文件） |
| `android/app/src/main/java/.../webserver/Schemas.kt` | 表 DDL（与 TypeScript Schemas 一一对应，schema version 5） |
| `android/app/src/main/java/.../webserver/WebServerModule.kt` | React Native 原生模块封装（`FinanceWebServer.start/stop/getConfig`） |
| `web/api/ApiClient.ts` | Web 侧 HTTP 客户端，自动注入 Bearer token |
| `web/api/endpoints.ts` | 类型化 REST 端点（AccountsApi、TransactionsApi 等） |
| `services/database/web/WebDatabase.ts` | SQL → REST 翻译器（实现 `DatabaseServiceFacade`） |

### REST 端点

```
GET    /api/health
GET    /api/accounts
GET    /api/accounts/:id
POST   /api/accounts
PUT    /api/accounts/:id
DELETE /api/accounts/:id
GET    /api/categories
... (transactions, budgets, goals, account-monthly-balances, etc.)
GET    /api/schema                        // 返回表 DDL
```

所有 `/api/*` 端点都要求请求带 `Authorization: Bearer <token>` 或 `?token=<token>` 查询参数（token 在 Options → Web 模式 打开时一次性生成）。

### 构建产物

APK 内嵌的 Web 产物路径：`android/app/src/main/assets/web/`

构建流程：
1. `npx expo export --platform web` → 生成 `dist/`
2. Gradle 的 `copyWebBundle` task 在 `mergeReleaseAssets` / `mergeDebugAssets` 之前把 `dist/` 拷进 `src/main/assets/web/`
3. APK 打包时这些文件随 assets 一起入包

详见 `docs/DEBUG.md` 的「When do I need to rebuild the web bundle?」一节。

## 各层职责

### 1. UI Layer (表现层)

**位置：** `app/` 和 `components/`

- 函数式组件 + Hooks
- 原子化组件设计
- 路由使用 Expo Router

### 2. Context Layer (上下文层)

**位置：** `contexts/FinanceContext.tsx`

**提供的状态：**
- `transactions` - 交易列表
- `categories` - 分类列表
- `budgets` - 预算列表
- `accounts` - 账户列表
- `accountMonthlyBalances` - 账户月度余额记录

### 3. Service Layer (服务层)

**位置：** `services/business/`

封装业务逻辑，提供清晰的数据操作接口。Service 拿 `DatabaseServiceFacade`，所以一份代码两边跑。

**主要服务：**
- `TransactionService` - 交易业务逻辑
- `BudgetService` - 预算业务逻辑
- `CategoryService` - 分类业务逻辑
- `AccountService` - 账户业务逻辑
- `AccountMonthlyBalanceService` - 账户月度余额业务逻辑

### 4. Repository Layer (数据访问层)

**位置：** `services/database/repositories/`

封装数据访问逻辑，提供 CRUD 操作。Repository 接受 `DatabaseServiceFacade`，**`{ native, web }` 两边都使用同一份代码**。

**主要仓库：**
- `BaseRepository` - 基础仓库，提供通用 CRUD
- `TransactionRepository` - 交易数据访问
- `BudgetRepository` - 预算数据访问
- `CategoryRepository` - 分类数据访问
- `AccountRepository` - 账户数据访问
- `AccountMonthlyBalanceRepository` - 账户月度余额数据访问

### 5. Database Layer (数据库层)

**位置：** `services/database/`

平台分叉的两套实现：
- `DatabaseService.ts` (原生) —— 包 `expo-sqlite`
- `web/WebDatabase.ts` (Web) —— SQL → REST 翻译器
- `index.ts` —— `getDatabaseService()` 平台解析器
- `schemas/` —— 各表结构定义 + SQL 查询模板

## 数据流程

### 添加交易流程（原生）

```
用户界面 → FinanceContext.addTransaction()
         → TransactionService.create()
         → TransactionRepository.insert()
         → DatabaseService.execute() (expo-sqlite)
         → SQLite Database
```

### 添加交易流程（Web 模式）

```
浏览器 UI → 同一份 TransactionService.create()
         → 同一份 TransactionRepository.insert()
         → WebDatabase.executeQuery() (SQL → REST 翻译)
         → fetch('POST /api/transactions')
         → FinanceHttpServer (Kotlin)
         → 同一份 SQLite Database
```

**两边共享同一份 `FinanceManager.db`，所以原生写的浏览器刷新就能看见，浏览器写的原生立刻能看见。**

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
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: number, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  // ... 其他方法
}
```

## 关键设计模式

### 1. Repository Pattern

每个数据实体对应一个 Repository，封装所有数据访问逻辑：

```typescript
interface IRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: number): Promise<T | null>;
  insert(data: Omit<T, 'id'>): Promise<number>;
  update(id: number, data: Partial<T>): Promise<void>;
  delete(id: number): Promise<void>;
}
```

### 2. Service Layer Pattern

业务逻辑封装在 Service 层，UI 层不直接访问 Repository：

```typescript
class TransactionService {
  async create(data: CreateTransactionDTO): Promise<Transaction> {
    await this.validateBudget(data);
    return this.repository.insert(data);
  }
}
```

### 3. Schema + Queries Pattern

数据库表结构定义和 SQL 查询分离：

```typescript
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

### 4. Platform Resolver (新增)

通过 `Platform.OS` 在运行时挑不同的实现，业务层对平台无感：

```typescript
// services/database/index.ts
let _instance: DatabaseServiceFacade | null = null;

export const getDatabaseService = (): DatabaseServiceFacade => {
  if (!_instance) {
    _instance = Platform.OS === 'web'
      ? require('./web/WebDatabase').webDatabase
      : require('./DatabaseService').databaseService;
  }
  return _instance;
};
```

## 依赖关系

```
┌──────────────┐    UI Layer
└──────┬───────┘
       │
┌──────▼───────┐    Context
└──────┬───────┘
       │
┌──────▼───────┐    Services
└──────┬───────┘
       │
┌──────▼───────┐    Repository
└──────┬───────┘
       │
┌──────▼───────┐    DatabaseServiceFacade (接口)
└──────┬───────┘
       │
   ┌───┴────┐
   │        │
┌──▼──┐  ┌──▼──┐
│native│  │ web │  ← 平台分叉
└──┬──┘  └──┬──┘
   │        │
   │     ┌──▼────────────┐
   │     │ HTTP /api/*    │
   └──┐  │ FinanceServer  │  (Web 模式)
      │  └──────┬─────────┘
      ▼         ▼
   ┌──────────────┐
   │  SQLite DB   │  同一份
   └──────────────┘
```

**重要：** UI → Context → Service → Repository → DatabaseServiceFacade 全部是平台无关的；只有 `DatabaseServiceFacade` 这一层做平台分叉，Web 模式通过 HTTP server 回到同一份 SQLite。
