# 开发指南

## 项目结构

```
finance-manager/
├── app/                    # 主应用代码
│   ├── (tabs)/            # 底部导航栏页面
│   ├── _layout.tsx        # 根布局组件
│   └── ...                # 其他页面
├── components/            # 可复用组件
│   ├── base/             # 基础组件
│   ├── common/           # 通用组件
│   ├── finance/          # 财务相关组件
│   ├── layout/           # 布局组件
│   └── settings/         # 设置相关组件
├── contexts/             # React Context
│   └── FinanceContext.tsx
├── hooks/                # 自定义 Hooks
│   ├── useDatabaseSetup.ts
│   ├── useDatabaseEvent.ts
│   └── ...
├── services/             # 服务层
│   ├── business/         # 业务逻辑服务
│   │   ├── TransactionService.ts
│   │   ├── BudgetService.ts
│   │   └── ...
│   └── database/         # 数据库服务
│       ├── schemas/      # 数据库表结构
│       ├── repositories/ # 数据访问层
│       └── ...
└── assets/              # 静态资源
```

## 代码组织原则

### common commands

```bash
npx expo prebuild
npm run android

cd android
./gradlew clean
./gradlew assembleRelease

```
### 1. 组件设计
- 遵循单一职责原则
- 使用组合而非继承
- 保持组件可复用性
- 示例：创建新组件

```typescript
// components/NewComponent.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/base/Text';

interface NewComponentProps {
  // 定义组件属性
  title: string;
  onPress?: () => void;
}

export function NewComponent({ title, onPress }: NewComponentProps) {
  return (
    <View style={styles.container}>
      <Text>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // 样式定义
  }
});
```

### 2. 数据库设计
- 使用 SQLite 作为本地数据库
- 遵循数据库规范化原则
- 示例：添加新表

```typescript
// services/database/schemas/NewTable.ts
import { SQLiteDatabase } from 'expo-sqlite';

export const NewTableSchema = {
  name: 'new_table',
  columns: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    name: 'TEXT NOT NULL',
    value: 'REAL',
    created_at: 'TEXT DEFAULT CURRENT_TIMESTAMP'
  }
};

export const NewTableQueries = {
  create: `CREATE TABLE IF NOT EXISTS ${NewTableSchema.name} (
    ${Object.entries(NewTableSchema.columns)
      .map(([key, value]) => `${key} ${value}`)
      .join(',\n    ')}
  )`,
  
  insert: `INSERT INTO ${NewTableSchema.name} (name, value) VALUES (?, ?)`,
  
  selectAll: `SELECT * FROM ${NewTableSchema.name}`
};
```

### 3. 业务逻辑
- 服务层处理业务逻辑
- 使用依赖注入
- 示例：创建新服务

```typescript
// services/business/NewService.ts
import { DatabaseService } from '@/services/database/DatabaseService';

export class NewService {
  constructor(private databaseService: DatabaseService) {}

  async createItem(name: string, value: number) {
    return this.databaseService.executeQuery(
      NewTableQueries.insert,
      [name, value]
    );
  }

  async getItems() {
    return this.databaseService.executeQuery(NewTableQueries.selectAll);
  }
}
```

### 4. Hooks 使用
- 使用自定义 Hooks 管理状态和副作用
- 示例：创建新 Hook

```typescript
// hooks/useNewFeature.ts
import { useState, useEffect } from 'react';
import { NewService } from '@/services/business/NewService';
import { useDatabaseSetup } from './useDatabaseSetup';

export function useNewFeature() {
  const { databaseService } = useDatabaseSetup();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!databaseService) return;
    
    const service = new NewService(databaseService);
    loadItems(service);
  }, [databaseService]);

  const loadItems = async (service: NewService) => {
    try {
      setIsLoading(true);
      const result = await service.getItems();
      setItems(result.rows._array);
    } finally {
      setIsLoading(false);
    }
  };

  return { items, isLoading };
}
```

## 开发环境设置

### 1. 安装依赖
```bash
# 安装项目依赖
npm install

# 安装 React Native CLI（如果使用 React Native 命令）
npm install --save-dev @react-native-community/cli
```

