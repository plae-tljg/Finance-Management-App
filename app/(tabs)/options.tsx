import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { PageTemplate } from '@/components/base/PageTemplate';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import theme from '@/theme';

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  iconColor?: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'budget-defaults',
    title: '预算默认设置',
    description: '设置每月预算默认值',
    icon: 'calculator',
    route: '/budget/defaults',
  },
  {
    id: 'accounts',
    title: '账户管理',
    description: '管理银行账户和现金',
    icon: 'wallet',
    route: '/accounts',
  },
  {
    id: 'goals',
    title: '目标管理',
    description: '管理储蓄和理财目标',
    icon: 'flag',
    route: '/goals',
  },
  {
    id: 'categories',
    title: '分类管理',
    description: '管理收入支出分类',
    icon: 'pricetag',
    route: '/categories',
  },
  {
    id: 'reports',
    title: '财务报表',
    description: '查看现金流和年度总结',
    icon: 'analytics',
    route: '/reports',
  },
  {
    id: 'settings',
    title: '设置',
    description: '数据库导出、调试工具等',
    icon: 'settings',
    route: '/settings',
  },
];

export default function OptionsPage() {
  const handlePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <PageTemplate title="选项" showBack={false}>
      <View style={styles.menuContainer}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => handlePress(item.route)}
            activeOpacity={0.7}
          >
            <Card style={styles.menuCard}>
              <View style={styles.menuIconContainer}>
                <Ionicons
                  name={item.icon}
                  size={28}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.textTertiary}
              />
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </PageTemplate>
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  menuDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});