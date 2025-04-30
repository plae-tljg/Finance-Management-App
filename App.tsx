/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomTabNavigator } from './src/presentation/navigation/BottomTabNavigator';
import { AppInitializer } from './src/infrastructure/services/AppInitializer';
import { AppStateScreen } from './src/presentation/components/AppStateScreen';
import { StatusBar, View, Platform } from 'react-native';
import { ServiceProvider } from './src/presentation/contexts/ServiceContext';
import { Container } from './src/application/container/Container';
import { CategoryService } from './src/domain/services/CategoryService';
import { TransactionService } from './src/domain/services/TransactionService';
import { BudgetService } from './src/domain/services/BudgetService';
import { ReportService } from './src/domain/services/ReportService';

// 创建一个全局的AppInitializer实例
const appInitializer = AppInitializer.getInstance();

function App(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [services, setServices] = useState<{
    categoryService: CategoryService;
    transactionService: TransactionService;
    budgetService: BudgetService;
    reportService: ReportService;
  } | null>(null);

  useEffect(() => {
    // 设置状态栏为透明
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor('transparent');
    StatusBar.setBarStyle('dark-content');
    
    initializeApp();
  }, []);

  const initializeApp = async () => {
    const result = await appInitializer.initialize();
    setIsLoading(false);
    
    if (!result.success) {
      setError(result.error || '初始化失败');
    }
    setDebugInfo(result.debugInfo);

    // 如果初始化成功，从 Container 获取服务实例
    if (result.success) {
      const container = Container.getInstance();
      const services = {
        categoryService: container.get<CategoryService>('CategoryService'),
        transactionService: container.get<TransactionService>('TransactionService'),
        budgetService: container.get<BudgetService>('BudgetService'),
        reportService: container.get<ReportService>('ReportService')
      };
      setServices(services);
      console.log('服务初始化成功，可以开始使用');
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    initializeApp();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F5FCFF' }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <SafeAreaProvider>
        <AppStateScreen
          isLoading={isLoading}
          error={error}
          debugInfo={debugInfo}
          onRetry={handleRetry}
        />
        {!isLoading && !error && services && (
          <ServiceProvider services={services}>
            <NavigationContainer>
              <BottomTabNavigator />
            </NavigationContainer>
          </ServiceProvider>
        )}
      </SafeAreaProvider>
    </View>
  );
}

export default App;