### 2. 启动开发服务器
```bash
# 直接运行 Android 开发版本
npx expo run:android

# 清理并重新构建
cd android && ./gradlew clean && cd .. && npx expo prebuild --clean && npx expo run:android

# 启动开发服务器
npx expo start
npm start
npm run start:clear
```

### 3. 运行在设备上
- Android: 按 'a' 键
- iOS: 按 'i' 键
- 或扫描二维码使用 Expo Go

### 4. 开发环境要求

#### 1. 基础开发工具
- Node.js: v20.14.0
- npm: v10.7.0
- Yarn: v1.22.0 或更高版本（可选）

#### 2. Android 开发环境
- JDK: OpenJDK 17.0.14
- Gradle: 8.10.2
- Kotlin: 1.9.24
- Android Studio: 2022.3.1 (Giraffe) 或更高版本
- Android SDK:
  - Android SDK Platform 35
  - Android SDK Build-Tools 35.0.0
  - Android SDK Command-line Tools
  - Android Emulator
  - Android SDK Platform-Tools
- Android Debug Bridge: 1.0.41
- 环境变量设置：
  ```bash
  # 在 ~/.bashrc 或 ~/.zshrc 中添加
  export ANDROID_HOME=$HOME/Android/Sdk
  export PATH=$PATH:$ANDROID_HOME/emulator
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  export PATH=$PATH:$ANDROID_HOME/tools
  export PATH=$PATH:$ANDROID_HOME/tools/bin
  ```

#### 3. iOS 开发环境 (macOS 用户)
- Xcode: 14.0 或更高版本
- CocoaPods: 1.12.0 或更高版本
- iOS 模拟器: iOS 16.0 或更高版本

#### 4. React Native 相关
- React Native: 0.76.9
- Expo SDK: 52.0.46
- React Navigation: 7.2.0
- React: 18.3.1
- @react-native-community/cli: latest (必需用于 React Native CLI 命令)

#### 5. 数据库工具
- SQLite: 3.40.0 或更高版本
- expo-sqlite: 15.1.4

#### 6. 开发工具
- VS Code 或 WebStorm
- 推荐 VS Code 插件：
  - ESLint
  - Prettier
  - React Native Tools
  - TypeScript and JavaScript Language Features
  - SQLite Viewer

#### 7. 检查环境配置
```bash
# 检查 Node.js 版本
node -v

# 检查 npm 版本
npm -v

# 检查 JDK 版本
java -version

# 检查 Android SDK 版本
adb --version

# 检查 React Native 环境
npx react-native doctor
```

#### 8. 常见问题解决
1. Android SDK 找不到
   - 确保 ANDROID_HOME 环境变量正确设置
   - 在 Android Studio 中安装所需的 SDK 版本

2. JDK 版本不兼容
   - 使用 OpenJDK 17 或更高版本
   - 确保 JAVA_HOME 环境变量指向正确的 JDK 安装路径

3. iOS 构建失败
   - 确保 Xcode 命令行工具已安装
   - 运行 `sudo xcode-select --switch /Applications/Xcode.app`

4. 依赖安装失败
   - 清除 npm 缓存：`npm cache clean --force`
   - 删除 node_modules：`rm -rf node_modules`
   - 重新安装：`npm install`

### 4. 常见问题解决

#### 1. 白屏问题（React Native SVG 相关）
如果遇到白屏问题，可能是由于 react-native-svg 的问题，尝试以下解决方案：

```bash
# 安装 react-native-svg
npx expo install react-native-svg

# 清理项目并重新构建
cd android && ./gradlew clean && cd .. && npx expo prebuild --clean && npx expo run:android
```

#### 2. 调试命令
```bash
# 查看设备日志
adb -s <device-id> logcat | grep -E "ReactNative|ReactNativeJS|AndroidRuntime"

# 安装 APK
adb -s <device-id> install -r app/build/outputs/apk/release/app-release-aligned-align.apk
```

