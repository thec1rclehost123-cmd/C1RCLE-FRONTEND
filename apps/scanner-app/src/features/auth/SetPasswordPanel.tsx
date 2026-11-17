import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { newPasswordProblem } from '@/auth/passwordRules';
import { GalaTextInput } from '@/components/GalaTextInput';
import { SplitButton } from '@/components/SplitButton';
import { colors, typography } from '@/theme/tokens';

interface SetPasswordPanelProps {
  /** Shown back to the person so they know whose account they are securing. */
  readonly email: string;
  /** The emailed temporary password they just signed in with. */
  readonly temporaryPassword: string;
  /** Saves the new password. Reject with an Error to show its message. */
  readonly onSubmit: (newPassword: string) => Promise<void>;
  /** Back out to the sign-in form (wrong account, or they want to stop). */
  readonly onCancel: () => void;
}

/**
 * The step between "signed in with the emailed password" and "in the app".
 *
 * Rendered by the login screen in place of its form, under the same hero, and
 * built from the same inputs and button so it reads as part of one flow. It
 * holds no session: nothing is stored until the new password is saved.
 */
export function SetPasswordPanel({
  email,
  temporaryPassword,
  onSubmit,
  onCancel,
}: SetPasswordPanelProps): React.JSX.Element {
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (): void => {
    const problem = newPasswordProblem({ temporaryPassword, newPassword, confirmation });
    if (problem !== null) {
      setError(problem);
      return;
    }
    setError(null);
    setLoading(true);
    onSubmit(newPassword)
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Could not set your password.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const toggle = (
    <Pressable
      onPress={() => {
        setShowPassword((show) => !show);
      }}
      style={styles.showButton}
    >
      <Text style={styles.showButtonLabel}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
    </Pressable>
  );

  return (
    <View style={styles.form}>
      <Text style={styles.stepLabel}>FIRST SIGN-IN</Text>
      <Text style={styles.heading}>Set your password</Text>
      <Text style={styles.intro}>
        You signed in with the temporary password from your invite email
        {email.length > 0 ? ` (${email})` : ''}. Choose your own now. The temporary one stops
        working once you do.
      </Text>

      <GalaTextInput
        label="NEW PASSWORD"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="At least 8 characters"
        surface
        style={styles.passwordInput}
        accessory={toggle}
      />

      <GalaTextInput
        label="CONFIRM NEW PASSWORD"
        value={confirmation}
        onChangeText={setConfirmation}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Type it once more"
        surface
        onSubmitEditing={handleSubmit}
      />

      <Text style={styles.tip}>
        Tip: 10 or more characters, with letters and numbers, is harder to guess. Don’t share it —
        every scan is recorded against your name.
      </Text>

      {error !== null ? <Text style={styles.error}>{error}</Text> : null}

      <SplitButton label="SAVE PASSWORD" onPress={handleSubmit} loading={loading} />

      <Pressable style={styles.cancelButton} onPress={onCancel} disabled={loading}>
        <Text style={styles.cancelLabel}>Not you? Sign in with another account</Text>
      </Pressable>

      <Text style={styles.footNote}>STAFF ACCESS ONLY · v2.4</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    gap: 14,
  },
  stepLabel: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1.1,
    color: colors.secondary,
  },
  heading: {
    fontFamily: 'Anton_400Regular',
    fontSize: 30,
    lineHeight: 34,
    textTransform: 'uppercase',
    color: colors.onSurface,
  },
  intro: {
    ...typography.body,
    color: colors.onSurfaceMuted,
    lineHeight: 20,
  },
  passwordInput: {
    paddingRight: 70,
  },
  showButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  showButtonLabel: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1.1,
    color: colors.onSurface,
  },
  tip: {
    fontFamily: 'Archivo_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.onSurfaceFaint,
  },
  error: {
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
    color: colors.primary,
  },
  cancelButton: {
    height: 54,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontFamily: 'Archivo_700Bold',
    fontSize: 14,
    color: colors.onSurface,
  },
  footNote: {
    textAlign: 'center',
    fontFamily: 'Archivo_400Regular',
    fontSize: 11,
    letterSpacing: 0.88,
    color: colors.onSurfaceFaint,
    marginTop: 6,
  },
});
