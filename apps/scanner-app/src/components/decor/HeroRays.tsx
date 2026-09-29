import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { polarPoint } from '@/components/decor/wedge';

/**
 * The login hero's background "light beam" graphic — transcribed from the
 * reference's `conic-gradient(from 150deg at 68% 30%, transparent 0 12deg,
 * rgba(169,201,247,.13) 12deg 20deg, transparent 20deg 44deg,
 * rgba(238,75,43,.16) 44deg 53deg, transparent 53deg 80deg,
 * rgba(244,241,238,.08) 80deg 86deg, transparent 86deg)` (template.html
 * line 223). Every stop pair here is a hard-edged band (same color start
 * and end), not a smooth blend, so the whole thing is really just 3 thin
 * wedges radiating from one point — cheap to draw exactly as SVG pie
 * slices instead of approximating with a blurred glow. Without this
 * layer the hero reads as flat black, which is the "background is still
 * all black" gap the reference screenshot shows and this fixes.
 *
 * CSS conic-gradient angles are clockwise from north (12 o'clock); SVG/
 * canvas angles here are converted via x = cx + r*sin(a), y = cy - r*cos(a).
 */

const BASE_ANGLE = 150;
const WEDGES = [
  { start: 12, end: 20, color: 'rgba(169,201,247,0.13)' },
  { start: 44, end: 53, color: 'rgba(238,75,43,0.16)' },
  { start: 80, end: 86, color: 'rgba(244,241,238,0.08)' },
] as const;

interface HeroRaysProps {
  readonly width: number;
  readonly height: number;
}

export function HeroRays({ width, height }: HeroRaysProps): React.JSX.Element | null {
  if (width <= 0 || height <= 0) {
    return null;
  }
  const cx = width * 0.68;
  const cy = height * 0.3;
  const radius = Math.max(width, height) * 1.5;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        {WEDGES.map((wedge) => {
          const a1 = polarPoint(cx, cy, radius, BASE_ANGLE + wedge.start);
          const a2 = polarPoint(cx, cy, radius, BASE_ANGLE + wedge.end);
          const d = `M ${String(cx)} ${String(cy)} L ${String(a1.x)} ${String(a1.y)} A ${String(radius)} ${String(radius)} 0 0 1 ${String(a2.x)} ${String(a2.y)} Z`;
          return (
            <Path key={`${String(wedge.start)}-${String(wedge.end)}`} d={d} fill={wedge.color} />
          );
        })}
      </Svg>
    </View>
  );
}
