import { StyleSheet, Text } from 'react-native';

import { colors, radii, spacing } from '@/theme/tokens';

import { useToastMessage } from './toastStore';

/** Renders once at the tab-shell root — matches the reference's fixed top banner. */
export function ToastHost(): React.JSX.Element | null {
  const message = useToastMessage();
  if (message === null) {
    return null;
  }
  return <Text style={styles.toast}>{message}</Text>;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 58,
    zIndex: 50,
    borderRadius: radii.sm,
    backgroundColor: colors.secondary,
    color: colors.onSecondary,
    padding: spacing.sm,
    fontWeight: '700',
    fontSize: 14,
  },
});
