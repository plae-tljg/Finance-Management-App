import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, TextInput, Platform, Modal } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { databaseService } from '@/services/database/DatabaseService';

export function DatabaseExport() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportDatabase = async () => {
    try {
      setIsExporting(true);
      console.log('开始导出数据库...');
      
      // 获取数据库文件路径
      const dbPath = `${FileSystem.documentDirectory}SQLite/FinanceManager.db`;
      console.log('当前数据库路径:', dbPath);
      
      // 检查文件是否存在
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      console.log('数据库文件信息:', fileInfo);
      
      if (!fileInfo.exists) {
        console.error('数据库文件不存在');
        Alert.alert('错误', '数据库文件不存在');
        setIsExporting(false);
        return;
      }

      // 请求目录权限
      console.log('请求目录权限...');
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        console.log('用户拒绝了目录权限');
        Alert.alert('错误', '需要目录权限才能导出数据库');
        setIsExporting(false);
        return;
      }
      console.log('获得目录权限:', permissions.directoryUri);

      // 生成导出文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `FinanceManager_${timestamp}.db`;
      console.log('准备创建文件:', fileName);

      try {
        // 创建文件
        console.log('开始创建文件...');
        const fileUri = await StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          'application/x-sqlite3'
        );
        console.log('文件创建成功:', fileUri);

        // 读取数据库文件内容
        console.log('读取数据库文件内容...');
        const dbContent = await FileSystem.readAsStringAsync(dbPath, {
          encoding: FileSystem.EncodingType.Base64
        });

        // 写入文件内容
        console.log('写入文件内容...');
        await FileSystem.writeAsStringAsync(fileUri, dbContent, {
          encoding: FileSystem.EncodingType.Base64
        });
        console.log('文件写入完成');

        Alert.alert('成功', `数据库已导出到: ${fileUri}`);
      } catch (error: any) {
        console.error('文件操作失败:', error);
        Alert.alert('错误', `导出数据库失败: ${error?.message || '未知错误'}`);
      } finally {
        setIsExporting(false);
      }
    } catch (error: any) {
      console.error('导出数据库失败:', error);
      Alert.alert('错误', `导出数据库失败: ${error?.message || '未知错误'}`);
      setIsExporting(false);
    }
  };

  const handleImportDatabase = async () => {
    try {
      console.log('开始导入数据库...');
      
      // 请求目录权限
      console.log('请求目录权限...');
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        console.log('用户拒绝了目录权限');
        Alert.alert('错误', '需要目录权限才能导入数据库');
        return;
      }
      console.log('获得目录权限:', permissions.directoryUri);

      // 读取目录内容
      console.log('读取目录内容...');
      const files = await StorageAccessFramework.readDirectoryAsync(permissions.directoryUri);
      console.log('目录内容:', files);

      // 过滤出 .db 文件
      const dbFiles = files.filter(file => file.toLowerCase().endsWith('.db'));
      if (dbFiles.length === 0) {
        Alert.alert('错误', '当前目录没有找到数据库文件');
        return;
      }

      // 显示文件选择对话框
      Alert.alert(
        '选择数据库文件',
        '请选择要导入的数据库文件',
        [
          ...dbFiles.map(file => ({
            text: file.split('/').pop() || file, // 只显示文件名
            onPress: async () => {
              try {
                // 直接使用文件 URI，不需要拼接
                const fileUri = file;
                console.log('选择的文件:', fileUri);

                // 确认导入
                Alert.alert(
                  '确认导入',
                  '导入新数据库将替换当前数据库，所有数据将被覆盖。确定要继续吗？',
                  [
                    {
                      text: '取消',
                      style: 'cancel',
                      onPress: () => {
                        console.log('用户取消了导入操作');
                      }
                    },
                    {
                      text: '确定',
                      onPress: async () => {
                        try {
                          console.log('用户确认导入，开始导入过程...');
                          
                          // 获取当前数据库路径
                          const dbPath = `${FileSystem.documentDirectory}SQLite/FinanceManager.db`;
                          console.log('当前数据库路径:', dbPath);
                          
                          // 创建备份目录
                          const backupDir = `${FileSystem.documentDirectory}backups`;
                          console.log('创建备份目录:', backupDir);
                          
                          const dirInfo = await FileSystem.getInfoAsync(backupDir);
                          if (!dirInfo.exists) {
                            console.log('备份目录不存在，正在创建...');
                            await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true });
                          }

                          // 备份当前数据库
                          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                          const backupPath = `${backupDir}/FinanceManager_backup_${timestamp}.db`;
                          console.log('备份文件路径:', backupPath);
                          
                          console.log('开始备份当前数据库...');
                          await FileSystem.copyAsync({
                            from: dbPath,
                            to: backupPath
                          });
                          console.log('数据库备份完成');

                          // 读取选择的文件内容
                          console.log('读取选择的文件内容...');
                          const fileContent = await FileSystem.readAsStringAsync(fileUri, {
                            encoding: FileSystem.EncodingType.Base64
                          });

                          // 写入新数据库
                          console.log('开始写入新数据库...');
                          await FileSystem.writeAsStringAsync(dbPath, fileContent, {
                            encoding: FileSystem.EncodingType.Base64
                          });
                          console.log('新数据库写入完成');

                          Alert.alert('成功', `数据库已成功导入，备份文件保存在: ${backupPath}\n请重启应用以应用更改`);
                        } catch (error: any) {
                          console.error('导入数据库失败:', error);
                          Alert.alert('错误', `导入数据库失败: ${error?.message || '未知错误'}`);
                        }
                      }
                    }
                  ]
                );
              } catch (error: any) {
                console.error('读取文件失败:', error);
                Alert.alert('错误', `读取文件失败: ${error?.message || '未知错误'}`);
              }
            }
          })),
          {
            text: '取消',
            style: 'cancel',
            onPress: () => {
              console.log('用户取消了文件选择');
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('选择文件失败:', error);
      Alert.alert('错误', `选择文件失败: ${error?.message || '未知错误'}`);
    }
  };

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>数据库管理</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.exportButton]}
          onPress={handleExportDatabase}
          disabled={isExporting}
        >
          <Text style={styles.buttonText}>
            {isExporting ? '导出中...' : '导出数据库'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.importButton]}
          onPress={handleImportDatabase}
        >
          <Text style={styles.buttonText}>导入数据库</Text>
        </TouchableOpacity>
      </View>
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  exportButton: {
    backgroundColor: '#007AFF',
  },
  importButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
}); 