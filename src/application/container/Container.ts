import { BudgetRepositoryImpl } from '../../infrastructure/repositories/BudgetRepositoryImpl';
import { TransactionRepositoryImpl } from '../../infrastructure/repositories/TransactionRepositoryImpl';
import { CategoryRepositoryImpl } from '../../infrastructure/repositories/CategoryRepositoryImpl';
import { AccountRepositoryImpl } from '../../infrastructure/repositories/AccountRepositoryImpl';
import { AssetTypeRepositoryImpl } from '../../infrastructure/repositories/AssetTypeRepositoryImpl';
import { PersonalAssetRepositoryImpl } from '../../infrastructure/repositories/PersonalAssetRepositoryImpl';
import { BudgetService } from '../../domain/services/BudgetService';
import { TransactionService } from '../../domain/services/TransactionService';
import { ReportService } from '../../domain/services/ReportService';
import { CategoryService } from '../../domain/services/CategoryService';

export class Container {
  private static instance: Container;
  private services: Map<string, any> = new Map();

  private constructor() {
    this.initializeServices();
  }

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  private initializeServices(): void {
    // 初始化仓库
    const budgetRepository = new BudgetRepositoryImpl();
    const transactionRepository = new TransactionRepositoryImpl();
    const categoryRepository = new CategoryRepositoryImpl();
    const accountRepository = new AccountRepositoryImpl();
    const assetTypeRepository = new AssetTypeRepositoryImpl();
    const personalAssetRepository = new PersonalAssetRepositoryImpl();

    // 初始化服务
    const categoryService = new CategoryService(categoryRepository);
    const budgetService = new BudgetService(budgetRepository, transactionRepository, categoryRepository);
    const transactionService = new TransactionService(transactionRepository, accountRepository, categoryRepository);
    const reportService = new ReportService(
      transactionRepository,
      categoryRepository,
      accountRepository
    );

    // 注册服务
    this.services.set('CategoryService', categoryService);
    this.services.set('BudgetService', budgetService);
    this.services.set('TransactionService', transactionService);
    this.services.set('ReportService', reportService);
  }

  public get<T>(serviceName: string): T {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }
    return service as T;
  }
} 