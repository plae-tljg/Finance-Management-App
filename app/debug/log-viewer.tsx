import { SafeAreaView } from 'react-native-safe-area-context';
import { DebugLogViewer } from '@/components/settings/DebugLogViewer';

export default function DebugLogViewerScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <DebugLogViewer />
    </SafeAreaView>
  );
} 