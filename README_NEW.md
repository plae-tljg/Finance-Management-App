# Finance Management App

基于 React Native 的财务管理应用，采用领域驱动设计(DDD)架构。

## 项目结构

```
src/
├── domain/                 # 领域层
│   ├── entities/          # 领域实体
│   ├── value-objects/     # 值对象
│   ├── repositories/      # 仓储接口
│   └── services/         # 领域服务
├── application/           # 应用层
│   ├── use-cases/        # 用例
│   └── dtos/             # 数据传输对象
├── infrastructure/        # 基础设施层
│   ├── repositories/     # 仓储实现
│   ├── services/        # 外部服务实现
│   └── databases/       # 数据库配置
└── presentation/         # 表现层
    ├── screens/         # 屏幕组件
    ├── components/      # 可复用组件
    └── navigation/      # 导航配置
```

## 领域模型设计

### 核心实体

1. Transaction（交易）
   - id: string
   - amount: number
   - type: 'income' | 'expense'
   - category: string
   - date: Date
   - description: string
   - accountId: string

2. Account（账户）
   - id: string
   - name: string
   - type: 'cash' | 'bank' | 'credit'
   - balance: number
   - currency: string

3. Category（分类）
   - id: string
   - name: string
   - type: 'income' | 'expense'
   - icon: string
   - color: string

4. Budget（预算）
   - id: string
   - categoryId: string
   - amount: number
   - period: 'daily' | 'weekly' | 'monthly' | 'yearly'
   - startDate: Date
   - endDate: Date

### 值对象

1. Money
   - amount: number
   - currency: string

2. DateRange
   - startDate: Date
   - endDate: Date

### 领域服务

1. TransactionService
   - 处理交易相关的业务逻辑
   - 计算账户余额
   - 验证交易有效性

2. BudgetService
   - 预算管理
   - 预算使用情况追踪
   - 预算提醒

3. ReportService
   - 生成财务报表
   - 数据分析
   - 趋势预测

## 数据库设计

使用 SQLite 作为本地数据库，主要表结构如下：

1. transactions
   ```sql
   CREATE TABLE transactions (
     id TEXT PRIMARY KEY,
     amount REAL NOT NULL,
     type TEXT NOT NULL,
     category_id TEXT NOT NULL,
     account_id TEXT NOT NULL,
     date TEXT NOT NULL,
     description TEXT,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL,
     FOREIGN KEY (category_id) REFERENCES categories(id),
     FOREIGN KEY (account_id) REFERENCES accounts(id)
   );
   ```

2. accounts
   ```sql
   CREATE TABLE accounts (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     type TEXT NOT NULL,
     balance REAL NOT NULL,
     currency TEXT NOT NULL,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL
   );
   ```

3. categories
   ```sql
   CREATE TABLE categories (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     type TEXT NOT NULL,
     icon TEXT NOT NULL,
     color TEXT NOT NULL,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL
   );
   ```

4. budgets
   ```sql
   CREATE TABLE budgets (
     id TEXT PRIMARY KEY,
     category_id TEXT NOT NULL,
     amount REAL NOT NULL,
     period TEXT NOT NULL,
     start_date TEXT NOT NULL,
     end_date TEXT NOT NULL,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL,
     FOREIGN KEY (category_id) REFERENCES categories(id)
   );
   ```

## 技术栈

- React Native
- TypeScript
- SQLite
- React Navigation
- Redux Toolkit
- React Native Paper (UI 组件库)
- React Native Vector Icons
- React Native Charts (数据可视化)

## 开发指南

1. 安装依赖
   ```bash
   npm install
   ```

2. 运行项目
   ```bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   ```

3. 开发规范
   - 遵循 DDD 架构原则
   - 使用 TypeScript 类型系统
   - 编写单元测试
   - 使用 ESLint 和 Prettier 保持代码风格一致 