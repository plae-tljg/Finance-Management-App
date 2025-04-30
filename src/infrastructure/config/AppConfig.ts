import { Platform } from 'react-native';
import SQLite from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';

export interface DatabaseConfig {
  name: string;
  version: number;
  location: SQLite.Location;
  targetPath: string;
}

export class AppConfig {
  private static readonly DB_NAME = 'finance_management.db';

  // 数据库配置
  static readonly DATABASE: DatabaseConfig = {
    name: AppConfig.DB_NAME,
    version: 1,
    location: 'default',
    // 在 Android 上使用外部存储路径
    targetPath: Platform.OS === 'android' 
      ? `${RNFS.ExternalDirectoryPath}/${AppConfig.DB_NAME}`
      : `${RNFS.DocumentDirectoryPath}/${AppConfig.DB_NAME}`
  };

  // 应用主题
  static readonly THEME = {
    PRIMARY_COLOR: '#f4511e',
    BACKGROUND_COLOR: '#F5FCFF',
    TEXT_COLOR: '#000000',
    SECONDARY_TEXT_COLOR: 'gray',
  };

  // 导航配置
  static readonly NAVIGATION = {
    HOME: {
      TITLE: '首页',
      ICON: 'home',
    },
    TRANSACTION: {
      TITLE: '交易',
      ICON: 'swap-horiz',
    },
    BUDGET: {
      TITLE: '预算',
      ICON: 'account-balance-wallet',
    },
    REPORT: {
      TITLE: '报表',
      ICON: 'bar-chart',
    },
  };

  // 错误消息
  static readonly ERROR_MESSAGES = {
    DATABASE_NOT_INITIALIZED: '数据库未初始化',
    INITIALIZATION_FAILED: '初始化失败',
  };
} 