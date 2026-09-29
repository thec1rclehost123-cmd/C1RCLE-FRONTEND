import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { fetchMyOrganizations, login as loginRequest } from '@/api/scannerApiClient';
import { notifyAuthStateChanged } from '@/auth/authState';
import { setStaffSession } from '@/auth/staffAuth';
import {
  bindOrganizationId,
  chooseOrganization,
  getBoundOrganizationId,
  getConfiguredOrganizationId,
  type OrganizationChoice,
} from '@/auth/venueBinding';
import { DjConsole } from '@/components/decor/DjConsole';
import { HeroRays } from '@/components/decor/HeroRays';
import { RadialGlow } from '@/components/decor/RadialGlow';
import { ScatterAccents } from '@/components/decor/ScatterAccents';
import { GalaTextInput } from '@/components/GalaTextInput';
import { SplitButton } from '@/components/SplitButton';
import { colors, typography } from '@/theme/tokens';

/**
 * Login, transcribed from the `isLogin` block in
 * ui_example/claude_design_ui/Circle Scanner.html (lines 220-281). Every
 * measurement below has a line in that markup; none are estimated.
 */

const HERO_HEIGHT = 330;

const HERO_ACCENTS = [
  { leftPct: 18, topPct: 29, width: 7, height: 14, color: colors.primary, rotationDeg: 30 },
  { leftPct: 40, topPct: 45, width: 5, height: 11, color: colors.secondary, rotationDeg: -25 },
  { leftPct: 10, topPct: 64, width: 6, height: 6, color: colors.onSurface, rotationDeg: 45 },
  { leftPct: 92, topPct: 82, width: 8, height: 8, color: colors.secondary, rotationDeg: 20 },
  { leftPct: 48, topPct: 18, width: 4, height: 10, color: colors.onSurface, rotationDeg: 70 },
] as const;

