import React, { memo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base/Text';
import theme from '@/theme';

interface FormCardProps {
  children: React.ReactNode;
  style?: object;
}

export const FormCard = memo(function FormCard({ children, style }: FormCardProps) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
});