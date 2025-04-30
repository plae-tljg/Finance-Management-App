import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

export const ReportScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>财务报表</Text>
      {/* TODO: 添加报表内容 */}
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