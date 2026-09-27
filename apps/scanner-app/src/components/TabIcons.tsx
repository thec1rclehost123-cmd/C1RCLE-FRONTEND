import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { polarPoint } from '@/components/decor/wedge';

/**
 * The nav's geometric icons, built from plain views to match the
 * reference's `currentColor` div shapes (lines 561-575 of
 * ui_example/claude_design_ui/Circle Scanner.html). Sizes are the markup's,
 * including the Guests icon being 26px wide where the rest are 22px.
 */

const ICON = 22;

export function ScanIcon({ color }: { readonly color: string }): React.JSX.Element {
  return (
    <View style={styles.scanGrid}>
      <View style={[styles.scanCell, { borderColor: color }]} />
      <View style={[styles.scanCell, { borderColor: color }]} />
      <View style={[styles.scanCell, { borderColor: color }]} />
      <View style={[styles.scanCellFilled, { backgroundColor: color }]} />
    </View>
  );
}

export function DoorIcon({ color }: { readonly color: string }): React.JSX.Element {
  return (
    <View style={styles.box}>
      <View style={[styles.doorHead, { backgroundColor: color }]} />
      <View style={[styles.doorBody, { backgroundColor: color }]} />
    </View>
  );
}

export function StatsIcon({ color }: { readonly color: string }): React.JSX.Element {
  return (
    <View style={styles.statsRow}>
      <View style={[styles.statsBar, { height: '40%', backgroundColor: color }]} />
      <View style={[styles.statsBar, { height: '100%', backgroundColor: color }]} />
      <View style={[styles.statsBar, { height: '65%', backgroundColor: color }]} />
      <View style={[styles.statsBar, { height: '85%', backgroundColor: color }]} />
    </View>
  );
}

export function GuestsIcon({ color }: { readonly color: string }): React.JSX.Element {
  return (
    <View style={styles.guestsWrap}>
      <View style={[styles.guestHead, { left: 3, top: 2, backgroundColor: color }]} />
      <View style={[styles.guestHead, { left: 14, top: 2, backgroundColor: color, opacity: 0.6 }]} />
      <View style={[styles.guestBody, { left: 0, width: 15, backgroundColor: color }]} />
      <View style={[styles.guestBody, { left: 12, width: 14, backgroundColor: color, opacity: 0.6 }]} />
    </View>
  );
}

/** `repeating-conic-gradient(currentColor 0 22deg, transparent 22deg 45deg)`
 * — eight spokes, drawn as SVG wedges since there is no conic primitive. */
export function SettingsIcon({ color }: { readonly color: string }): React.JSX.Element {
  const radius = ICON / 2;
  const spokes = Array.from({ length: 8 }, (_, index) => {
    const start = index * 45;
    const end = start + 22;
    const p1 = polarPoint(radius, radius, radius, start);
    const p2 = polarPoint(radius, radius, radius, end);
    const d = `M ${String(radius)} ${String(radius)} L ${String(p1.x)} ${String(p1.y)} A ${String(radius)} ${String(radius)} 0 0 1 ${String(p2.x)} ${String(p2.y)} Z`;
    return <Path key={start} d={d} fill={color} />;
  });
  return (
    <Svg width={ICON} height={ICON}>
      {spokes}
      <Circle cx={radius} cy={radius} r={radius - 3} fill={color} />
      <Circle cx={radius} cy={radius} r={radius - 8} fill="#1c1918" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  box: {
    width: ICON,
    height: ICON,
  },
  scanGrid: {
    width: ICON,
    height: ICON,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  scanCell: {
    width: 9.5,
    height: 9.5,
    borderWidth: 2,
    borderRadius: 3,
  },
  scanCellFilled: {
    width: 9.5,
    height: 9.5,
    borderRadius: 3,
    transform: [{ scale: 0.5 }],
  },
  doorHead: {
    position: 'absolute',
    left: 6,
    top: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  doorBody: {
    position: 'absolute',
    left: 2,
    bottom: 1,
    width: 18,
    height: 8,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  statsRow: {
    width: ICON,
    height: ICON,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  statsBar: {
    flex: 1,
    borderRadius: 2,
  },
  guestsWrap: {
    width: 26,
    height: ICON,
  },
  guestHead: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  guestBody: {
    position: 'absolute',
    bottom: 1,
    height: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
});
