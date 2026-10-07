import { View } from 'react-native';

import type { DimensionValue } from 'react-native';

interface AccentSpec {
  readonly leftPct: number;
  readonly topPct: number;
  readonly width: number;
  readonly height: number;
  readonly color: string;
  readonly rotationDeg: number;
}

/**
 * The small rotated rect/square "confetti" accents scattered across the
 * design reference's colored hero surfaces (login hero, event cards) —
 * plain absolutely-positioned Views, no gradient/animation needed for
 * these (unlike Turntable), so no SVG dependency for this one.
 */
export function ScatterAccents({
  accents,
}: {
  readonly accents: readonly AccentSpec[];
}): React.JSX.Element {
  return (
    <>
      {accents.map((accent, index) => (
        <View
          key={index}
          style={{
            position: 'absolute',
            left: `${String(accent.leftPct)}%` as DimensionValue,
            top: `${String(accent.topPct)}%` as DimensionValue,
            width: accent.width,
            height: accent.height,
            backgroundColor: accent.color,
            borderRadius: 2,
            transform: [{ rotate: `${String(accent.rotationDeg)}deg` }],
          }}
        />
      ))}
    </>
  );
}

export type { AccentSpec };