#### 3. APK 签名和优化
```bash
# 签名 APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore app/finance-manager.keystore app/build/outputs/apk/release/app-release-aligned.apk finance-manager

# 验证签名
jarsigner -verify -verbose -certs app/build/outputs/apk/release/app-release-aligned.apk

# 优化 APK
zipalign -v 4 app/build/outputs/apk/release/app-release-aligned.apk app/build/outputs/apk/release/app-release-aligned-align.apk
zipalign -v 4 app/build/outputs/apk/release/app-release.apk app/build/outputs/apk/release/app-release-aligned.apk
```

## 构建发布版本

### 1. 本地构建 (Android)

#### 1.1 准备签名文件
1. 生成 keystore 文件：
```bash
cd android/app
keytool -genkey -v -keystore finance-manager.keystore -alias finance-manager -keyalg RSA -keysize 2048 -validity 10000
```

2. 创建 keystore.properties 文件（在 android 目录下）：
```properties
MYAPP_RELEASE_STORE_FILE=finance-manager.keystore
MYAPP_RELEASE_KEY_ALIAS=finance-manager
MYAPP_RELEASE_STORE_PASSWORD=你的密码
MYAPP_RELEASE_KEY_PASSWORD=你的密码
```

3. 确保 keystore 文件位于 `android/app/finance-manager.keystore`

#### 1.2 构建 Release APK
```bash
# 清理项目
cd android
./gradlew clean

# 生成 Release APK
./gradlew assembleRelease
```

生成的 APK 文件位置：
```
android/app/build/outputs/apk/release/app-release.apk
```

### 2. 使用 Gradle 构建 (Android)
```bash
# 生成开发版本
cd android
./gradlew assembleDebug

# 生成发布版本
./gradlew assembleRelease

# 安装到设备
./gradlew installDebug  # 开发版本
./gradlew installRelease  # 发布版本
```

### 3. 使用 EAS 构建 (可选)
```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录 EAS
eas login

# 配置构建
eas build:configure

# 构建 APK
eas build --platform android

# 构建 iOS
eas build --platform ios
```

### 4. 使用 Expo 构建
```bash
# 生成开发版本
npx expo prebuild

# 构建 Android
cd android
./gradlew assembleDebug

# 构建 iOS
cd ios
pod install
xcodebuild -workspace YourApp.xcworkspace -scheme YourApp -configuration Release
```

### 5. 构建配置说明

#### Android 配置
- 修改 `android/app/build.gradle` 中的版本信息
- 配置签名信息在 `android/app/keystore.properties`
- 调整 `android/app/src/main/AndroidManifest.xml` 中的权限

#### iOS 配置
- 修改 `ios/YourApp/Info.plist` 中的配置
- 在 Xcode 中配置证书和描述文件
- 调整 `ios/YourApp.xcodeproj/project.pbxproj` 中的构建设置

### 6. 发布到应用商店

#### Android (Google Play)
1. 生成签名 APK
```bash
cd android
./gradlew bundleRelease
```

2. 使用 Android Studio 生成签名 APK
3. 上传到 Google Play Console

#### iOS (App Store)
1. 使用 Xcode 构建发布版本
2. 使用 Application Loader 上传到 App Store Connect
3. 在 App Store Connect 中提交审核

### 7. 版本管理
- 遵循语义化版本控制 (SemVer)
- 在 `package.json` 中更新版本号
- 同步更新 Android 和 iOS 的版本号

## 测试

### 1. 运行测试
```bash
npm test
```

### 2. 代码检查
```bash
npm run lint
```

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 最佳实践

1. 代码风格
   - 使用 TypeScript
   - 遵循 ESLint 规则
   - 使用 Prettier 格式化

2. 性能优化
   - 使用 React.memo 优化渲染
   - 避免不必要的重渲染
   - 使用 useMemo 和 useCallback

3. 错误处理
   - 使用 try-catch 处理异步操作
   - 提供有意义的错误信息
   - 实现错误边界

4. 安全性
   - 避免硬编码敏感信息
   - 验证用户输入
   - 使用参数化查询

## 常见问题

1. 数据库迁移
   - 使用版本控制
   - 保持向后兼容
   - 测试迁移脚本

2. 状态管理
   - 使用 Context API
   - 避免过度使用全局状态
   - 考虑使用 Redux（如果需要）

3. 性能问题
   - 使用性能分析工具
   - 优化大型列表渲染
   - 减少不必要的重渲染 
