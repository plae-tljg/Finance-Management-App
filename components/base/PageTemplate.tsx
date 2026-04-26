import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { BackgroundImage } from '@/components/base/BackgroundImage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import theme from '@/theme';

export interface PageTemplateProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  leftAccessory?: React.ReactNode;
  rightAccessory?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean;
}

function containsVirtualizedList(children: React.ReactNode): boolean {
  if (!children) return false;

  const arrayChildren = React.Children.toArray(children);

  for (const child of arrayChildren) {
    if (!React.isValidElement(child)) continue;

    const type = (child as React.ReactElement<any>).type;
    const typeName = typeof type === 'string' ? type : (type as any)?.displayName || (type as any)?.name || '';

    // Check for any List-type component (FlatList, SectionList, VirtualizedList, or custom List components)
    if (typeName === 'FlatList' || typeName === 'SectionList' || typeName === 'VirtualizedList') {
      return true;
    }

    // Check for components with 'List' in name (common pattern for custom list components)
    if (typeName.includes('List')) {
      return true;
    }

    // Recursively check nested children in props
    const childProps = child.props as any;
    if (childProps) {
      // Check direct children prop
      if (childProps.children) {
        if (Array.isArray(childProps.children)) {
          for (const nestedChild of childProps.children) {
            if (containsVirtualizedList(nestedChild)) {
              return true;
            }
          }
        } else if (containsVirtualizedList(childProps.children)) {
          return true;
        }
      }
    }
  }

  return false;
}

export function PageTemplate({
  title,
  showBack = true,
  onBack,
  leftAccessory,
  rightAccessory,
  children,
  footer,
  scrollable = true,
}: PageTemplateProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const hasVirtualList = containsVirtualizedList(children);
  const shouldScroll = scrollable && !hasVirtualList;

  // If we have complex list components, don't wrap them at all - let them manage their own scrolling
  const content = hasVirtualList ? (
    <View style={styles.content}>{children}</View>
  ) : shouldScroll ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.content}>{children}</View>
  );

  return (
    <BackgroundImage>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Card style={styles.header}>
          <View style={styles.headerContent}>
            {leftAccessory ? (
              <View style={styles.leftAccessory}>{leftAccessory}</View>
            ) : showBack ? (
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            ) : null}
            <Text variant="title" style={[styles.title, !showBack && !leftAccessory && styles.titleNoBack]}>
              {title}
            </Text>
            {rightAccessory && <View style={styles.rightAccessory}>{rightAccessory}</View>}
          </View>
        </Card>

        {content}

        {footer && <View style={styles.footer}>{footer}</View>}
      </SafeAreaView>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: theme.spacing.xs,
    marginLeft: -theme.spacing.xs,
  },
  leftAccessory: {
    marginRight: theme.spacing.xs,
  },
  title: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  titleNoBack: {
    marginLeft: 0,
  },
  rightAccessory: {
    marginLeft: theme.spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
    paddingHorizontal: theme.spacing.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  footer: {
    paddingBottom: 20,
  },
});