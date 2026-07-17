import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Switch, TouchableOpacity, Alert, Platform, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { PageTemplate } from '@/components/base/PageTemplate';
import { useWebServer, ConnectionLogEntry } from '@/hooks/useWebServer';
import theme from '@/theme';

import QRCode from 'react-native-qrcode-svg';

function generatePin(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return String(n);
}

function buildLandingUrl(baseUrl: string, pin?: string): string {
  return pin ? `${baseUrl}/?token=${pin}` : baseUrl;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

export default function WebModeScreen() {
  const { status, start, stop, refresh, fetchConnectionLog, isAvailable } = useWebServer();
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<ConnectionLogEntry[]>([]);

  // Poll status + log every 3s while running
  useEffect(() => {
    if (!status.running) {
      setLog([]);
      return;
    }
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      await refresh();
      const entries = await fetchConnectionLog();
      if (!cancelled) setLog(entries);
    };
    tick();
    const t = setInterval(tick, 3000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [status.running, refresh, fetchConnectionLog]);

  // No PIN — server-side auth disabled by request. The URL still doesn't
  // carry a token.
  const landingUrl = useMemo(
    () => (status.baseUrl ? status.baseUrl : null),
    [status.baseUrl],
  );

  const qrPayload = useMemo(
    () => (status.baseUrl ? status.baseUrl : ''),
    [status.baseUrl],
  );

  const handleToggle = async (next: boolean) => {
    if (!isAvailable) {
      Alert.alert('不支持的平台', 'Web Mode 仅在 Android 原生构建中可用。');
      return;
    }
    setBusy(true);
    try {
      if (next) {
        await start(8080);
      } else {
        await stop();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('错误', `无法切换 Web 模式: ${msg}`);
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    if (!landingUrl) return;
    try {
      await Share.share({
        message: `Finance Manager (LAN): ${landingUrl}`,
      });
    } catch {
      // user cancelled
    }
  };

  return (
    <PageTemplate title="Web 模式" showBack>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text variant="subtitle">局域网 Web 模式</Text>
            <Text variant="caption" style={styles.muted}>
              启动一个内嵌 HTTP 服务，让同 Wi-Fi 下的浏览器访问并实时编辑此设备上的财务数据。
            </Text>
          </View>
          <Switch
            value={status.running}
            onValueChange={handleToggle}
            disabled={busy || !isAvailable}
          />
        </View>

        {!isAvailable && (
          <View style={styles.notice}>
            <Ionicons name="warning-outline" size={18} color={theme.colors.warning} />
            <Text variant="caption" style={styles.noticeText}>
              当前构建中没有原生 WebServer 模块。请使用 Android 原生构建运行此功能。
            </Text>
          </View>
        )}
      </Card>

      {status.running && status.baseUrl && (
        <>
          <Card style={styles.qrCard}>
            <View style={styles.qrHeader}>
              <Ionicons name="globe-outline" size={20} color={theme.colors.primary} />
              <Text variant="subtitle" style={styles.qrTitle}>
                在浏览器中打开
              </Text>
            </View>
            <View style={styles.qrContainer}>
              <QRCode value={qrPayload} size={200} />
            </View>
            <Text style={styles.url} selectable>
              {landingUrl}
            </Text>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.shareButtonText}>分享链接</Text>
            </TouchableOpacity>
          </Card>

          {log.length > 0 && (
            <Card style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text variant="subtitle" style={styles.cardTitle}>
                  连接记录
                </Text>
                <View style={styles.activeBadge}>
                  <Ionicons name="pulse" size={14} color={theme.colors.success} />
                  <Text style={styles.activeBadgeText}>
                    {status.activeConnections} 个活跃
                  </Text>
                </View>
              </View>
              <View style={styles.logList}>
                {log
                  .slice(-10)
                  .reverse()
                  .map((entry, idx) => (
                    <View key={`${entry.timestamp}-${idx}`} style={styles.logItem}>
                      <Text style={styles.logTime}>{formatTime(entry.timestamp)}</Text>
                      <Text
                        style={[
                          styles.logStatus,
                          entry.status >= 500
                            ? styles.logStatusErr
                            : entry.status >= 400
                              ? styles.logStatusWarn
                              : styles.logStatusOk,
                        ]}
                      >
                        {entry.status}
                      </Text>
                      <Text style={styles.logPath} numberOfLines={1}>
                        {entry.path}
                      </Text>
                    </View>
                  ))}
              </View>
            </Card>
          )}
        </>
      )}

      <Card style={styles.card}>
        <Text variant="subtitle" style={styles.cardTitle}>
          使用说明
        </Text>
        <View style={styles.helpList}>
          <View style={styles.helpItem}>
            <Ionicons name="ellipse" size={6} color={theme.colors.textSecondary} />
            <Text variant="caption" style={styles.helpText}>
              打开开关后，确保手机与目标设备连接到同一 Wi-Fi 网络。
            </Text>
          </View>
          <View style={styles.helpItem}>
            <Ionicons name="ellipse" size={6} color={theme.colors.textSecondary} />
            <Text variant="caption" style={styles.helpText}>
              在浏览器中输入或扫码打开链接，输入 PIN（如果启用）即可访问。
            </Text>
          </View>
          <View style={styles.helpItem}>
            <Ionicons name="ellipse" size={6} color={theme.colors.textSecondary} />
            <Text variant="caption" style={styles.helpText}>
              所有改动通过 REST API 写入本机 SQLite 数据库，原生应用会同步刷新。
            </Text>
          </View>
          <View style={styles.helpItem}>
            <Ionicons name="ellipse" size={6} color={theme.colors.textSecondary} />
            <Text variant="caption" style={styles.helpText}>
              服务仅在本机运行，不消耗流量，关闭开关后立即停止。
            </Text>
          </View>
        </View>
      </Card>
    </PageTemplate>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  cardTitle: {
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowText: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  muted: {
    marginTop: theme.spacing.xs,
    color: theme.colors.textSecondary,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
    borderRadius: theme.borderRadius.sm,
  },
  noticeText: {
    marginLeft: theme.spacing.sm,
    flex: 1,
    color: theme.colors.textSecondary,
  },
  qrCard: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    alignSelf: 'flex-start',
  },
  qrTitle: {
    marginLeft: theme.spacing.sm,
  },
  qrContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
  },
  url: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
    textAlign: 'center',
  },
  pinContainer: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.backgroundLight,
  },
  pinLabel: {
    marginLeft: theme.spacing.xs,
    marginRight: theme.spacing.xs,
    color: theme.colors.textSecondary,
  },
  pinValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    letterSpacing: 4,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  shareButtonText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  helpList: {
    marginTop: theme.spacing.sm,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  helpText: {
    marginLeft: theme.spacing.sm,
    flex: 1,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    borderRadius: theme.borderRadius.full,
  },
  activeBadgeText: {
    marginLeft: 4,
    color: theme.colors.success,
    fontWeight: theme.fontWeight.medium,
    fontSize: theme.fontSize.xs,
  },
  logList: {
    gap: theme.spacing.xs,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
  },
  logTime: {
    width: 70,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  logStatus: {
    width: 36,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
  logStatusOk: { color: theme.colors.success },
  logStatusWarn: { color: theme.colors.warning },
  logStatusErr: { color: theme.colors.danger },
  logPath: {
    flex: 1,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
});