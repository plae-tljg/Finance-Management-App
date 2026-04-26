import React, { memo, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text } from '@/components/base/Text';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import theme from '@/theme';

interface DateTimeSelectorProps {
  date: Date;
  time: Date;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: Date) => void;
}

export const DateTimeSelector = memo(function DateTimeSelector({
  date,
  time,
  onDateChange,
  onTimeChange
}: DateTimeSelectorProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleDateChange = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      onDateChange(selectedDate);
    }
  }, [onDateChange]);

  const handleTimeChange = useCallback((event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'set' && selectedTime) {
      onTimeChange(selectedTime);
    }
  }, [onTimeChange]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>日期</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {date.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dateButton, styles.timeButton]}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.dateText}>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
      </View>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {},
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginLeft: theme.spacing.md,
  },
  timeButton: {
    marginLeft: theme.spacing.sm,
  },
  dateText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
});