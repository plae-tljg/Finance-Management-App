import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '@/components/base/Text';
import { Ionicons } from '@expo/vector-icons';

interface MonthYearPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (year: number, month: number) => void;
  currentYear: number;
  currentMonth: number;
}

const MONTHS = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
];

export function MonthYearPicker({ 
  visible, 
  onClose, 
  onSelect, 
  currentYear, 
  currentMonth 
}: MonthYearPickerProps) {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const handleConfirm = () => {
    onSelect(selectedYear, selectedMonth);
  };

  const generateYears = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    // 生成从当前年份前10年到后5年的年份
    for (let year = currentYear - 10; year <= currentYear + 5; year++) {
      years.push(year);
    }
    return years;
  };

  const years = generateYears();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>选择月份和年份</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* 年份选择 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>年份</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearScroll}>
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearItem,
                      selectedYear === year && styles.selectedItem
                    ]}
                    onPress={() => setSelectedYear(year)}
                  >
                    <Text style={[
                      styles.yearText,
                      selectedYear === year && styles.selectedText
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 月份选择 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>月份</Text>
              <View style={styles.monthGrid}>
                {MONTHS.map((month, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.monthItem,
                      selectedMonth === index + 1 && styles.selectedItem
                    ]}
                    onPress={() => setSelectedMonth(index + 1)}
                  >
                    <Text style={[
                      styles.monthText,
                      selectedMonth === index + 1 && styles.selectedText
                    ]}>
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmText}>确定</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  yearScroll: {
    flexDirection: 'row',
  },
  yearItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    minWidth: 60,
    alignItems: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthItem: {
    width: '30%',
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: '#007AFF',
  },
  yearText: {
    fontSize: 14,
    color: '#333',
  },
  monthText: {
    fontSize: 14,
    color: '#333',
  },
  selectedText: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#eee',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderLeftWidth: 0.5,
    borderLeftColor: '#eee',
    backgroundColor: '#007AFF',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  confirmText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
}); 