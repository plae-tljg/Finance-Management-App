import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base/Text';
import theme from '@/theme';

export interface EmptyStateProps {
  /** Emoji or short glyph shown above the title. */
  icon?: string;
  title: string;
  /** One sentence explaining why this matters or what happens next. */
  description?: string;
  /** Primary call to action. */
  actionLabel?: string;
  onAction?: () => void;
  /** Secondary, lower-emphasis call to action. */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  /** Tighter spacing for use inside an existing card. */
  compact?: boolean;
}

/**
 * A "nothing here yet" placeholder that tells the user what is missing, why
 * it matters, and gives them one button to fix it.
 *
 * Several screens in the app rendered a bare `暂无X记录` string, which reads
 * as "the app is broken" rather than "here is what to do next".
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}

      <Text style={styles.title}>{title}</Text>

      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}

      {actionLabel && onAction ? (
        <TouchableOpacity
          style={styles.action}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}

      {secondaryActionLabel && onSecondaryAction ? (
        <TouchableOpacity
          style={styles.secondaryAction}
          onPress={onSecondaryAction}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryActionText}>{secondaryActionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  containerCompact: {
    paddingVertical: theme.spacing.lg,
  },
  icon: {
    fontSize: 40,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    lineHeight: 20,
  },
  action: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
  },
  actionText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  secondaryAction: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  secondaryActionText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
});
