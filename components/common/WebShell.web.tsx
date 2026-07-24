import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { Text } from '@/components/base/Text';
import theme from '@/theme';

/**
 * Web-only shell that turns the phone-style mobile layout into a
 * desktop-friendly experience:
 *
 *   - Centers content in a max-width column so long text doesn't
 *     stretch edge-to-edge on a wide monitor.
 *   - Replaces the bottom tab bar with a top nav so all main
 *     routes are one click away on a wide screen.
 *   - Renders a real loading / error state instead of a blank
 *     screen while the LAN HTTP server is being reached.
 *
 * The mobile UI is unchanged — this file is only loaded on web.
 */

const IS_WEB = Platform.OS === 'web';

interface NavItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
  match: (path: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    title: '首页',
    icon: 'home',
    href: '/',
    match: (p) => p === '/' || p === '/(tabs)' || p === '/(tabs)/index',
  },
  {
    id: 'details',
    title: '详情',
    icon: 'list',
    href: '/details',
    match: (p) => p.startsWith('/details') || p.startsWith('/reports') || p.startsWith('/transaction') || p.startsWith('/budget') || p.startsWith('/accounts'),
  },
  {
    id: 'add',
    title: '添加',
    icon: 'add-circle',
    href: '/add',
    match: (p) => p.startsWith('/add') || p.startsWith('/transaction/'),
  },
  {
    id: 'options',
    title: '选项',
    icon: 'menu',
    href: '/options',
    match: (p) => p.startsWith('/options') || p.startsWith('/settings') || p.startsWith('/categories') || p.startsWith('/goals'),
  },
];

export function WebShell({ children }: { children: React.ReactNode }) {
  // On non-web this is a no-op so we never accidentally mount
  // desktop-only chrome on mobile.
  if (!IS_WEB) {
    return <>{children}</>;
  }

  return <WebShellInner>{children}</WebShellInner>;
}

function WebShellInner({ children }: { children: React.ReactNode }) {
  const { isReady, error, retry } = useDatabaseSetup();
  const router = useRouter();
  const pathname = usePathname();
  const [width, setWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isWide = width >= 900;
  const activeId = useMemo(
    () => NAV_ITEMS.find((n) => n.match(pathname ?? ''))?.id ?? 'home',
    [pathname],
  );

  const handleNav = useCallback(
    (item: NavItem) => {
      router.push(item.href as any);
    },
    [router],
  );

  return (
    <View style={styles.outer}>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <Ionicons name="wallet" size={20} color={theme.colors.primary} />
          <Text style={styles.brandText}>财务助手 · Web 模式</Text>
        </View>
        <View style={styles.navRow}>
          {NAV_ITEMS.map((item) => {
            const active = item.id === activeId;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.navItem, active && styles.navItemActive]}
                onPress={() => handleNav(item)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={active ? theme.colors.white : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.navItemText,
                    active && styles.navItemTextActive,
                  ]}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.statusPill}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isReady
                  ? theme.colors.success
                  : error
                    ? theme.colors.danger
                    : theme.colors.warning,
              },
            ]}
          />
          <Text style={styles.statusText}>
            {isReady ? '已连接' : error ? '未连接' : '连接中'}
          </Text>
        </View>
      </View>

      <View style={styles.scrollArea}>
        <View
          style={[
            styles.contentColumn,
            isWide ? styles.contentColumnWide : styles.contentColumnNarrow,
          ]}
        >
          {!isReady && !error ? <LoadingPanel /> : null}
          {error ? <ErrorPanel error={error} onRetry={retry} /> : null}
          {isReady ? children : null}
        </View>
      </View>
    </View>
  );
}

function LoadingPanel() {
  return (
    <View style={panelStyles.wrap}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={panelStyles.title}>正在连接手机的 Web 模式…</Text>
      <Text style={panelStyles.body}>
        请确认手机已打开 Web 模式开关，且与这台电脑连在同一个 Wi-Fi 下。
      </Text>
    </View>
  );
}

function ErrorPanel({ error, onRetry }: { error: Error; onRetry: () => Promise<void> }) {
  const [retrying, setRetrying] = useState(false);
  const handleRetry = async () => {
    try {
      setRetrying(true);
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <View style={panelStyles.wrap}>
      <Ionicons
        name="cloud-offline-outline"
        size={40}
        color={theme.colors.danger}
      />
      <Text style={panelStyles.title}>无法连接到手机</Text>
      <Text style={panelStyles.body}>{error.message}</Text>
      <View style={panelStyles.tips}>
        <Text style={panelStyles.tip}>• 手机上的 Web 模式开关是否已打开？</Text>
        <Text style={panelStyles.tip}>• 手机和电脑是否在同一个 Wi-Fi？</Text>
        <Text style={panelStyles.tip}>• URL 是否包含 <Text style={panelStyles.mono}>?token=</Text> 参数？</Text>
        <Text style={panelStyles.tip}>
          • 如果上面都没问题，点下面的按钮再试一次
        </Text>
      </View>
      <TouchableOpacity
        style={panelStyles.retryBtn}
        onPress={handleRetry}
        disabled={retrying}
        activeOpacity={0.7}
      >
        <Ionicons name="refresh" size={18} color={theme.colors.white} />
        <Text style={panelStyles.retryText}>
          {retrying ? '重试中…' : '重试连接'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    minHeight: '100%' as any,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 24,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  navRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: theme.colors.primary,
  },
  navItemText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  navItemTextActive: {
    color: theme.colors.white,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceDark,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  scrollArea: {
    flex: 1,
    alignItems: 'center',
  },
  contentColumn: {
    width: '100%',
    flex: 1,
  },
  contentColumnNarrow: {
    maxWidth: 480,
  },
  contentColumnWide: {
    maxWidth: 1100,
  },
});

const panelStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginTop: 8,
  },
  body: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 480,
    lineHeight: 20,
  },
  tips: {
    marginTop: 12,
    gap: 6,
    alignSelf: 'stretch',
    maxWidth: 480,
  },
  tip: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  mono: {
    fontFamily: 'monospace',
    color: theme.colors.text,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: theme.borderRadius.md,
    marginTop: 16,
  },
  retryText: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.medium,
    fontSize: theme.fontSize.sm,
  },
});
