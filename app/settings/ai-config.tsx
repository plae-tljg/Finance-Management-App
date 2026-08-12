import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { PageTemplate } from '@/components/base/PageTemplate';
import { AIProviderList } from '@/components/settings/AIProviderList';
import theme from '@/theme';

export default function AIConfigScreen() {
  return (
    <PageTemplate title="AI 配置">
      <AIProviderList />
      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>使用说明</Text>
        <Text style={styles.infoText}>
          1. 配置支持 OpenAI 兼容接口的多模态 AI 服务商{'\n'}
          2. 在"添加"页面选择"图片导入"模式{'\n'}
          3. 选择支付宝、微信支付等账单截图{'\n'}
          4. AI 会自动识别交易信息并提取{'\n'}
          5. 确认后批量导入到数据库
        </Text>
      </Card>
    </PageTemplate>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    padding: 12,
    margin: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
});
