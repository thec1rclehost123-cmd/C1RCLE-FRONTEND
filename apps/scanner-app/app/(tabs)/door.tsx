import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  fetchDoorSales,
  submitDineIn,
  submitTicketSale,
  submitWalkIn,
} from '@/api/scannerApiClient';
import { getSessionMeta } from '@/auth/scannerSession';
import { showToast } from '@/features/toast/toastStore';
import { colors } from '@/theme/tokens';

import type { DoorSale, PaymentMode } from '@/api/schemas';
import type { SessionTier } from '@/auth/scannerSession';

/**
 * Door — the reference's `isDoor` block (lines 411-468) plus Phase 2's paid
 * walk-up sale, which the reference has no counterpart for.
 *
 * Ticket sale is folded into the existing form as a third entry Type rather
 * than a fourth segment: the form already asks "what kind of entry is this",
 * and the reference's three-segment control is the shape being matched.
 *
 * Contract rules enforced here (`docs/api-contracts/scanner-app.md` §9):
 *   - `totalGuests` is the priced party size and is required on BOTH walk-in
 *     and dine-in, not just dine-in.
 *   - `paymentMode` is required on every money call.
 *   - Sending `tierId`/`quantity` to walk-in or dine-in is a 422 — a tier is
 *     what ticket-sale is for.
 *   - No price is ever sent. The tier decides it server-side.
 *   - `replayed: true` on a ticket sale means the retry reached the original
 *     order: staff must NOT collect payment again.
 */

type Segment = 'form' | 'walk' | 'dine';
type EntryType = 'walk' | 'dine' | 'ticket';

const SEGMENTS: readonly { key: Segment; label: string }[] = [
  { key: 'form', label: 'ENTRY FORM' },
  { key: 'walk', label: 'WALK-INS' },
  { key: 'dine', label: 'DINE-IN' },
];

const PAYMENT_MODES: readonly PaymentMode[] = ['cash', 'card', 'upi', 'other'];

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function FieldLabel({
  children,
  required = false,
}: {
  readonly children: string;
  readonly required?: boolean;
}): React.JSX.Element {
  return (
    <Text style={styles.fieldLabel}>
      {children}
      {required ? <Text style={styles.requiredMark}> *</Text> : null}
    </Text>
  );
}

