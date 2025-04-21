import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from './Text';

interface LoadingViewProps {
  message?: string;
}

export function LoadingView({ message = '加载中...' }: LoadingViewProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator 
        size="large" 
        color="#007AFF"
      />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  text: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  }
});