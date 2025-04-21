import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DefaultTheme } from '@react-navigation/native';

import { FinanceProvider } from '@/contexts/FinanceContext';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
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
    if (loaded && isReady) {
      console.log('字体加载完成，隐藏启动画面');
      SplashScreen.hideAsync().catch(error => {
        console.error('隐藏启动画面失败:', error);
      });
    }
  }, [loaded, isReady]);

  if (!loaded || !isReady) {
    console.log('等待字体和数据库加载...');
    return null;
  }

  console.log('渲染根布局...');

  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="finance.db">
        <FinanceProvider>
          <ThemeProvider value={DefaultTheme}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="transaction/index" options={{ headerShown: false }} />
              <Stack.Screen name="budget/index" options={{ headerShown: false }} />
              <Stack.Screen name="categories" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </FinanceProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
