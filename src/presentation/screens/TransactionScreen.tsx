import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

export const TransactionScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>交易记录</Text>
      {/* TODO: 添加交易记录列表 */}
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
}); 