import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from './Text';
import { BackgroundImage } from './BackgroundImage';
import theme from '@/theme';

interface LoadingViewProps {
  message?: string;
}

export function LoadingView({ message = '加载中...' }: LoadingViewProps) {
  return (
    <BackgroundImage>
      <View style={styles.container}>
        <ActivityIndicator 
          size="large" 
          color={theme.colors.primary}
        />
        <Text style={styles.text}>{message}</Text>
      </View>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  text: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  }
});