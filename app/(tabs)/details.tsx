import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/base/Text';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { MonthYearPicker } from '@/components/common/ui/MonthYearPicker';

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => changeMonth(-1)}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.monthDisplay} onPress={openDatePicker}>
            <Text variant="title">
              {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月详情
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#007AFF" style={styles.calendarIcon} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => changeMonth(1)}>
            <Ionicons name="chevron-forward" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push(`/monthly_summary?year=${currentMonth.getFullYear()}&month=${currentMonth.getMonth() + 1}`)}
          >
            <Ionicons name="stats-chart" size={24} color="#007AFF" />
            <Text style={styles.buttonText}>月度概览</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push(`/transaction?year=${currentMonth.getFullYear()}&month=${currentMonth.getMonth() + 1}`)}
          >
            <Ionicons name="cash-outline" size={24} color="#007AFF" />
            <Text style={styles.buttonText}>交易记录</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push(`/budget?year=${currentMonth.getFullYear()}&month=${currentMonth.getMonth() + 1}`)}
          >
            <Ionicons name="wallet-outline" size={24} color="#007AFF" />
            <Text style={styles.buttonText}>预算管理</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push(`/bank_balance?year=${currentMonth.getFullYear()}&month=${currentMonth.getMonth() + 1}`)}
          >
            <Ionicons name="calculator-outline" size={24} color="#007AFF" />
            <Text style={styles.buttonText}>银行余额</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 月份/年份选择器模态框 */}
      <MonthYearPicker
        visible={showDatePicker}
        onClose={closeDatePicker}
        onSelect={selectDate}
        currentYear={currentMonth.getFullYear()}
        currentMonth={currentMonth.getMonth() + 1}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  calendarIcon: {
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  buttonContainer: {
    padding: 16,
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    gap: 12,
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
  }
}); 