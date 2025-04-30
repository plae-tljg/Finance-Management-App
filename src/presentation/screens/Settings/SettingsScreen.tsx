import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { DatabaseInitializer } from '../../../infrastructure/database/DatabaseInitializer';

export const SettingsScreen: React.FC = () => {
  const handleBackup = async () => {
    try {
      const dbInitializer = DatabaseInitializer.getInstance();
      await dbInitializer.backupDatabase();
      Alert.alert('成功', '数据库备份已完成');
    } catch (error) {
      Alert.alert('错误', '数据库备份失败');
      console.error('备份失败:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>设置</Text>
      <TouchableOpacity style={styles.button} onPress={handleBackup}>
        <Text style={styles.buttonText}>备份数据库</Text>
      </TouchableOpacity>
      {/* TODO: 添加设置选项 */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5FCFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 