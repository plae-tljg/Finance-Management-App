import React, { createContext, useContext } from 'react';
import { CategoryService } from '../../domain/services/CategoryService';
import { TransactionService } from '../../domain/services/TransactionService';
import { BudgetService } from '../../domain/services/BudgetService';
import { ReportService } from '../../domain/services/ReportService';

// 定义服务上下文的值类型
interface ServiceContextValue {
  categoryService: CategoryService;
  transactionService: TransactionService;
  budgetService: BudgetService;
  reportService: ReportService;
}

// 创建服务上下文
const ServiceContext = createContext<ServiceContextValue | null>(null);

// 创建服务提供者组件
interface ServiceProviderProps {
  children: React.ReactNode;
  services: ServiceContextValue;
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({ children, services }) => {
  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
};

// 创建自定义 Hook 来使用服务
export const useServices = () => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
};

// 创建单个服务的 Hook
export const useCategoryService = () => {
  const { categoryService } = useServices();
  return categoryService;
};

export const useTransactionService = () => {
  const { transactionService } = useServices();
  return transactionService;
};

export const useBudgetService = () => {
  const { budgetService } = useServices();
  return budgetService;
};

export const useReportService = () => {
  const { reportService } = useServices();
  return reportService;
}; 