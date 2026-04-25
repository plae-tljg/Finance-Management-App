# 财务管理应用 - 项目文档

## 目录

1. [项目概述](./PROJECT_OVERVIEW.md) - 项目简介、功能特性、目录结构
2. [技术架构](./ARCHITECTURE.md) - 三层架构设计、数据流程、关键模式
3. [数据库设计](./DATABASE.md) - 表结构、ER图、SQL查询示例、XLSX映射
4. [XLSX 数据导入工具](./XLSX_IMPORT.md) - 使用方法、处理逻辑、故障排除
5. [开发指南](./DEVELOPMENT.md) - 环境搭建、代码组织、常用命令
6. [API 参考](./API_REFERENCE.md) - 所有服务、Context、Repository 接口

## 快速开始

### 1. 启动开发服务器

```bash
npm install
npx expo start
```

### 2. 运行 Android

```bash
npm run android
```

### 3. 导入历史数据

```bash
python3 scripts/import_finance_xlsx.py
# 输出: finance_imported.db
```

### 4. 使用导入的数据

```bash
# 备份原数据库
cp FinanceManager.db FinanceManager.db.backup

# 替换为导入的数据库
cp finance_imported.db FinanceManager.db
```

## 快速链接

- [README](../README.md) - 项目简介
- [DEVELOPMENT](../DEVELOPMENT.md) - 原始开发指南
- [finance_imported.db](../finance_imported.db) - 最新导入的测试数据
