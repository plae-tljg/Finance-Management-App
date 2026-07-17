import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { FinanceProvider } from '@/contexts/FinanceContext';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { WebServerLifecycleManager } from '@/components/common/WebServerLifecycleManager';
// `DatabaseProviders` is platform-resolved: `.native.tsx` wraps with
// `SQLiteProvider` (expo-sqlite), `.web.tsx` is a passthrough so the web
// bundle never imports `expo-sqlite`.
import { DatabaseProviders } from '@/components/common/DatabaseProviders';

const IS_WEB = Platform.OS === 'web';

// 仅在原生平台阻止闪屏自动隐藏。
if (!IS_WEB) {
  SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  const [loaded, error] = useFonts(IS_WEB ? {} : {
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const { isReady, error: dbError } = useDatabaseSetup();

  useEffect(() => {
    if (error) {
      console.error('字体加载错误:', error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (dbError) {
      console.error('数据库初始化错误:', dbError);
      throw dbError;
    }
  }, [dbError]);

  useEffect(() => {
    if (!IS_WEB && loaded && isReady) {
      console.log('字体加载完成，隐藏启动画面');
      SplashScreen.hideAsync().catch(error => {
        console.error('隐藏启动画面失败:', error);
      });
    }
  }, [loaded, isReady]);

  if (!IS_WEB && !loaded) {
    console.log('等待字体加载...');
    return null;
  }
  if (!isReady) {
    console.log('等待数据库/Web 服务器连接...');
    return null;
  }

  console.log('渲染根布局...');

  const stack = (
    <Stack screenOptions={{ headerShown: false }}>
      {/* File-based routes are auto-registered by expo-router. The
          Stack.Screen entries below only override options for known
          routes. Stale entries (budget/edit, budget-defaults,
          bank_balance, monthly_summary) were removed because their
          files no longer exist in app/. */}
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings/web-mode" />
      <Stack.Screen name="accounts" />
      <Stack.Screen name="goals" />
    </Stack>
  );

  if (IS_WEB) {
    return (
      <SafeAreaProvider>
        <FinanceProvider>
          <ThemeProvider value={DefaultTheme}>
            {stack}
            <StatusBar style="dark" />
          </ThemeProvider>
        </FinanceProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <DatabaseProviders>
          <FinanceProvider>
            <WebServerLifecycleManager />
            <ThemeProvider value={DefaultTheme}>
              {stack}
              <StatusBar style="dark" translucent={true} backgroundColor="transparent" />
            </ThemeProvider>
          </FinanceProvider>
        </DatabaseProviders>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}