import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/base/Text';

export interface DetailItem {
  label: string;
  value: string | number;
  type?: string;
}

interface DetailViewProps {
  items: DetailItem[];
  title?: string; 
}

export function DetailView({ items, title }: DetailViewProps) {
  return (
    <View style={styles.card}>
      {title && (
        <Text variant="subtitle" style={styles.title}>
          {title}
        </Text>
      )}
      {items.map((item, index) => (
        <View key={index} style={styles.item}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.value}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    marginBottom: 16,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  label: {
    color: '#666666',
  },
  value: {
    color: '#000000',
  },
});