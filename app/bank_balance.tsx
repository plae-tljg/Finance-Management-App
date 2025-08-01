import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text } from '@/components/base/Text';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useBankBalanceService } from '@/services/business/BankBalanceService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import type { BankBalance } from '@/services/database/schemas/BankBalance';

export default function BankBalanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isReady, databaseService } = useDatabaseSetup();
  const [currentBalance, setCurrentBalance] = useState<BankBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openingBalance, setOpeningBalance] = useState('0');
  const [closingBalance, setClosingBalance] = useState('0');
  
  // 从URL参数获取年月，如果没有则使用当前日期
  const currentYear = params.year ? parseInt(params.year as string) : new Date().getFullYear();
  const currentMonth = params.month ? parseInt(params.month as string) : new Date().getMonth() + 1;

  const bankBalanceService = React.useMemo(
    () => isReady && databaseService ? useBankBalanceService(databaseService) : null,
    [isReady, databaseService]
  );

  useEffect(() => {
    if (!bankBalanceService) return;

    const loadBalance = async () => {
      try {
        setIsLoading(true);
        // 先检查是否存在当前月份的记录
        let balance = await bankBalanceService.getBankBalance(currentYear, currentMonth);
        
        // 如果不存在，创建新记录
        if (!balance) {
          await bankBalanceService.initializeYear(currentYear);
          balance = await bankBalanceService.getBankBalance(currentYear, currentMonth);
        }

        if (balance) {
          setCurrentBalance(balance);
          setOpeningBalance(balance.openingBalance.toString());
          setClosingBalance(balance.closingBalance.toString());
        }
      } catch (error) {
        console.error('加载银行余额失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBalance();
  }, [bankBalanceService, currentYear, currentMonth]);

  const handleUpdate = async () => {
    if (!bankBalanceService || !currentBalance) return;

    try {
      const updatedBalance = await bankBalanceService.updateBankBalance(
        currentYear,
        currentMonth,
        {
          openingBalance: parseFloat(openingBalance) || 0,
          closingBalance: parseFloat(closingBalance) || 0
        }
      );

      if (updatedBalance) {
        setCurrentBalance(updatedBalance);
        Alert.alert('成功', '银行余额已更新');
      }
    } catch (error) {
      console.error('更新银行余额失败:', error);
      Alert.alert('错误', '更新银行余额失败，请重试');
    }
  };

  if (!isReady) {
    return (
      <View style={styles.container}>
        <Text>数据库初始化中...</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `${currentYear}年${currentMonth}月银行余额`,
          headerBackTitle: '返回',
        }}
      />
      <View style={styles.container}>
        <View style={styles.content}>
          {currentBalance && (
            <View style={styles.balanceCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>期初余额</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={openingBalance}
                  onChangeText={setOpeningBalance}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>期末余额</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={closingBalance}
                  onChangeText={setClosingBalance}
                />
              </View>

              <TouchableOpacity 
                style={styles.updateButton}
                onPress={handleUpdate}
              >
                <Text style={styles.updateButtonText}>更新</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>返回</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  updateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
}); 