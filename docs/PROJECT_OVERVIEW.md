# 项目概述

## 项目简介

这是一个基于 React Native (Expo) 构建的离线财务管理应用，支持追踪日常收支、管理预算、分类支出等功能。

**技术栈：**
- **前端框架：** React Native + Expo
- **状态管理：** React Context
- **数据库：** SQLite (expo-sqlite)
- **架构模式：** 领域驱动设计 (DDD)

## 核心功能

### 1. 交易管理
- 记录日常收入和支出
- 按日期、金额、分类筛选
- 交易历史记录和统计

### 2. 预算管理
- 设置月度预算
- 按分类设置预算限额
- 实时监控预算使用情况
- 预算超支提醒

### 3. 账户管理
- 支持多账户（现金、银行账户、数字钱包等）
- 账户余额跟踪
- 账户间转账

### 4. 分类管理
- 自定义收入和支出分类
- 分类图标和颜色设置

### 5. 数据可视化
- 周度支出趋势图表
- 分类支出占比分析
- 预算执行情况图表

### 6. 银行余额跟踪
- 记录每月银行账户余额
- 计算实际储蓄

## 离线优先设计

应用设计为完全离线运行：
- 所有数据存储在本地 SQLite 数据库
- 不需要网络连接
- 数据隐私安全

## 目录结构

```
Finance-Management-App/
├── app/                    # 页面组件
│   ├── (tabs)/            # 底部导航页面
│   │   ├── index.tsx      # 主页
│   │   ├── add.tsx        # 添加交易
│   │   ├── details.tsx    # 交易详情
│   │   ├── reports.tsx    # 报表
│   │   ├── accounts.tsx   # 账户
│   │   ├── goals.tsx      # 目标
│   │   └── settings.tsx   # 设置
│   ├── transaction/        # 交易页面
│   ├── budget/            # 预算页面
│   ├── reports/           # 报表页面
│   └── debug/             # 调试页面
├── components/            # 可复用组件
├── services/              # 服务层
│   ├── business/          # 业务逻辑
│   └── database/          # 数据库服务
│       ├── schemas/       # 表结构定义
│       ├── repositories/ # 数据访问层
│       └── DatabaseService.ts
├── contexts/             # React Context
├── hooks/                # 自定义 Hooks
├── assets/               # 静态资源
│   └── fonts/            # 字体
├── scripts/              # 工具脚本
│   └── import_finance_xlsx.py  # XLSX导入工具
└── theme/                 # 主题配置
```

## 数据文件

### XLSX 文件命名规则

`finance_record_YY_S.xlsx`
- `YY` = 年份后两位（25 = 2025, 26 = 2026）
- `S` = 季度（1 = Q1 Jan-Mar, 2 = Q2 Apr-Jun, 3 = Q3 Jul-Sep, 4 = Q4 Oct-Dec）

示例：
- `finance_record_25_1.xlsx` - 2025年Q1 (1月-3月)
- `finance_record_25_2.xlsx` - 2025年Q2 (4月-6月)

### XLSX 内部结构

每个文件包含：
- `param` - 分类表
- `YYMM_full` - 该月完整交易记录
- `YYMM_rep` - 该月报表（含预算和银行余额）

### 导入数据库

运行导入脚本后生成：
- `finance_imported.db` - 导入后的 SQLite 数据库

### 现有数据库

- `FinanceManager.db` - 应用运行时数据库
