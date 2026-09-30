import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useId, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { RadialGlow } from '@/components/decor/RadialGlow';
import { polarPoint } from '@/components/decor/wedge';
import { colors } from '@/theme/tokens';

/**
 * The login hero's DJ console, transcribed from the `show3D` block in
 * ui_example/claude_design_ui/Circle Scanner.html (lines 229-259).
 *
 * Two CSS behaviours drive most of the geometry here and were the source of
 * the earlier mismatches:
 *
 * 1. The panel div has no explicit width, so it fills its 330px wrapper as a
 *    border-box — `padding:16px 14px 12px` + `1px` border eat INTO that 330,
 *    leaving 300px of content. Sizing the panel to 302 (the content width)
 *    instead of 330 stole 28px from the flex row and crushed the gaps
 *    between the decks and the mixer.
 * 2. `box-shadow` never affects layout. The deck's
 *    `0 0 0 4px #3a3434, 0 0 0 5px #0a0909` is a rim painted OUTSIDE its
 *    100px box (110px visually, still 100px to flex), and the panel's
 *    `0 16px 0 …` pair is a solid slab painted below it — and, because it
 *    belongs to the transformed element, it tilts with the panel. Drawing
 *    the rim inside the 100px circle and the slab as untransformed siblings
 *    lost both the deck's silver rim and the console's physical thickness.
 */

const WRAP_WIDTH = 330;
const DECK_BOX = 100;
const DECK_RIM = 5;
const DECK_OUTER = DECK_BOX + DECK_RIM * 2;
const PLATTER = DECK_BOX - 10;
const LABEL = PLATTER - 64;

/** `repeating-radial-gradient(circle,#121010 0 1px,#1f1c1c 1px 3px)` — a 3px
 * period of 1px dark groove on a 2px lighter band, not a smooth blend. */
function GrooveRings({ radius }: { readonly radius: number }): React.JSX.Element {
  const rings: React.JSX.Element[] = [];
  for (let r = 0.5; r < radius; r += 3) {
    rings.push(
      <Circle key={r} cx={radius} cy={radius} r={r} fill="none" stroke="#121010" strokeWidth={1} />,
    );
  }
  return <>{rings}</>;
}

/** The spinning highlight from the deck's inner
 * `conic-gradient(from 0deg,transparent 0 25deg,rgba(255,255,255,.16) 40deg,…)`.
 * SVG has no conic gradient, so each lobe is fanned into stepped-opacity
 * wedges — smooth enough at this size, but an approximation, not a blend. */
function SheenSweep({ radius }: { readonly radius: number }): React.JSX.Element {
  const lobes = [
    { start: 25, end: 58, peakAt: 40, peak: 0.16 },
    { start: 200, end: 232, peakAt: 214, peak: 0.1 },
  ];
  const steps = 10;
  return (
    <>
      {lobes.flatMap((lobe) =>
        Array.from({ length: steps }, (_, index) => {
          const span = lobe.end - lobe.start;
          const a1 = lobe.start + (span * index) / steps;
          const a2 = lobe.start + (span * (index + 1)) / steps;
          const mid = (a1 + a2) / 2;
          const falloff = Math.abs(mid - lobe.peakAt) / (span / 2);
          const opacity = lobe.peak * Math.max(0, 1 - falloff);
          const p1 = polarPoint(radius, radius, radius, a1);
          const p2 = polarPoint(radius, radius, radius, a2);
          const d = `M ${String(radius)} ${String(radius)} L ${String(p1.x)} ${String(p1.y)} A ${String(radius)} ${String(radius)} 0 0 1 ${String(p2.x)} ${String(p2.y)} Z`;
          return (
            <Path
              key={`${String(lobe.start)}-${String(index)}`}
              d={d}
              fill="#ffffff"
              fillOpacity={opacity}
            />
          );
        }),
      )}
    </>
  );
}