export default function LoginScreen(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [heroWidth, setHeroWidth] = useState(0);
  // Null while still reading; the field below only appears if this handset
  // has never been bound to a venue. See src/auth/venueBinding.ts.
  const [boundOrganizationId, setBoundOrganizationId] = useState<string | null>(null);
  const [organizationIdDraft, setOrganizationIdDraft] = useState('');
  // Set when the account is a member of more than one venue, so the staffer
  // picks instead of the app guessing (see chooseOrganization).
  const [choices, setChoices] = useState<OrganizationChoice | null>(null);
  // Credentials held only between the "pick a venue" prompt and the tap.
  const [pendingSession, setPendingSession] = useState<Awaited<
    ReturnType<typeof loginRequest>
  > | null>(null);

  useEffect(() => {
    void getBoundOrganizationId()
      .then(setBoundOrganizationId)
      .catch(() => {
        // Unreadable storage is a valid state, not a crash: fall through to
        // asking for the venue id.
        setBoundOrganizationId(null);
      });
  }, []);

  const needsVenueSetup = boundOrganizationId === null;

  const handleHeroLayout = (event: LayoutChangeEvent): void => {
    setHeroWidth(event.nativeEvent.layout.width);
  };

  /** Bind the venue and open the staff session, then let the layout route on. */
  const completeSignIn = async (
    response: Awaited<ReturnType<typeof loginRequest>>,
    organizationId: string,
    shouldBind: boolean,
  ): Promise<void> => {
    if (shouldBind) {
      await bindOrganizationId(organizationId);
    }
    setStaffSession({
      accessToken: response.accessToken,
      organizationId,
      user: response.user,
      expiresAt: response.expiresAt,
    });
    // Not router.replace: the root layout owns navigation post-login,
    // driven by the auth state this notifies it to re-check. A direct
    // replace() here raced the root layout's own stale-state redirect —
    // pathname would change to the target before the async pairing/
    // session check caught up, so the OLD 'logged_out' state's redirect
    // fired first and bounced straight back to /login despite a 200.
    notifyAuthStateChanged();
  };

  const handleLogin = (): void => {
    if (email.length === 0 || password.length === 0) {
      setError('Enter your staff ID and password.');
      return;
    }
    setError(null);
    setLoading(true);
    void loginRequest(email.trim(), password)
      .then(async (response) => {
        // Always ask the backend which venues this account belongs to, even
        // when a venue is already known. It is one cheap GET, and it is the
        // only way to tell a valid binding from a stale one: a handset bound
        // for a previous account would otherwise pin every call to a venue
        // this user cannot see, and the backend answers that with an empty
        // list rather than an error — the exact silent failure this
        // discovery exists to remove.
        const memberships = await fetchMyOrganizations(response.accessToken);
        const memberIds = new Set(memberships.map((organization) => organization.id));
        const configured = getConfiguredOrganizationId();

        // An operator pin is never silently overridden. A build pointed at a
        // venue the signed-in account cannot access is a deployment mistake,
        // and quietly pointing the scanner somewhere else would hide it.
        if (configured !== null && !memberIds.has(configured)) {
          setError(
            'This build is pinned to a venue your account cannot access. Check EXPO_PUBLIC_ORGANIZATION_ID.',
          );
          return;
        }

        const known = configured ?? boundOrganizationId ?? organizationIdDraft.trim();
        // Config, binding and a typed id are all only honoured when this
        // account is genuinely a member; anything else falls through to
        // discovery below.
        if (known.length > 0 && memberIds.has(known)) {
          await completeSignIn(response, known, needsVenueSetup);
          return;
        }

        const choice = chooseOrganization(memberships);
        if (choice.kind === 'ambiguous') {
          // Hold the credentials so tapping a venue finishes the sign-in
          // without a second round trip. Not persisted: a dead app must
          // not leave a usable access token lying in memory.
          setPendingSession(response);
          setChoices(choice);
          setError('This account works for more than one venue. Pick the one this handset is at.');
          return;
        }
        if (choice.kind === 'none') {
          setError(
            'This account is not a member of any venue yet. Ask a venue owner to invite you, or type a venue ID below.',
          );
          return;
        }
        await completeSignIn(response, choice.organizationId, true);
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Sign-in failed.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSelectOrganization = (organizationId: string): void => {
    const pending = pendingSession;
    setChoices(null);
    setPendingSession(null);
    if (pending === null) {
      // Credentials expired between the prompt and the tap — start over
      // rather than opening a session we can no longer prove.
      setError('Your sign-in expired. Please log in again.');
      return;
    }
    setError(null);
    setLoading(true);
    void completeSignIn(pending, organizationId, true)
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Sign-in failed.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.hero} onLayout={handleHeroLayout}>
        {heroWidth > 0 ? <HeroRays width={heroWidth} height={HERO_HEIGHT} /> : null}
        <View style={styles.heroGlow}>
          <RadialGlow width={260} height={260} color={colors.primary} stopOpacity={0.22} />
        </View>

        <View style={styles.consoleWrap}>
          <DjConsole />
        </View>

        <ScatterAccents accents={HERO_ACCENTS} />

        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkLabel}>C</Text>
          </View>
          <View>
            <Text style={styles.brandName}>THE C1RCLE</Text>
            <Text style={styles.brandSub}>SCANNER</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>
          Let the{'\n'}
          <Text style={styles.heroTitleAccent}>night in.</Text>
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.intro}>Sign in with your staff account to scan tickets and run the door.</Text>

        <GalaTextInput
          label="STAFF ID OR PHONE"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="e.g. 98200 11223"
          surface
        />

        <GalaTextInput
          label="PASSWORD"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholder="••••••••"
          surface
          style={styles.passwordInput}
          accessory={
            <Pressable
              onPress={() => {
                setShowPassword((show) => !show);
              }}
              style={styles.showButton}
            >
              <Text style={styles.showButtonLabel}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
            </Pressable>
          }
        />

        {choices?.kind === 'ambiguous' ? (
          <View style={styles.venueChoices}>
            <Text style={styles.venueChoicesLabel}>WHICH VENUE IS THIS HANDSET AT?</Text>
            {choices.organizations.map((organization) => (
              <Pressable
                key={organization.id}
                style={styles.venueChoice}
                onPress={() => {
                  handleSelectOrganization(organization.id);
                }}
              >
                <Text style={styles.venueChoiceName}>{organization.name}</Text>
                <Text style={styles.venueChoiceMeta}>
                  {organization.role.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {needsVenueSetup ? (
          <GalaTextInput
            label="VENUE ID · ONE-TIME SETUP"
            value={organizationIdDraft}
            onChangeText={setOrganizationIdDraft}
            autoCapitalize="none"
            placeholder="Ask your manager"
            surface
          />
        ) : null}

        <View style={styles.rememberRow}>
          <Pressable
            onPress={() => {
              setRemember((value) => !value);
            }}
            style={styles.rememberLeft}
          >
            <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
              {remember ? <Text style={styles.checkboxTick}>✓</Text> : null}
            </View>
            <Text style={styles.rememberLabel}>Remember this device</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setError(null);
            }}
          >
            <Text style={styles.forgotLabel}>Forgot?</Text>
          </Pressable>
        </View>

        {error !== null ? <Text style={styles.error}>{error}</Text> : null}

        <SplitButton label="LOG IN" onPress={handleLogin} loading={loading} />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          style={styles.gateCodeButton}
          onPress={() => {
            // The contract has no gate-access-code auth endpoint — a door
            // code exists, but it's redeemed AFTER staff login (the
            // /redeem screen), not an alternative to it. This button used
            // to call `handleLogin`, which silently required the exact
            // same staff-ID+password fields — a dead affordance identical
            // to the primary button. Say so honestly instead of faking a
            // path that doesn't exist yet.
            setError('Gate access codes aren’t available yet — sign in with your staff account above.');
          }}
        >
          <Text style={styles.gateCodeLabel}>Use a gate access code</Text>
        </Pressable>

        <Text style={styles.footNote}>STAFF ACCESS ONLY · v2.4</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
  },
  hero: {
    position: 'relative',
    height: HERO_HEIGHT,
    overflow: 'hidden',
    flexShrink: 0,
  },
  heroGlow: {
    position: 'absolute',
    right: -60,
    top: 40,
    width: 260,
    height: 260,
  },
  brandRow: {
    position: 'absolute',
    left: 20,
    top: 10,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkLabel: {
    fontFamily: 'Anton_400Regular',
    fontSize: 18,
    color: colors.onPrimary,
  },
  brandName: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 14,
    letterSpacing: 0.28,
    color: colors.onSurface,
  },
  brandSub: {
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 10,
    letterSpacing: 2,
    color: colors.onSurfaceMuted,
  },
  consoleWrap: {
    position: 'absolute',
    left: '50%',
    top: 40,
    width: 330,
    marginLeft: -165,
    zIndex: 1,
  },
  heroTitle: {
    position: 'absolute',
    left: 20,
    bottom: 6,
    zIndex: 2,
    fontFamily: 'Anton_400Regular',
    fontSize: 66,
    lineHeight: 59,
    textTransform: 'uppercase',
    color: colors.onSurface,
  },
  heroTitleAccent: {
    color: colors.primary,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    gap: 14,
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
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rememberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxTick: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.onPrimary,
  },
  rememberLabel: {
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 13,
    color: colors.onSurface,
  },
  forgotLabel: {
    fontFamily: 'Archivo_700Bold',
    fontSize: 13,
    color: colors.secondary,
  },
  error: {
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
    color: colors.primary,
  },
  venueChoices: {
    gap: 8,
  },
  venueChoicesLabel: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1.1,
    color: colors.onSurfaceMuted,
  },
  venueChoice: {
    minHeight: 54,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  venueChoiceName: {
    fontFamily: 'Archivo_700Bold',
    fontSize: 15,
    color: colors.onSurface,
    flexShrink: 1,
  },
  venueChoiceMeta: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 10,
    letterSpacing: 1.1,
    color: colors.onSurfaceMuted,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.surfaceRaised,
  },
  dividerLabel: {
    fontFamily: 'Archivo_700Bold',
    fontSize: 11,
    letterSpacing: 1.54,
    color: colors.onSurfaceFaint,
  },
  gateCodeButton: {
    height: 54,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateCodeLabel: {
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
