import React, { memo, useCallback, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base/Text';
import theme from '@/theme';

const TEMPLATE_OPTIONS = ['午餐', '午餐晚餐', '午餐面包', '晚餐', '早餐'];

interface DescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  templateMode?: boolean;
  templateHint?: string;
}

export const DescriptionInput = memo(function DescriptionInput({
  value,
  onChange,
  templateMode = false,
  templateHint = '快速选择或输入自定义描述'
}: DescriptionInputProps) {
  const handleTemplateSelect = useCallback((option: string) => {
    onChange(value === option ? '' : option);
  }, [value, onChange]);

  if (templateMode) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>描述</Text>
        <View>
          <Text style={styles.templateHint}>{templateHint}</Text>
          <View style={styles.templateOptions}>
            {TEMPLATE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.templateOption,
                  value === option && styles.templateOptionActive
                ]}
                onPress={() => handleTemplateSelect(option)}
              >
                <Text style={[
                  styles.templateOptionText,
                  value === option && styles.templateOptionTextActive
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.input, styles.customInput]}
            placeholder="或输入自定义描述"
            placeholderTextColor={theme.colors.textTertiary}
            value={value}
            onChangeText={onChange}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>描述</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        placeholder="添加描述（可选）"
        placeholderTextColor={theme.colors.textTertiary}
        value={value}
        onChangeText={onChange}
        multiline
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {},
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  customInput: {
    marginTop: theme.spacing.sm,
  },
  templateHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.sm,
  },
  templateOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  templateOption: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceDark,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  templateOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  templateOptionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  templateOptionTextActive: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.medium,
  },
});