function Deck({ labelColor }: { readonly labelColor: string }): React.JSX.Element {
  const [rotation] = useState(() => new Animated.Value(0));
  const gradientId = `ball${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [rotation]);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rimCenter = DECK_OUTER / 2;
  const platterRadius = PLATTER / 2;

  return (
    <View style={styles.deck}>
      <View style={styles.deckRim}>
        <Svg width={DECK_OUTER} height={DECK_OUTER}>
          <Circle cx={rimCenter} cy={rimCenter} r={rimCenter} fill="#0a0909" />
          <Circle cx={rimCenter} cy={rimCenter} r={rimCenter - 1} fill="#3a3434" />
          <Circle cx={rimCenter} cy={rimCenter} r={DECK_BOX / 2} fill={colors.background} />
        </Svg>
      </View>

      <Animated.View style={[styles.platter, { transform: [{ rotate: spin }] }]}>
        <Svg width={PLATTER} height={PLATTER}>
          <Circle cx={platterRadius} cy={platterRadius} r={platterRadius} fill="#1f1c1c" />
          <GrooveRings radius={platterRadius} />
          <SheenSweep radius={platterRadius} />
        </Svg>
        <View style={[styles.deckLabel, { backgroundColor: labelColor }]}>
          <View style={styles.deckLabelTick} />
        </View>
      </Animated.View>

      <View style={styles.tonearm}>
        <LinearGradient
          colors={['#9a9290', '#f4f1ee', '#9a9290']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.tonearmRod}
        />
        <View style={styles.tonearmHeadshell} />
      </View>

      <View style={styles.bearing}>
        <Svg width={14} height={14}>
          <Defs>
            <RadialGradient id={gradientId} cx="35%" cy="30%" r="75%">
              <Stop offset="0%" stopColor="#ffffff" />
              <Stop offset="100%" stopColor="#9a9290" />
            </RadialGradient>
          </Defs>
          <Circle cx={7} cy={7} r={7} fill={`url(#${gradientId})`} />
        </Svg>
      </View>
    </View>
  );
}

/** A grey sphere with a small coloured position marker — the colour is the
 * tick only, never the knob body. */
function Knob({ tickColor }: { readonly tickColor: string }): React.JSX.Element {
  const gradientId = `knob${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View style={styles.knob}>
      <Svg width={13} height={13}>
        <Defs>
          <RadialGradient id={gradientId} cx="35%" cy="30%" r="75%">
            <Stop offset="0%" stopColor="#5f5856" />
            <Stop offset="100%" stopColor="#1E1B1B" />
          </RadialGradient>
        </Defs>
        <Circle cx={6.5} cy={6.5} r={6.5} fill={`url(#${gradientId})`} />
      </Svg>
      <View style={[styles.knobTick, { backgroundColor: tickColor }]} />
    </View>
  );
}

function Fader({ thumbTop }: { readonly thumbTop: number }): React.JSX.Element {
  return (
    <View style={styles.fader}>
      <LinearGradient
        colors={['#f4f1ee', '#9a9290']}
        style={[styles.faderThumb, { top: thumbTop }]}
      />
    </View>
  );
}

const LED_COLUMN_A = [
  colors.primary,
  colors.primary,
  colors.secondary,
  colors.secondary,
  colors.secondary,
  colors.secondary,
  colors.border,
];
const LED_COLUMN_B = [
  colors.primary,
  colors.primary,
  colors.secondary,
  colors.secondary,
  colors.border,
  colors.border,
  colors.border,
];

function LedColumn({ leds }: { readonly leds: readonly string[] }): React.JSX.Element {
  return (
    <View style={styles.ledColumn}>
      {leds.map((color, index) => (
        <View
          key={index}
          style={[
            styles.led,
            { backgroundColor: color },
            color !== colors.border && { shadowColor: color },
          ]}
        />
      ))}
    </View>
  );
}

function MiniMixer(): React.JSX.Element {
  return (
    <View style={styles.mixer}>
      <View style={styles.knobRow}>
        <Knob tickColor={colors.primary} />
        <Knob tickColor={colors.onSurface} />
        <Knob tickColor={colors.secondary} />
      </View>
      <View style={styles.knobRow}>
        <Knob tickColor={colors.onSurface} />
        <Knob tickColor={colors.primary} />
        <Knob tickColor={colors.onSurface} />
      </View>
      <View style={styles.faderRow}>
        <Fader thumbTop={8} />
        <LedColumn leds={LED_COLUMN_A} />
        <LedColumn leds={LED_COLUMN_B} />
        <Fader thumbTop={24} />
      </View>
      <View style={styles.hFader}>
        <LinearGradient
          colors={['#f4f1ee', '#9a9290']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.hFaderThumb}
        />
      </View>
    </View>
  );
}

function Bar({ color, lit }: { readonly color: string; readonly lit: boolean }): React.JSX.Element {
  return <View style={[styles.bar, { backgroundColor: color }, lit && { shadowColor: color }]} />;
}

