import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, {
  ClipPath,
  Defs,
  Ellipse,
  G,
  Path,
  Polygon,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import { Turntable } from '@/components/decor/Turntable';
import { colors } from '@/theme/tokens';

/**
 * The Select Event cards each carry their own 3D composition in the
 * reference (lines 300-349 of ui_example/claude_design_ui/Circle
 * Scanner.html) — a record and sleeve, balloons, a lone turntable, party
 * hats. The earlier build reused one turntable on every card, which lost
 * what makes the list read as four different nights.
 *
 * Art is chosen by position, matching the reference's fixed order, because
 * the API gives no styling hint — see `EVENT_CARD_ART` in redeem.tsx.
 */

/** `@keyframes floaty` — a 6px bob with a per-instance rotation held. */
function Floaty({
  rotationDeg,
  durationMs,
  delayMs = 0,
  children,
}: {
  readonly rotationDeg: number;
  readonly durationMs: number;
  readonly delayMs?: number;
  readonly children: React.ReactNode;
}): React.JSX.Element {
  const [bob] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: durationMs / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
          delay: delayMs,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: durationMs / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [bob, durationMs, delayMs]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <Animated.View style={{ transform: [{ translateY }, { rotate: `${String(rotationDeg)}deg` }] }}>
      {children}
    </Animated.View>
  );
}

function Balloon({
  width,
  from,
  mid,
  to,
  stringHeight,
}: {
  readonly width: number;
  readonly from: string;
  readonly mid: string;
  readonly to: string;
  readonly stringHeight: number;
}): React.JSX.Element {
  const height = width * 1.2;
  const gradientId = `balloon${String(width)}${mid.replace('#', '')}`;
  return (
    <View style={styles.centered}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id={gradientId} cx="34%" cy="28%" r="75%">
            <Stop offset="0%" stopColor={from} />
            <Stop offset="40%" stopColor={mid} />
            <Stop offset="100%" stopColor={to} />
          </RadialGradient>
        </Defs>
        <Ellipse
          cx={width / 2}
          cy={height / 2}
          rx={width / 2}
          ry={height / 2}
          fill={`url(#${gradientId})`}
        />
      </Svg>
      <View style={[styles.balloonKnot, { borderBottomColor: to }]} />
      <View style={[styles.balloonString, { height: stringHeight }]} />
    </View>
  );
}

function PartyHat({
  width,
  stripeA,
  stripeB,
  pompom,
}: {
  readonly width: number;
  readonly stripeA: string;
  readonly stripeB: string;
  readonly pompom: string;
}): React.JSX.Element {
  const height = width * 1.35;
  const pompomSize = width / 3;
  const stripe = width / 6;
  const clipId = `hat${String(width)}${stripeA.replace('#', '')}`;
  const pompomId = `pom${String(width)}${stripeA.replace('#', '')}`;
  // Diagonal bands across the cone, clipped to its triangle. Drawn as paths
  // rather than rects because `Rect`'s `x`/`y` props are deprecated in this
  // version of react-native-svg.
  const bands = Array.from({ length: Math.ceil((width + height) / stripe) + 4 }, (_, index) => {
    const left = -height + index * stripe * 2;
    const right = left + stripe;
    const top = -height;
    const bottom = height * 2;
    return (
      <Path
        key={index}
        d={`M ${String(left)} ${String(top)} L ${String(right)} ${String(top)} L ${String(right)} ${String(bottom)} L ${String(left)} ${String(bottom)} Z`}
        fill={index % 2 === 0 ? stripeA : stripeB}
      />
    );
  });
  return (
    <View style={styles.centered}>
      <Svg width={width} height={height + pompomSize / 2}>
        <Defs>
          <ClipPath id={clipId}>
            <Polygon
              points={`${String(width / 2)},${String(pompomSize / 2)} ${String(width)},${String(height + pompomSize / 2)} 0,${String(height + pompomSize / 2)}`}
            />
          </ClipPath>
          <RadialGradient id={pompomId} cx="35%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="#ffffff" />
            <Stop offset="55%" stopColor={pompom} />
          </RadialGradient>
        </Defs>
        {/* Clip stays in the upright cone's space; only the bands inside it
            rotate, so the cone keeps its shape while the stripes slant. */}
        <G clipPath={`url(#${clipId})`}>
          <G transform={`rotate(-55 ${String(width / 2)} ${String(height / 2)})`}>{bands}</G>
        </G>
        <Ellipse
          cx={width / 2}
          cy={pompomSize / 2}
          rx={pompomSize / 2}
          ry={pompomSize / 2}
          fill={`url(#${pompomId})`}
        />
      </Svg>
    </View>
  );
}

