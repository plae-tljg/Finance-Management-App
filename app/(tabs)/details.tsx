import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/base/Text';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function DetailsScreen() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentMonth(newDate);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => changeMonth(-1)}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <Text variant="title">
            {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
          </Text>
          
          <TouchableOpacity onPress={() => changeMonth(1)}>
            <Ionicons name="chevron-forward" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/monthly_summary')}
          >
            <Ionicons name="stats-chart" size={24} color="#007AFF" />
            <Text style={styles.buttonText}>月度概览</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/transaction')}
          >
            <Ionicons name="cash-outline" size={24} color="#007AFF" />
            <Text style={styles.buttonText}>交易记录</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/budget')}
          >
            <Ionicons name="wallet-outline" size={24} color="#007AFF" />
            <Text style={styles.buttonText}>预算管理</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/bank_balance')}
          >
            <Ionicons name="calculator-outline" size={24} color="#007AFF" />
            <Text style={styles.buttonText}>银行余额</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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