import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from './Text';
import { BackgroundImage } from './BackgroundImage';
import theme from '@/theme';

export interface ErrorViewProps {
  error: Error;
  onRetry?: () => void;
  message?: string;
}

export function ErrorView({ error, onRetry, message }: ErrorViewProps) {
  return (
    <BackgroundImage>
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
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  }
});