function ChoiceButton({
  label,
  selected,
  onPress,
  compact = false,
}: {
  readonly label: string;
  readonly selected: boolean;
  readonly onPress: () => void;
  readonly compact?: boolean;
}): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.choice,
        compact && styles.choiceCompact,
        selected ? styles.choiceOn : styles.choiceOff,
      ]}
    >
      <Text
        style={[
          compact ? styles.choiceLabelCompact : styles.choiceLabel,
          selected ? styles.choiceLabelOn : styles.choiceLabelOff,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function DoorScreen(): React.JSX.Element {
  const router = useRouter();
  const [segment, setSegment] = useState<Segment>('form');
  const [tiers, setTiers] = useState<SessionTier[]>([]);
  const [canWalkIn, setCanWalkIn] = useState(true);
  const [canCharge, setCanCharge] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [age, setAge] = useState('');
  const [entryType, setEntryType] = useState<EntryType | null>(null);
  const [guests, setGuests] = useState(2);
  const [tierId, setTierId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // One key per user intent. Rotated only after a sale actually succeeds —
  // never per network attempt, or a retry becomes a second charge.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  // The exact field values the current `idempotencyKey` was minted for. If a
  // submit fails (or silently succeeds but the response is lost) and staff
  // then edits the form before resubmitting, the key must NOT be replayed —
  // the backend's idempotency store would return the cached response for the
  // OLD field values, showing a false "success" for data that was never
  // actually sent. Comparing against a signature of the fields (not a
  // per-field onChange handler) means every field is covered, including the
  // plain TextInputs (name/phone/email/age) that don't otherwise clear
  // `formError` on change.
  const lastAttemptSignature = useRef<string | null>(null);
  const [sales, setSales] = useState<DoorSale[]>([]);
  const [salesError, setSalesError] = useState<string | null>(null);
  // Bumped only after a submission actually succeeds (see `resetForm`), not
  // on every `submitting` transition — depending on `submitting` directly
  // refetched once when a submit STARTED (redundant — nothing changed yet)
  // and again when it ended, and the two could race, occasionally showing
  // sales counts from before the just-submitted entry landed.
  const [salesRefreshTick, setSalesRefreshTick] = useState(0);

  useEffect(() => {
    void getSessionMeta().then((meta) => {
      setTiers(meta?.tiers ?? []);
      setCanWalkIn(meta?.permissions.canWalkIn ?? false);
      setCanCharge(meta?.permissions.canCharge ?? false);
    });
  }, []);

  useEffect(() => {
    if (segment === 'form') {
      return;
    }
    void getSessionMeta()
      .then((meta) => {
        if (meta === null) {
          throw new Error('No active scanner session.');
        }
        return fetchDoorSales(meta.event.id, segment === 'dine' ? 'dinein' : 'walkin');
      })
      .then((items) => {
        setSales(items);
        setSalesError(null);
      })
      .catch((cause: unknown) => {
        setSalesError(cause instanceof Error ? cause.message : 'Could not load entries.');
      });
  }, [segment, salesRefreshTick]);

  const selectedTier = tiers.find((tier) => tier.id === tierId) ?? null;
  const isTicket = entryType === 'ticket';

  const resetForm = (): void => {
    setName('');
    setPhone('');
    setEmail('');
    setGender(null);
    setAge('');
    setEntryType(null);
    setGuests(2);
    setTierId(null);
    setQuantity(1);
    setIdempotencyKey(crypto.randomUUID());
    lastAttemptSignature.current = null;
  };

  const handleSubmit = (): void => {
    if (name.trim().length === 0) {
      setFormError('Person name is required.');
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      setFormError('Enter a valid 10-digit number.');
      return;
    }
    if (gender === null) {
      setFormError('Select gender.');
      return;
    }
    if (age.length === 0 || Number(age) < 18) {
      setFormError('Enter an age of 18 or over.');
      return;
    }
    if (entryType === null) {
      setFormError('Select entry type.');
      return;
    }
    if (entryType === 'ticket' && selectedTier === null) {
      setFormError('Select a ticket tier.');
      return;
    }
    setFormError(null);
    setSubmitting(true);

    const submittedName = name.trim();
    const submittedType = entryType;
    const attemptSignature = JSON.stringify({
      name: submittedName,
      phone,
      email: email.trim(),
      gender,
      age,
      entryType,
      guests,
      tierId,
      quantity,
      paymentMode,
    });
    const submissionKey =
      attemptSignature === lastAttemptSignature.current ? idempotencyKey : crypto.randomUUID();
    lastAttemptSignature.current = attemptSignature;
    if (submissionKey !== idempotencyKey) {
      setIdempotencyKey(submissionKey);
    }
    void getSessionMeta()
      .then(async (meta) => {
        if (meta === null) {
          throw new Error('No active scanner session.');
        }
        const person = {
          guestName: submittedName,
          guestPhone: phone,
          guestAge: Number(age),
          gender,
          gate: meta.gate,
          paymentMode,
          idempotencyKey: submissionKey,
          ...(email.trim().length > 0 ? { guestEmail: email.trim() } : {}),
        };
        if (submittedType === 'ticket' && selectedTier !== null) {
          const sale = await submitTicketSale({
            eventId: meta.event.id,
            tierId: selectedTier.id,
            quantity,
            ...person,
          });
          // The contract is explicit: a replayed sale is the SAME order.
          // Staff must be told not to take the money twice.
          showToast(
            sale.replayed
              ? `Already sold — do not collect again (${rupees(sale.amountPaise)})`
              : `${submittedName} · ${String(sale.quantity)} × ${selectedTier.name} · ${rupees(sale.amountPaise)}`,
          );
          return;
        }
        const entry = {
          eventId: meta.event.id,
          totalGuests: guests,
          ...person,
        };
        await (submittedType === 'dine' ? submitDineIn(entry) : submitWalkIn(entry));
        showToast(`${submittedName} added to ${submittedType === 'dine' ? 'Dine-in' : 'Walk-ins'}`);
      })
      .then(() => {
        resetForm();
        setSalesRefreshTick((tick) => tick + 1);
      })
      .catch((cause: unknown) => {
        setFormError(cause instanceof Error ? cause.message : 'Could not record this entry.');
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const isDine = segment === 'dine';
  const totalHeads = sales.reduce((sum, sale) => sum + sale.totalGuests, 0);
  const totalTaken = sales.reduce((sum, sale) => sum + sale.amountPaise, 0);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Door</Text>
          <Text style={styles.subtitle}>Guests, walk-ins and dine-in registers.</Text>
        </View>
        {/* Cover-tab charging is its own screen rather than a sixth tab: the
            reference's nav is a fixed five, and this surface only exists for
            shifts granted `canCharge`. */}
        {canCharge ? (
          <Pressable
            onPress={() => {
              router.push('/wallet');
            }}
            style={styles.coverTabButton}
          >
            <Text style={styles.coverTabLabel}>COVER TAB</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.segmented}>
        {SEGMENTS.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => {
              setSegment(item.key);
            }}
            style={[styles.segment, segment === item.key && styles.segmentActive]}
          >
            <Text style={[styles.segmentLabel, segment === item.key && styles.segmentLabelActive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {segment === 'form' ? (
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>New{'\n'}Entry</Text>
            <Text style={styles.requiredNote}>* REQUIRED</Text>
          </View>

          {!canWalkIn ? (
            <Text style={styles.permissionNote}>
              This shift has no door-entry permission. Entries will be refused by the server.
            </Text>
          ) : null}

          <View style={styles.field}>
            <FieldLabel required>PERSON NAME</FieldLabel>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter full name…"
              placeholderTextColor={colors.onSurfaceFaint}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <FieldLabel required>CONTACT NO</FieldLabel>
            <TextInput
              value={phone}
              onChangeText={(text) => {
                setPhone(text.replace(/\D/g, '').slice(0, 10));
              }}
              keyboardType="numeric"
              placeholder="10-digit mobile number"
              placeholderTextColor={colors.onSurfaceFaint}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <FieldLabel>EMAIL</FieldLabel>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Enter email (optional)…"
              placeholderTextColor={colors.onSurfaceFaint}
              style={styles.input}
            />
          </View>

          <View style={styles.genderAgeRow}>
            <View style={styles.genderColumn}>
              <FieldLabel required>GENDER</FieldLabel>
              <View style={styles.twoUp}>
                <ChoiceButton
                  label="Male"
                  selected={gender === 'male'}
                  onPress={() => {
                    setGender('male');
                    setFormError(null);
                  }}
                />
                <ChoiceButton
                  label="Female"
                  selected={gender === 'female'}
                  onPress={() => {
                    setGender('female');
                    setFormError(null);
                  }}
                />
              </View>
            </View>
            <View style={styles.ageColumn}>
              <FieldLabel required>AGE</FieldLabel>
              <TextInput
                value={age}
                onChangeText={(text) => {
                  setAge(text.replace(/\D/g, '').slice(0, 3));
                }}
                keyboardType="numeric"
                placeholder="Age"
                placeholderTextColor={colors.onSurfaceFaint}
                style={styles.ageInput}
              />
            </View>
          </View>

          <View style={styles.field}>
            <FieldLabel required>TYPE</FieldLabel>
            <View style={styles.twoUp}>
              <ChoiceButton
                label="Walk-in"
                selected={entryType === 'walk'}
                onPress={() => {
                  setEntryType('walk');
                  setFormError(null);
                }}
              />
              <ChoiceButton
                label="Dine-in"
                selected={entryType === 'dine'}
                onPress={() => {
                  setEntryType('dine');
                  setFormError(null);
                }}
              />
              <ChoiceButton
                label="Ticket"
                selected={entryType === 'ticket'}
                onPress={() => {
                  setEntryType('ticket');
                  setFormError(null);
                }}
              />
            </View>
          </View>

          {isTicket ? (
            <View style={styles.field}>
              <FieldLabel required>TIER</FieldLabel>
              {tiers.length === 0 ? (
                <Text style={styles.permissionNote}>This shift has no sellable tiers.</Text>
              ) : (
                <View style={styles.tierList}>
                  {tiers.map((tier) => {
                    const soldOut = tier.available !== null && tier.available <= 0;
                    return (
                      <Pressable
                        key={tier.id}
                        disabled={soldOut}
                        onPress={() => {
                          setTierId(tier.id);
                          setFormError(null);
                        }}
                        style={[
                          styles.tierRow,
                          tierId === tier.id && styles.tierRowActive,
                          soldOut && styles.tierRowDisabled,
                        ]}
                      >
                        <View style={styles.tierText}>
                          <Text style={styles.tierName}>{tier.name}</Text>
                          <Text style={styles.tierMeta}>
                            {soldOut
                              ? 'Sold out'
                              : tier.available === null
                                ? tier.entryType
                                : `${String(tier.available)} left · ${tier.entryType}`}
                          </Text>
                        </View>
                        <Text style={styles.tierPrice}>{rupees(tier.pricePaise)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          ) : null}

          {entryType !== null ? (
            <View style={styles.stepperRow}>
              <Text style={styles.stepperLabel}>{isTicket ? 'QUANTITY' : 'GUESTS AT TABLE'}</Text>
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => {
                    if (isTicket) {
                      setQuantity((n) => Math.max(1, n - 1));
                    } else {
                      setGuests((n) => Math.max(1, n - 1));
                    }
                  }}
                  style={styles.stepperButton}
                >
                  <Text style={styles.stepperButtonLabel}>−</Text>
                </Pressable>
                <Text style={styles.stepperValue}>{isTicket ? quantity : guests}</Text>
                <Pressable
                  onPress={() => {
                    if (isTicket) {
                      setQuantity((n) => Math.min(20, n + 1));
                    } else {
                      setGuests((n) => Math.min(20, n + 1));
                    }
                  }}
                  style={styles.stepperButton}
                >
                  <Text style={styles.stepperButtonLabel}>+</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={styles.field}>
            <FieldLabel required>PAYMENT</FieldLabel>
            <View style={styles.twoUp}>
              {PAYMENT_MODES.map((mode) => (
                <ChoiceButton
                  key={mode}
                  compact
                  label={mode.toUpperCase()}
                  selected={paymentMode === mode}
                  onPress={() => {
                    setPaymentMode(mode);
                  }}
                />
              ))}
            </View>
          </View>

          {/* Shown so staff collect the right cash. The server recomputes it
              and is the authority — this is never sent. */}
          {isTicket && selectedTier !== null ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TO COLLECT</Text>
              <Text style={styles.totalValue}>{rupees(selectedTier.pricePaise * quantity)}</Text>
            </View>
          ) : null}

          {formError !== null ? <Text style={styles.formError}>{formError}</Text> : null}

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.submit, styles.submitOn]}
          >
            <Text style={styles.submitLabel}>
              {submitting ? 'SUBMITTING…' : isTicket ? 'SELL TICKET' : 'SUBMIT ENTRY'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.statGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{isDine ? 'TABLES' : 'WALK-INS'}</Text>
              <Text style={styles.statValue}>{sales.length}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{isDine ? 'TOTAL GUESTS' : 'HEADS'}</Text>
              <Text style={styles.statValue}>{totalHeads}</Text>
            </View>
          </View>

          <View style={styles.listCard}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>{isDine ? 'DINE-IN ENTRIES' : 'WALK-IN ENTRIES'}</Text>
              <Text style={styles.listTotal}>{rupees(totalTaken)}</Text>
            </View>
            {salesError !== null ? <Text style={styles.listEmpty}>{salesError}</Text> : null}
            {salesError === null && sales.length === 0 ? (
              <Text style={styles.listEmpty}>No entries yet.</Text>
            ) : null}
            {sales.map((sale) => (
              <View key={sale.id} style={styles.listRow}>
                <View style={[styles.avatar, isDine ? styles.avatarDine : styles.avatarWalk]}>
                  <Text style={[styles.avatarLabel, isDine && styles.avatarLabelDine]}>
                    {initials(sale.guestName)}
                  </Text>
                </View>
                <View style={styles.listRowText}>
                  <Text style={styles.listRowName}>{sale.guestName}</Text>
                  <Text style={styles.listRowMeta}>
                    {sale.totalGuests} pax · {sale.paymentMode}
                  </Text>
                </View>
                <View style={styles.listRowRight}>
                  <Text style={styles.listRowValue}>{rupees(sale.amountPaise)}</Text>
                  <Text style={styles.listRowTime}>{sale.status}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, paddingBottom: 110, gap: 12 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: { paddingHorizontal: 4, flexShrink: 1 },
  coverTabButton: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  coverTabLabel: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 11,
    letterSpacing: 0.9,
    color: colors.onSurface,
  },
  title: {
    fontFamily: 'Anton_400Regular',
    fontSize: 44,
    lineHeight: 40,
    textTransform: 'uppercase',
    color: colors.onSurface,
  },
  subtitle: {
    fontFamily: 'Archivo_400Regular',
    fontSize: 13,
    color: colors.onSurfaceMuted,
    marginTop: 6,
  },

  segmented: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceRaised,
  },
  segment: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: { backgroundColor: colors.onSurface },
  segmentLabel: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 12,
    letterSpacing: 0.72,
    color: colors.onSurfaceMuted,
  },
  segmentLabelActive: { color: colors.background },

  formCard: {
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceRaised,
    padding: 18,
    gap: 14,
  },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  formTitle: {
    fontFamily: 'Anton_400Regular',
    fontSize: 30,
    lineHeight: 28,
    textTransform: 'uppercase',
    color: colors.onSurface,
  },
  requiredNote: {
    fontFamily: 'Archivo_700Bold',
    fontSize: 11,
    letterSpacing: 1.54,
    color: colors.onSurfaceMuted,
  },
  permissionNote: {
    fontFamily: 'Archivo_400Regular',
    fontSize: 12,
    color: colors.onSurfaceFaint,
    lineHeight: 17,
  },

  field: { gap: 7 },
  fieldLabel: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1.54,
    color: colors.onSurfaceMuted,
  },
  requiredMark: { color: colors.primary },
  input: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.onSurface,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
  },

  genderAgeRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  genderColumn: { flex: 2, gap: 7 },
  ageColumn: { flex: 0.9, gap: 7 },
  ageInput: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.onSurface,
    paddingHorizontal: 14,
    fontFamily: 'Anton_400Regular',
    fontSize: 20,
    letterSpacing: 0.4,
  },
  twoUp: { flexDirection: 'row', gap: 8 },
  choice: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceCompact: { height: 42 },
  choiceOn: { backgroundColor: colors.onSurface, borderColor: colors.onSurface },
  choiceOff: { backgroundColor: colors.background, borderColor: colors.border },
  choiceLabel: {
    fontFamily: 'Anton_400Regular',
    fontSize: 17,
    letterSpacing: 0.68,
    textTransform: 'uppercase',
  },
  choiceLabelCompact: { fontFamily: 'Archivo_800ExtraBold', fontSize: 11, letterSpacing: 0.9 },
  choiceLabelOn: { color: colors.background },
  choiceLabelOff: { color: colors.onSurfaceMuted },

  tierList: { gap: 8 },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: 14,
  },
  tierRowActive: { borderColor: colors.primary },
  tierRowDisabled: { opacity: 0.4 },
  tierText: { flex: 1 },
  tierName: { fontFamily: 'Archivo_700Bold', fontSize: 14, color: colors.onSurface },
  tierMeta: { fontFamily: 'Archivo_400Regular', fontSize: 12, color: colors.onSurfaceMuted },
  tierPrice: { fontFamily: 'Anton_400Regular', fontSize: 20, color: colors.onSurface },

  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: 16,
    padding: 8,
  },
  stepperLabel: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1.54,
    color: colors.onSurfaceMuted,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonLabel: { fontSize: 18, color: colors.onSurface },
  stepperValue: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    color: colors.onSurface,
    minWidth: 18,
    textAlign: 'center',
  },

  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    backgroundColor: colors.badgeLiveBg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  totalLabel: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1.54,
    color: colors.primary,
  },
  totalValue: { fontFamily: 'Anton_400Regular', fontSize: 24, color: colors.primary },

  formError: { fontFamily: 'Archivo_600SemiBold', fontSize: 12, color: colors.primary },
  submit: {
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitOn: { backgroundColor: colors.primary },
  submitLabel: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 14,
    letterSpacing: 1.96,
    color: colors.background,
  },

  statGrid: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceRaised,
    padding: 16,
  },
  statLabel: {
    fontFamily: 'Archivo_700Bold',
    fontSize: 11,
    letterSpacing: 1.54,
    color: colors.onSurfaceMuted,
  },
  statValue: {
    fontFamily: 'Anton_400Regular',
    fontSize: 36,
    lineHeight: 40,
    color: colors.onSurface,
  },

  listCard: {
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceRaised,
  },
  listTitle: {
    fontFamily: 'Archivo_700Bold',
    fontSize: 11,
    letterSpacing: 1.54,
    color: colors.onSurfaceMuted,
  },
  listTotal: { fontFamily: 'Anton_400Regular', fontSize: 16, color: colors.onSurface },
  listEmpty: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    textAlign: 'center',
    fontSize: 13,
    color: colors.onSurfaceMuted,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceRaised,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWalk: { backgroundColor: colors.surfaceRaised },
  avatarDine: { backgroundColor: colors.tertiary },
  avatarLabel: { fontFamily: 'Archivo_800ExtraBold', fontSize: 13, color: colors.onSurface },
  avatarLabelDine: { color: '#f2b8a8' },
  listRowText: { flex: 1 },
  listRowName: { fontFamily: 'Archivo_700Bold', fontSize: 14, color: colors.onSurface },
  listRowMeta: { fontFamily: 'Archivo_400Regular', fontSize: 12, color: colors.onSurfaceMuted },
  listRowRight: { alignItems: 'flex-end' },
  listRowValue: { fontFamily: 'Archivo_700Bold', fontSize: 13, color: colors.onSurface },
  listRowTime: { fontFamily: 'Archivo_400Regular', fontSize: 11, color: colors.onSurfaceMuted },
});
