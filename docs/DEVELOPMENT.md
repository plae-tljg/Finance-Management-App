# 开发指南

## 环境搭建

### 必要条件

- Node.js >= 18
- npm 或 yarn
- Python >= 3.10 (用于 XLSX 导入脚本)
- Android Studio (用于 Android 构建)
- Xcode (用于 iOS 构建，仅 macOS)

### 安装步骤

```bash
# 克隆项目
git clone <repository-url>
cd Finance-Management-App

# 安装依赖
npm install

# 启动开发服务器
npx expo start
```

### Android 构建

```bash
# 生成原生 Android 项目
npx expo prebuild --platform android

# 进入 Android 目录
cd android

# 构建 Debug APK
./gradlew assembleDebug

# 构建 Release APK
./gradlew assembleRelease

> **Note:** 如果构建失败并提示 `Keystore file not found`，请检查 `app/build.gradle` 中的 `signingConfigs.release.storeFile` 路径是否正确指向您的 keystore 文件位置。该路径应为绝对路径，且每位开发者可能不同。
```

### iOS 构建 (仅 macOS)

```bash
# 生成原生 iOS 项目
npx expo prebuild --platform ios

# 构建
xcodebuild -workspace ios/*.xcworkspace -scheme <scheme> -configuration Release -archive
```

## 项目结构

```
Finance-Management-App/
├── app/                    # 页面组件 (使用 Expo Router)
│   ├── (tabs)/            # 底部导航栏页面
│   │   ├── index.tsx      # 主页
│   │   ├── add.tsx        # 添加交易
│   │   ├── details.tsx    # 交易详情
│   │   ├── reports.tsx    # 报表
│   │   ├── accounts.tsx   # 账户
│   │   ├── goals.tsx      # 目标
│   │   └── settings.tsx   # 设置
│   ├── _layout.tsx        # 根布局
│   └── ...                # 其他页面
├── components/            # 可复用组件
│   ├── base/             # 基础组件 (Text, Button 等)
│   ├── common/           # 通用组件
│   ├── finance/          # 财务组件
│   ├── layout/           # 布局组件
│   └── settings/         # 设置组件
├── services/              # 服务层
│   ├── business/          # 业务逻辑服务
│   │   ├── TransactionService.ts
│   │   ├── BudgetService.ts
│   │   ├── CategoryService.ts
│   │   ├── AccountService.ts
│   │   └── BankBalanceService.ts
│   └── database/          # 数据库服务
│       ├── DatabaseService.ts
│       ├── schemas/        # 表结构定义
│       │   ├── Transaction.ts
│       │   ├── Budget.ts
│       │   ├── Category.ts
│       │   ├── Account.ts
│       │   └── BankBalance.ts
│       └── repositories/   # 数据访问层
│           ├── BaseRepository.ts
│           ├── TransactionRepository.ts
│           └── ...
├── contexts/             # React Context
│   └── FinanceContext.tsx
├── hooks/                # 自定义 Hooks
│   ├── useDatabaseSetup.ts
│   ├── useServiceLocator.ts
│   └── ...
├── assets/               # 静态资源
│   ├── fonts/           # 字体
│   ├── images/          # 图片
│   └── *.xlsx           # 财务数据文件
├── scripts/              # 工具脚本
│   └── import_finance_xlsx.py  # XLSX 导入工具
├── theme/                # 主题配置
└── docs/                 # 文档
```

## 代码组织原则

### 1. 组件设计

- 遵循单一职责原则
- 使用组合而非继承
- 保持组件可复用性
- 组件放在 `components/` 对应目录下

**创建新组件示例：**

```typescript
// components/finance/MyComponent.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/base/Text';

interface MyComponentProps {
  title: string;
  onPress?: () => void;
}

export function MyComponent({ title, onPress }: MyComponentProps) {
  return (
    <View style={styles.container}>
      <Text>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
```

### 2. 服务层

业务逻辑放在 `services/business/` 目录下。

**创建新服务示例：**

```typescript
// services/business/MyService.ts
import { MyRepository } from '../database/repositories/MyRepository';

export class MyService {
  private repository: MyRepository;

  constructor(repository: MyRepository) {
    this.repository = repository;
  }

  async getAll() {
    return this.repository.findAll();
  }

  async create(data: CreateDTO) {
    // 业务校验
    await this.validate(data);
    // 调用仓库
    return this.repository.insert(data);
  }
}
```

### 3. 数据仓库

数据访问逻辑放在 `services/database/repositories/` 目录下。

**创建新仓库示例：**

```typescript
// services/database/repositories/MyRepository.ts
import { BaseRepository } from './BaseRepository';
import { MySchema, MyQueries } from '../schemas/MySchema';

export class MyRepository extends BaseRepository<MyEntity> {
  constructor(db: SQLiteDatabase) {
    super(db, MySchema, MyQueries);
  }
}
```

### 4. 数据库 Schema

每个表对应一个 Schema 文件。

**创建新 Schema 示例：**

```typescript
// services/database/schemas/MySchema.ts
export interface MyEntity {
  id: number;
  name: string;
  value: number;
  createdAt: string;
  updatedAt: string;
}

export const MySchema = {
  name: 'my_table',
  columns: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    name: 'TEXT NOT NULL',
    value: 'REAL',
    createdAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    updatedAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
  },
};

export const MyQueries = {
  CREATE_TABLE: `CREATE TABLE IF NOT EXISTS my_table (...)`,
  INSERT: `INSERT INTO my_table (name, value) VALUES (?, ?)`,
  // ...
};
```

