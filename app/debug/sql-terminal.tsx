import { SafeAreaView } from 'react-native-safe-area-context';
import { SqlTerminal } from '@/components/settings/SqlTerminal';

export default function SqlTerminalScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <SqlTerminal />
    </SafeAreaView>
  );
} 