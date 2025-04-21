import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';

export interface TextProps extends RNTextProps {
  variant?: 'default' | 'title' | 'subtitle' | 'caption';
}

const styles = StyleSheet.create({
  base: {
    fontSize: 16,
    color: '#000000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '500',
  },
  caption: {
    fontSize: 14,
    color: '#666666',
  }
});

export function Text({ style, variant = 'default', ...props }: TextProps) {
  return (
    <RNText
      style={[
        styles.base,
        variant === 'title' && styles.title,
        variant === 'subtitle' && styles.subtitle,
        variant === 'caption' && styles.caption,
        style,
      ]}
      {...props}
    />
  );
} 