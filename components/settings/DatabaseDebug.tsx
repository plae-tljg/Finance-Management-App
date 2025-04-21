import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { databaseService } from '@/services/database/DatabaseService';
import { initializeDatabase } from '@/services/database/initialize';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';

interface TableInfo {
  name: string;
  sql: string;
}

interface TableData {
  [key: string]: any[];
}

export function DatabaseDebug() {
  const { isReady, error } = useDatabaseSetup();
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [tableData, setTableData] = useState<TableData>({});
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isReady) {
      loadTables();
    }
  }, [isReady]);

  const loadTables = async () => {
    try {
      const result = await databaseService.executeQuery<TableInfo>(
        "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT IN ('sqlite_sequence', 'sqlite_master')"
      );
      setTables(result.rows._array);
    } catch (error) {
      console.error('加载表信息失败:', error);
    }
  };

  const loadTableData = async (tableName: string) => {
    try {
      const result = await databaseService.executeQuery<any>(`SELECT * FROM ${tableName}`);
      setTableData(prev => ({
        ...prev,
        [tableName]: result.rows._array
      }));
    } catch (error) {
      console.error(`加载表 ${tableName} 数据失败:`, error);
    }
  };

  const handleTablePress = (tableName: string) => {
    setSelectedTable(tableName);
    if (!tableData[tableName]) {
      loadTableData(tableName);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadTables();
      if (selectedTable) {
        await loadTableData(selectedTable);
      }
    } catch (error) {
      console.error('刷新数据失败:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResetDatabase = async () => {
    Alert.alert(
      '重置数据库',
      '确定要重置数据库吗？这将删除所有数据并重新初始化。',
      [
        {
          text: '取消',
          style: 'cancel'
        },
        {
          text: '确定',
          onPress: async () => {
            try {
              const maxRetries = 3;
              let retryCount = 0;
              let success = false;

              while (retryCount < maxRetries && !success) {
                try {
                  await databaseService.reset();
                  await loadTables();
                  setTableData({});
                  setSelectedTable(null);
                  success = true;
                  Alert.alert('成功', '数据库已重置');
                } catch (error) {
                  retryCount++;
                  if (retryCount === maxRetries) {
                    console.error('重置数据库失败:', error);
                    Alert.alert('错误', '重置数据库失败，请重试');
                  } else {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                  }
                }
              }
            } catch (error) {
              console.error('重置数据库失败:', error);
              Alert.alert('错误', '重置数据库失败，请重试');
            }
          }
        }
      ]
    );
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text>数据库正在初始化中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>数据库初始化失败: {error.message}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.section}>
        <Text variant="title" style={styles.title}>数据库调试</Text>
        
        <Card style={styles.card}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.resetButton, styles.halfButton]}
              onPress={handleResetDatabase}
            >
              <Text style={styles.resetButtonText}>重置数据库</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.refreshButton, styles.halfButton, isRefreshing && styles.disabledButton]}
              onPress={handleRefresh}
              disabled={isRefreshing}
            >
              <Text style={styles.refreshButtonText}>
                {isRefreshing ? '刷新中...' : '刷新数据'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text variant="subtitle" style={styles.subtitle}>数据库表</Text>
          
          {tables.map(table => (
            <TouchableOpacity
              key={table.name}
              style={styles.tableButton}
              onPress={() => handleTablePress(table.name)}
            >
              <Text style={styles.tableName}>{table.name}</Text>
            </TouchableOpacity>
          ))}
        </Card>
      </View>

      {selectedTable && (
        <View style={styles.section}>
          <Card style={styles.card}>
            <Text variant="subtitle" style={styles.subtitle}>{selectedTable} 表数据</Text>
            <View style={styles.tableContainer}>
              {tableData[selectedTable]?.map((row, index) => (
                <View key={index} style={styles.row}>
                  {Object.entries(row).map(([key, value]) => (
                    <View key={key} style={styles.cell}>
                      <Text style={styles.cellKey}>{key}:</Text>
                      <Text style={styles.cellValue}>{String(value)}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  card: {
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  subtitle: {
    marginTop: 16,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  halfButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  resetButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tableButton: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 8,
  },
  tableName: {
    fontSize: 16,
    fontWeight: '500',
  },
  tableContainer: {
    marginTop: 8,
  },
  row: {
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  cell: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  cellKey: {
    fontWeight: '500',
    marginRight: 8,
    minWidth: 100,
  },
  cellValue: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
  },
}); 