/** Card 0 — a record beside its sleeve. */
function RecordAndSleeve(): React.JSX.Element {
  return (
    <Floaty rotationDeg={-10} durationMs={4000}>
      <View style={styles.recordRow}>
        <View style={styles.sleeve}>
          <Text style={styles.sleeveLabel}>THE{'\n'}C1RCLE</Text>
        </View>
        <View style={styles.recordDisc}>
          <Turntable size={96} labelColor={colors.secondary} durationMs={3000} />
        </View>
      </View>
    </Floaty>
  );
}

export function EventCardArt({ variant }: { readonly variant: number }): React.JSX.Element | null {
  if (variant === 0) {
    return (
      <View style={styles.slotRecord} pointerEvents="none">
        <RecordAndSleeve />
      </View>
    );
  }
  if (variant === 1) {
    return (
      <View style={styles.slotBalloons} pointerEvents="none">
        <Floaty rotationDeg={-12} durationMs={5000} delayMs={1000}>
          <Balloon
            width={42}
            from="#8a4a55"
            mid={colors.tertiary}
            to="#22070d"
            stringHeight={33.6}
          />
        </Floaty>
        <Floaty rotationDeg={10} durationMs={4500} delayMs={300}>
          <Balloon
            width={56}
            from="#ff9d86"
            mid={colors.primary}
            to="#a42b13"
            stringHeight={44.8}
          />
        </Floaty>
      </View>
    );
  }
  if (variant === 2) {
    return (
      <View style={styles.slotDisc} pointerEvents="none">
        <Floaty rotationDeg={0} durationMs={5000} delayMs={200}>
          <Turntable size={110} labelColor={colors.primary} durationMs={3000} />
        </Floaty>
      </View>
    );
  }
  return (
    <View style={styles.slotHats} pointerEvents="none">
      <Floaty rotationDeg={-24} durationMs={5000}>
        <PartyHat
          width={32}
          stripeA={colors.secondary}
          stripeB={colors.background}
          pompom={colors.primary}
        />
      </Floaty>
      <Floaty rotationDeg={18} durationMs={4000} delayMs={800}>
        <PartyHat
          width={58}
          stripeA={colors.primary}
          stripeB={colors.onSurface}
          pompom={colors.secondary}
        />
      </Floaty>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center' },
  slotRecord: { position: 'absolute', right: 14, top: 56 },
  slotBalloons: {
    position: 'absolute',
    right: 22,
    top: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  slotDisc: { position: 'absolute', right: 18, top: 30 },
  slotHats: {
    position: 'absolute',
    right: 30,
    top: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },

  recordRow: { flexDirection: 'row', alignItems: 'center' },
  sleeve: {
    width: 96,
    height: 96,
    borderRadius: 6,
    backgroundColor: colors.background,
    justifyContent: 'flex-end',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  sleeveLabel: {
    fontFamily: 'Anton_400Regular',
    fontSize: 15,
    lineHeight: 14,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  recordDisc: { marginLeft: -52 },

  balloonKnot: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
    transform: [{ rotate: '180deg' }],
  },
  balloonString: { width: 1.5, backgroundColor: colors.background },
});
