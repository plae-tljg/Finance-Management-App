import { DatabaseInitializer } from '../database/DatabaseInitializer';
import { Container } from '../../application/container/Container';
import { TransactionService } from '../../domain/services/TransactionService';
import { BudgetService } from '../../domain/services/BudgetService';
import { ReportService } from '../../domain/services/ReportService';
import { CategoryService } from '../../domain/services/CategoryService';

export interface InitializationResult {
  success: boolean;
  error?: string;
  debugInfo: string[];
}

export class AppInitializer {
  private static instance: AppInitializer;
  private debugInfo: string[] = [];

  private constructor() {}

  public static getInstance(): AppInitializer {
    if (!AppInitializer.instance) {
      AppInitializer.instance = new AppInitializer();
    }
    return AppInitializer.instance;
  }

  private addDebugInfo(info: string) {
    console.log(info);
    this.debugInfo.push(`${new Date().toISOString()}: ${info}`);
  }

  public async initialize(): Promise<InitializationResult> {
    try {
      this.debugInfo = [];
      console.log('=== 开始初始化应用 ===');
      this.addDebugInfo('开始初始化应用...');
      
      // 初始化数据库
      console.log('=== 开始初始化数据库 ===');
      this.addDebugInfo('开始初始化数据库...');
      await DatabaseInitializer.getInstance().initialize();
      console.log('=== 数据库初始化完成 ===');
      this.addDebugInfo('数据库初始化完成');
      
      // 获取服务实例
      console.log('=== 开始获取服务实例 ===');
      this.addDebugInfo('获取服务实例...');
      const container = Container.getInstance();
      const transactionService = container.get<TransactionService>('TransactionService');
      const budgetService = container.get<BudgetService>('BudgetService');
      const reportService = container.get<ReportService>('ReportService');
      const categoryService = container.get<CategoryService>('CategoryService');

      console.log('=== 服务实例获取完成 ===');
      this.addDebugInfo('服务实例获取完成');

      console.log('=== 应用初始化完成 ===');
      this.addDebugInfo('应用初始化完成');

      return {
        success: true,
        debugInfo: this.debugInfo
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '初始化失败';
      console.error('=== 初始化失败 ===', err);
      this.addDebugInfo(`初始化失败: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage,
        debugInfo: this.debugInfo
      };
    }
  }
} 