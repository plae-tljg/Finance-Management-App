import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from './Text';

export interface ErrorViewProps {
  error: Error;
  onRetry?: () => void;
  message?: string;
}

export function ErrorView({ error, onRetry, message }: ErrorViewProps) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>
        {message || error.message}
      </Text>
      {onRetry && (
        <Pressable 
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed
          ]}
          onPress={onRetry}
        >
          <Text style={styles.buttonText}>重试</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  }
});