## 常用命令

```bash
# 开发
npm run android          # 启动 Android
npm run ios              # 启动 iOS
npx expo start           # 启动 Expo 开发服务器

# 构建
npx expo prebuild        # 生成原生项目
npm run android:build    # 构建 Android
npm run ios:build        # 构建 iOS

# 测试
npm test                 # 运行测试
npm run lint             # 运行 lint
npm run typecheck        # 类型检查
```

## 数据库操作

### 初始化数据库

数据库在应用启动时自动初始化，通过 `DatabaseService.initialize()` 完成：

```typescript
// services/database/DatabaseService.ts
async initialize() {
  await this.createTablesIfNeeded();
  await this.insertDefaultData();
}
```

### 执行 SQL

```typescript
const result = await databaseService.execute(query, params);
const rows = await databaseService.query(query, params);
```

## 添加新功能流程

### 1. 定义数据模型

```typescript
// services/database/schemas/NewModel.ts
export interface NewModel {
  id: number;
  // ...
}
```

### 2. 创建 Repository

```typescript
// services/database/repositories/NewModelRepository.ts
export class NewModelRepository extends BaseRepository<NewModel> {
  // ...
}
```

### 3. 创建 Service

```typescript
// services/business/NewModelService.ts
export class NewModelService {
  // ...
}
```

### 4. 在 Context 中注册

```typescript
// contexts/FinanceContext.tsx
const newModelService = new NewModelService(newModelRepository);
```

### 5. 创建 UI 页面

```typescript
// app/new-model/index.tsx
export default function NewModelScreen() {
  // ...
}
```

## 测试

### 运行测试

```bash
npm test
```

### 测试数据库操作

应用提供了 SQL Terminal 调试页面，可以直接执行 SQL：

1. 进入应用 -> 调试页面
2. 使用 SQL Terminal
3. 执行查询验证

```sql
-- 示例查询
SELECT * FROM transactions ORDER BY date DESC LIMIT 10;
```

## 调试

### 查看数据库内容

```bash
sqlite3 FinanceManager.db "SELECT * FROM categories;"
```

### 导出数据

```bash
sqlite3 FinanceManager.db ".mode csv" ".output export.csv" "SELECT * FROM transactions;" ".output stdout"
```

### 导入测试数据

```bash
sqlite3 FinanceManager.db < test_data.sql
```

## 性能优化

### 批量操作

对于大量数据插入，使用事务：

```typescript
await databaseService.execute('BEGIN TRANSACTION');
try {
  for (const item of items) {
    await repository.insert(item);
  }
  await databaseService.execute('COMMIT');
} catch (e) {
  await databaseService.execute('ROLLBACK');
}
```

### 索引

确保常用查询字段已建立索引：

```sql
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_categoryId ON transactions(categoryId);
```

## 常见问题

### Q: 数据库不工作？

1. 检查 `expo-sqlite` 是否正确安装
2. 确认数据库文件路径正确
3. 查看 Log Viewer 中的错误日志

### Q: 数据不显示？

1. 检查 Context 是否正确初始化
2. 确认 Service 方法返回正确数据
3. 使用 SQL Terminal 直接查询数据库验证

### Q: 构建失败？

1. 运行 `npx expo prebuild` 清理并重新生成原生项目
2. 检查 `android/` 或 `ios/` 目录是否有冲突文件
3. 确认 Gradle/Xcode 版本兼容

### Q: 闪屏屏幕图片不更新？

如果修改了 `app.json` 中的 `expo-splash-screen` 配置后，闪屏图片仍然显示旧的图片，需要手动同步 Android 资源：

```bash
# 方案一：完全清理后重新生成
rm -rf android ios
npx expo prebuild --clean
npx expo run:android

# 方案二：手动复制图片到各 density 文件夹
# 将你的闪屏图片复制到所有 drawable-* 目录（确保命名一致）
for dir in hdpi mdpi xhdpi xxhdpi xxxhdpi; do
  cp ./assets/images/your-splash.png android/app/src/main/res/drawable-$dir/splashscreen_logo.png
done
npx expo run:android
```

注意：使用 `expo-dev-client` 时，闪屏配置可能存在已知问题，建议同时在 `app.json` 中添加 `androidStatusBarTranslucent: false` 配置。

### Q: 应用名称显示有下划线？

如果应用在设备上显示为 "finance_manager" 而不是 "Finance Manager"，需要修改原生资源文件：

**Android:**
```bash
# 修改 android/app/src/main/res/values/strings.xml
<string name="app_name">Finance Manager</string>
```

**iOS:**
```bash
# 修改 ios/financemanager/Info.plist 中的 CFBundleDisplayName
<key>CFBundleDisplayName</key>
<string>Finance Manager</string>
```

修改后需要重新构建应用才能生效。

## 应用发布

### 构建 Release APK

1. 确保 `android/app/build.gradle` 中的签名配置正确
2. 执行构建：
```bash
cd android
./gradlew assembleRelease
```

### 应用名称与图标

- 应用名称在 `app.json` 的 `expo.name` 和 `android/app/src/main/res/values/strings.xml` 中定义
- 应用图标在 `app.json` 的 `expo.icon` 中配置
- Android 自适应图标在 `expo.android.adaptiveIcon` 中配置
