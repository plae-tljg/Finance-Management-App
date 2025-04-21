import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput, ScrollView, TouchableOpacity, Keyboard } from 'react-native';
import { Text } from '@/components/base/Text';
import { databaseService } from '@/services/database/DatabaseService';

interface Command {
  input: string;
  output: any[];
  error: string | null;
}

export function SqlTerminal() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [commands]);

  const executeCommand = async () => {
    if (!currentInput.trim()) return;

    const input = currentInput.trim();
    setCurrentInput('');
    setCommandHistory(prev => [input, ...prev]);
    setHistoryIndex(-1);

    try {
      const result = await databaseService.executeQuery<any>(input);
      setCommands(prev => [...prev, {
        input,
        output: result.rows._array,
        error: null
      }]);
    } catch (err) {
      setCommands(prev => [...prev, {
        input,
        output: [],
        error: err instanceof Error ? err.message : '执行查询时出错'
      }]);
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter') {
      executeCommand();
    } else if (e.nativeEvent.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      }
    } else if (e.nativeEvent.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentInput('');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="title" style={styles.title}>SQL 终端</Text>
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.outputContainer}
        contentContainerStyle={styles.outputContent}
      >
        {commands.map((cmd, index) => (
          <View key={index} style={styles.commandContainer}>
            <View style={styles.inputLine}>
              <Text style={styles.prompt}>sql&gt;</Text>
              <Text style={styles.commandText}>{cmd.input}</Text>
            </View>
            
            {cmd.error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{cmd.error}</Text>
              </View>
            ) : (
              <View style={styles.resultContainer}>
                {cmd.output.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.resultRow}>
                    {Object.entries(row).map(([key, value]) => (
                      <View key={key} style={styles.resultCell}>
                        <Text style={styles.resultKey}>{key}:</Text>
                        <Text style={styles.resultValue}>{String(value)}</Text>
                      </View>
                    ))}
                  </View>
                ))}
                {cmd.output.length === 0 && (
                  <Text style={styles.emptyResult}>查询成功，但没有返回结果</Text>
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <Text style={styles.prompt}>sql&gt;</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={currentInput}
          onChangeText={setCurrentInput}
          onSubmitEditing={executeCommand}
          onKeyPress={handleKeyPress}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="输入 SQL 命令..."
          placeholderTextColor="#666"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#000',
  },
  title: {
    marginBottom: 16,
    color: '#fff',
  },
  outputContainer: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 8,
    marginBottom: 16,
  },
  outputContent: {
    padding: 12,
  },
  commandContainer: {
    marginBottom: 16,
  },
  inputLine: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  prompt: {
    color: '#0f0',
    marginRight: 8,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  commandText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: '#300',
    padding: 8,
    borderRadius: 4,
    marginLeft: 20,
  },
  errorText: {
    color: '#f00',
    fontFamily: 'monospace',
    fontSize: 14,
  },
  resultContainer: {
    marginLeft: 20,
  },
  resultRow: {
    backgroundColor: '#111',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  resultCell: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  resultKey: {
    color: '#0ff',
    fontFamily: 'monospace',
    fontSize: 14,
    marginRight: 8,
    minWidth: 100,
  },
  resultValue: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 14,
    flex: 1,
  },
  emptyResult: {
    color: '#888',
    fontFamily: 'monospace',
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 14,
    padding: 0,
  },
}); 