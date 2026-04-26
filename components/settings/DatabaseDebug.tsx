import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { databaseService } from '@/services/database/DatabaseService';
import { initializeDatabase, resetDatabase } from '@/services/database/initialize';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { SCHEMAS } from '@/services/database/schemas';

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

  const handleFixDatabase = async () => {
    Alert.alert(
      '修复数据库',
      '这将创建缺失的数据库表，不会删除现有数据。确定要继续吗？',
      [
        {
          text: '取消',
          style: 'cancel'
        },
        {
          text: '确定',
          onPress: async () => {
            try {
              const tableNames = ['budget_defaults', 'goals', 'schema_version'];
              let createdCount = 0;

              for (const tableName of tableNames) {
                try {
                  const exists = await databaseService.tableExists(tableName);
                  if (!exists && SCHEMAS[tableName as keyof typeof SCHEMAS]) {
                    console.log(`Creating missing table: ${tableName}`);
                    await databaseService.executeQuery(SCHEMAS[tableName as keyof typeof SCHEMAS]);
                    createdCount++;
                  }
                } catch (e) {
                  console.error(`Error creating table ${tableName}:`, e);
                }
              }

              // Ensure schema_version exists and has version 5
              try {
                const svExists = await databaseService.tableExists('schema_version');
                if (!svExists) {
                  await databaseService.executeQuery(`
                    CREATE TABLE IF NOT EXISTS schema_version (
                      version INTEGER PRIMARY KEY,
                      appliedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                  `);
                  await databaseService.executeQuery('INSERT OR IGNORE INTO schema_version (version) VALUES (5)');
                  createdCount++;
                }
              } catch (e) {
                console.error('Error with schema_version:', e);
              }

              await loadTables();
              Alert.alert('成功', `数据库已修复，创建了 ${createdCount} 个缺失的表`);
            } catch (error) {
              console.error('修复数据库失败:', error);
              Alert.alert('错误', `修复数据库失败: ${error}`);
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
    <View style={styles.container}>
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
              style={[styles.fixButton, styles.halfButton]}
              onPress={handleFixDatabase}
            >
              <Text style={styles.fixButtonText}>修复数据库</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.refreshButton, styles.fullButton, isRefreshing && styles.disabledButton]}
              onPress={handleRefresh}
              disabled={isRefreshing}
            >
              <Text style={styles.refreshButtonText}>
                {isRefreshing ? '刷新中...' : '刷新数据'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text variant="subtitle" style={styles.subtitle}>数据库表</Text>
          
          <View style={styles.tableList}>
            {tables.map(table => (
              <TouchableOpacity
                key={table.name}
                style={styles.tableButton}
                onPress={() => handleTablePress(table.name)}
              >
                <Text style={styles.tableName}>{table.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  section: {
    marginBottom: 16,
  },
  card: {
    padding: 12,
  },
  title: {
    marginBottom: 12,
    fontSize: 16,
  },
  subtitle: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  halfButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  fullButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  resetButton: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  fixButton: {
    backgroundColor: '#FF9500',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  fixButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tableButton: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginBottom: 6,
  },
  tableName: {
    fontSize: 14,
    fontWeight: '500',
  },
  tableList: {
    marginTop: 8,
  },
  tableContainer: {
    marginTop: 8,
  },
  row: {
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 6,
    marginBottom: 6,
  },
  cell: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  cellKey: {
    fontWeight: '500',
    marginRight: 8,
    minWidth: 80,
    fontSize: 12,
  },
  cellValue: {
    flex: 1,
    fontSize: 12,
  },
  moreText: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
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