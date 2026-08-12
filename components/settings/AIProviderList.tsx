import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';
import {
  AIProvider,
  getProviders,
  addProvider,
  updateProvider,
  deleteProvider,
  setDefaultProvider,
  generateId,
} from '@/utils/aiStorage';
import { testConnection } from '@/services/business/AIService';

const EMPTY_PROVIDER: Omit<AIProvider, 'id'> = {
  name: '',
  baseUrl: '',
  apiKey: '',
  modelName: '',
  isDefault: false,
};

export function AIProviderList() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_PROVIDER);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; message: string } | null>(null);

  const loadProviders = useCallback(async () => {
    const data = await getProviders();
    setProviders(data);
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_PROVIDER);
    setShowModal(true);
  };

  const openEdit = (provider: AIProvider) => {
    setEditingId(provider.id);
    setForm({
      name: provider.name,
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey,
      modelName: provider.modelName,
      isDefault: provider.isDefault,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.baseUrl.trim() || !form.apiKey.trim() || !form.modelName.trim()) {
      Alert.alert('错误', '请填写所有字段');
      return;
    }

    if (editingId) {
      await updateProvider(editingId, form);
    } else {
      await addProvider({
        id: generateId(),
        ...form,
        isDefault: providers.length === 0, // first provider is default
      });
    }
    setShowModal(false);
    await loadProviders();
  };

  const handleDelete = (provider: AIProvider) => {
    Alert.alert('确认删除', `确定要删除 ${provider.name} 吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await deleteProvider(provider.id);
          await loadProviders();
        },
      },
    ]);
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultProvider(id);
    await loadProviders();
  };

  const handleTest = async (provider: AIProvider) => {
    setTestingId(provider.id);
    setTestResult(null);
    const result = await testConnection(provider);
    setTestingId(null);
    setTestResult({ id: provider.id, ...result });
  };

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>AI 服务商</Text>

      {providers.map(provider => (
        <View key={provider.id}>
          <View style={styles.providerRow}>
            <TouchableOpacity
              style={styles.providerInfo}
              onPress={() => handleSetDefault(provider.id)}
            >
              <View style={styles.providerHeader}>
                <Text style={styles.providerName}>{provider.name}</Text>
                {provider.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>默认</Text>
                  </View>
                )}
              </View>
              <Text style={styles.providerDetail}>模型: {provider.modelName}</Text>
              <Text style={styles.providerDetail} numberOfLines={1}>
                {provider.baseUrl}
              </Text>
            </TouchableOpacity>
            <View style={styles.providerActions}>
              <TouchableOpacity
                onPress={() => handleTest(provider)}
                style={styles.actionBtn}
                disabled={testingId === provider.id}
              >
                {testingId === provider.id ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Ionicons name="flash" size={18} color={theme.colors.success} />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openEdit(provider)} style={styles.actionBtn}>
                <Ionicons name="pencil" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(provider)} style={styles.actionBtn}>
                <Ionicons name="trash" size={18} color={theme.colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
          {testResult && testResult.id === provider.id && (
            <View style={[styles.testResult, testResult.ok ? styles.testSuccess : styles.testFail]}>
              <Ionicons
                name={testResult.ok ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={testResult.ok ? theme.colors.success : theme.colors.danger}
              />
              <Text style={[styles.testResultText, { color: testResult.ok ? theme.colors.success : theme.colors.danger }]}>
                {testResult.message}
              </Text>
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={openAdd}>
        <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
        <Text style={styles.addButtonText}>添加服务商</Text>
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingId ? '编辑服务商' : '添加服务商'}
            </Text>
            <ScrollView>
              <Text style={styles.inputLabel}>名称</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={t => setForm(f => ({ ...f, name: t }))}
                placeholder="如：小米 MiMo"
              />
              <Text style={styles.inputLabel}>Base URL</Text>
              <TextInput
                style={styles.input}
                value={form.baseUrl}
                onChangeText={t => setForm(f => ({ ...f, baseUrl: t }))}
                placeholder="https://api.example.com/v1"
                autoCapitalize="none"
              />
              <Text style={styles.inputLabel}>API Key</Text>
              <TextInput
                style={styles.input}
                value={form.apiKey}
                onChangeText={t => setForm(f => ({ ...f, apiKey: t }))}
                placeholder="sk-..."
                autoCapitalize="none"
                secureTextEntry
              />
              <Text style={styles.inputLabel}>模型名称</Text>
              <TextInput
                style={styles.input}
                value={form.modelName}
                onChangeText={t => setForm(f => ({ ...f, modelName: t }))}
                placeholder="mimo-v2.5"
                autoCapitalize="none"
              />
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleSave}
              >
                <Text style={styles.saveBtnText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    margin: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  providerInfo: {
    flex: 1,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  providerName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  defaultBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  defaultBadgeText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  providerDetail: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  providerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 6,
  },
  testResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
    paddingBottom: 2,
  },
  testSuccess: {},
  testFail: {},
  testResultText: {
    fontSize: theme.fontSize.xs,
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: theme.colors.surfaceDark,
  },
  cancelBtnText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
  },
  saveBtnText: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.semibold,
  },
});