export function DjConsole(): React.JSX.Element {
  return (
    <View style={styles.wrap}>
      <View style={styles.floorGlow}>
        <RadialGlow
          width={WRAP_WIDTH * 0.8}
          height={60}
          color={colors.primary}
          stopOpacity={0.35}
          fadeAt="70%"
        />
      </View>

      <View style={styles.tiltGroup}>
        <View style={styles.slabOutline} />
        <View style={styles.slabFace} />
        <View style={styles.panel}>
          <LinearGradient
            colors={['#2c2827', '#151313', '#0f0d0d']}
            locations={[0, 0.6, 1]}
            start={{ x: 0.416, y: 0 }}
            end={{ x: 0.584, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.deckRow}>
            <Deck labelColor={colors.primary} />
            <MiniMixer />
            <Deck labelColor={colors.secondary} />
          </View>
          <View style={styles.bottomRow}>
            <View style={styles.barGroup}>
              <Bar color={colors.primary} lit />
              <Bar color={colors.onSurface} lit />
              <Bar color={colors.primary} lit />
              <Bar color={colors.border} lit={false} />
            </View>
            <Text style={styles.brandLabel}>C1RCLE</Text>
            <View style={styles.barGroup}>
              <Bar color={colors.secondary} lit />
              <Bar color={colors.onSurface} lit />
              <Bar color={colors.secondary} lit />
              <Bar color={colors.border} lit={false} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: WRAP_WIDTH,
  },
  floorGlow: {
    position: 'absolute',
    top: 130,
    left: '10%',
    width: WRAP_WIDTH * 0.8,
    height: 60,
  },
  // Holds the panel and its two solid drop-shadow slabs so all three share
  // one 3D transform, the way a CSS box-shadow rides its own element.
  tiltGroup: {
    transform: [{ perspective: 700 }, { rotateX: '46deg' }, { rotateZ: '-6deg' }],
    transformOrigin: '50% 60%',
  },
  slabOutline: {
    position: 'absolute',
    left: -1,
    right: -1,
    top: 17,
    bottom: -17,
    borderRadius: 21,
    backgroundColor: '#2A2626',
  },
  slabFace: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 16,
    bottom: -16,
    borderRadius: 20,
    backgroundColor: '#080707',
  },
  panel: {
    width: WRAP_WIDTH,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3a3434',
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 40 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 14,
  },
  deckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deck: {
    width: DECK_BOX,
    height: DECK_BOX,
  },
  deckRim: {
    position: 'absolute',
    left: -DECK_RIM,
    top: -DECK_RIM,
  },
  platter: {
    position: 'absolute',
    left: 5,
    top: 5,
    width: PLATTER,
    height: PLATTER,
    borderRadius: PLATTER / 2,
    overflow: 'hidden',
  },
  deckLabel: {
    position: 'absolute',
    left: 32,
    top: 32,
    width: LABEL,
    height: LABEL,
    borderRadius: LABEL / 2,
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.18)',
  },
  deckLabelTick: {
    position: 'absolute',
    top: 6,
    left: '50%',
    marginLeft: -2,
    width: 4,
    height: 8,
    borderRadius: 2,
    backgroundColor: colors.background,
  },
  tonearm: {
    position: 'absolute',
    right: -5,
    top: 2,
    width: 4,
    height: 62,
    transform: [{ rotate: '24deg' }],
    transformOrigin: 'top center',
  },
  tonearmRod: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
  },
  tonearmHeadshell: {
    position: 'absolute',
    bottom: -6,
    left: -3,
    width: 10,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#2A2626',
  },
  bearing: {
    position: 'absolute',
    right: -10,
    top: -6,
    width: 14,
    height: 14,
    borderRadius: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
    elevation: 4,
  },
  mixer: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#0f0d0d',
    borderWidth: 1,
    borderColor: '#2A2626',
  },
  knobRow: {
    flexDirection: 'row',
    gap: 6,
  },
  knob: {
    width: 13,
    height: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 1.5,
  },
  knobTick: {
    position: 'absolute',
    left: 5.5,
    top: 1,
    width: 2,
    height: 5,
    borderRadius: 1,
  },
  faderRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-end',
  },
  fader: {
    width: 4,
    height: 44,
    borderRadius: 2,
    backgroundColor: '#050404',
    borderWidth: 1,
    borderColor: '#2A2626',
  },
  faderThumb: {
    position: 'absolute',
    left: -6,
    width: 16,
    height: 7,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 1.5,
  },
  ledColumn: {
    gap: 2,
  },
  led: {
    width: 4,
    height: 3,
    borderRadius: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 2.5,
  },
  hFader: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#050404',
    borderWidth: 1,
    borderColor: '#2A2626',
  },
  hFaderThumb: {
    position: 'absolute',
    top: -4,
    left: 18,
    width: 9,
    height: 12,
    borderRadius: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  barGroup: {
    flexDirection: 'row',
    gap: 5,
  },
  bar: {
    width: 17,
    height: 12,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  brandLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 2.4,
    color: colors.onSurfaceFaint,
  },
});
