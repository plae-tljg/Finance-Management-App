import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { HeaderCard } from '@/components/base/HeaderCard';
import { BackgroundImage } from '@/components/base/BackgroundImage';
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
    <BackgroundImage blurTint="light" overlayOpacity={0.05}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Card style={styles.header}>
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={() => changeMonth(-1)}>
              <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.monthDisplay} onPress={openDatePicker}>
              <Text variant="title">
                {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月详情
              </Text>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} style={styles.calendarIcon} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => changeMonth(1)}>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>
        
        <ScrollView style={styles.content}>
          <Card style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => router.push(`/monthly_summary?year=${currentMonth.getFullYear()}&month=${currentMonth.getMonth() + 1}`)}
            >
              <Ionicons name="stats-chart" size={24} color={theme.colors.primary} />
              <Text style={styles.buttonText}>月度概览</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.button}
              onPress={() => router.push(`/transaction?year=${currentMonth.getFullYear()}&month=${currentMonth.getMonth() + 1}`)}
            >
              <Ionicons name="cash-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.buttonText}>交易记录</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.button}
              onPress={() => router.push(`/budget?year=${currentMonth.getFullYear()}&month=${currentMonth.getMonth() + 1}`)}
            >
              <Ionicons name="wallet-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.buttonText}>预算管理</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.button}
              onPress={() => router.push(`/monthly-balances?year=${currentMonth.getFullYear()}&month=${currentMonth.getMonth() + 1}`)}
            >
              <Ionicons name="calculator-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.buttonText}>银行余额</Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>

        <MonthYearPicker
          visible={showDatePicker}
          onClose={closeDatePicker}
          onSelect={selectDate}
          currentYear={currentMonth.getFullYear()}
          currentMonth={currentMonth.getMonth() + 1}
        />
      </SafeAreaView>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceDark,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  calendarIcon: {
    marginLeft: theme.spacing.sm,
  },
  content: {
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.sm,
  },
  buttonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  buttonContainer: {
    gap: theme.spacing.sm,
  },
}); 