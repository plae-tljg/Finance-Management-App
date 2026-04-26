import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { PageTemplate } from '@/components/base/PageTemplate';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { MonthYearPicker } from '@/components/common/ui/MonthYearPicker';
import theme from '@/theme';

export default function DetailsScreen() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentMonth(newDate);
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const closeDatePicker = () => {
    setShowDatePicker(false);
  };

  const selectDate = (year: number, month: number) => {
    const newDate = new Date(year, month - 1, 1);
    setCurrentMonth(newDate);
    closeDatePicker();
  };

  return (
    <PageTemplate
      title={`${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月详情`}
      showBack={false}
      leftAccessory={
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      }
      rightAccessory={
        <TouchableOpacity onPress={() => changeMonth(1)}>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      }
    >
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push(`/reports?year=${currentMonth.getFullYear()}&month=${currentMonth.getMonth() + 1}`)}
        >
          <Ionicons name="stats-chart" size={22} color={theme.colors.primary} />
          <Text style={styles.buttonText}>月度概览</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push(`/transaction?year=${currentMonth.getFullYear()}&month=${currentMonth.getMonth() + 1}`)}
        >
          <Ionicons name="cash-outline" size={22} color={theme.colors.primary} />
          <Text style={styles.buttonText}>交易记录</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push(`/budget?year=${currentMonth.getFullYear()}&month=${currentMonth.getMonth() + 1}`)}
        >
          <Ionicons name="wallet-outline" size={22} color={theme.colors.primary} />
          <Text style={styles.buttonText}>预算管理</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push(`/accounts/monthly-balances?year=${currentMonth.getFullYear()}&month=${currentMonth.getMonth() + 1}`)}
        >
          <Ionicons name="calculator-outline" size={22} color={theme.colors.primary} />
          <Text style={styles.buttonText}>银行余额</Text>
        </TouchableOpacity>
      </View>

      <MonthYearPicker
        visible={showDatePicker}
        onClose={closeDatePicker}
        onSelect={selectDate}
        currentYear={currentMonth.getFullYear()}
        currentMonth={currentMonth.getMonth() + 1}
      />
    </PageTemplate>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.md,
  },
  buttonText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
  },
}); 