import { ScrollView, StyleSheet } from 'react-native';

import { SettingsPanel } from '@/features/settings/SettingsPanel';
import { colors } from '@/theme/tokens';

export default function SettingsScreen(): React.JSX.Element {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <SettingsPanel />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, paddingBottom: 110, gap: 12 },
});
