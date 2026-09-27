import { useId } from 'react';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * A soft `radial-gradient(circle, color, transparent X%)` fill — used for
 * the hero's orange corner glow and the DJ console's under-panel glow.
 * A flat `View` with fixed `opacity` (the earlier approach) renders as a
 * hard-edged tinted disc, not a soft falloff, which reads as a flat blob
 * rather than a glow — this uses a real gradient stop so the edge fades.
 */
interface RadialGlowProps {
  readonly width: number;
  readonly height: number;
  readonly color: string;
  readonly stopOpacity: number;
  readonly fadeAt?: string;
}

export function RadialGlow({ width, height, color, stopOpacity, fadeAt = '65%' }: RadialGlowProps): React.JSX.Element {
  const gradientId = `radialGlow${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg width={width} height={height}>
      <Defs>
        <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={stopOpacity} />
          <Stop offset={fadeAt} stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={width} height={height} fill={`url(#${gradientId})`} />
    </Svg>
  );
}
