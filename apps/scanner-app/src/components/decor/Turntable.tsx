import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { colors } from '@/theme/tokens';

interface TurntableProps {
  readonly size?: number;
  readonly labelColor?: string;
  readonly durationMs?: number;
}

/**
 * The turntable/vinyl motif from the design reference
 * (ui_example/claude_design_ui/Circle Scanner.html) — a spinning grain
 * ring around a colored center label, reproduced with react-native-svg
 * (RN's plain View/StyleSheet has no radial-gradient support, unlike CSS).
 * The reference's `spinball`/`spinrow` background-position tricks (a
 * looping grain texture) are approximated here with a slowly rotating
 * dashed ring, not a literal texture — a faithful-enough substitute given
 * RN has no CSS `background-position` animation primitive at all.
 */
export function Turntable({
  size = 100,
  labelColor = colors.primary,
  durationMs = 2400,
}: TurntableProps): React.JSX.Element {
  // `useState`'s lazy initializer, not `useRef` — an Animated.Value read
  // via `.interpolate()` during render trips the newer `react-hooks/refs`
  // rule if it's ref-shaped, even though this isn't a DOM/host ref.
  const [rotation] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: durationMs,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [rotation, durationMs]);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const half = size / 2;
  const labelRadius = size * 0.16;
  const innerSize = size - 8;
  const dashOn = size * 0.35;
  const dashOff = size * 0.6;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${String(size)} ${String(size)}`}>
        <Defs>
          <RadialGradient id="grain" cx="50%" cy="50%" r="70%">
            <Stop offset="0%" stopColor="#1f1c1c" stopOpacity={1} />
            <Stop offset="100%" stopColor="#121010" stopOpacity={1} />
          </RadialGradient>
        </Defs>
        <Circle
          cx={half}
          cy={half}
          r={half}
          fill={colors.background}
          stroke={colors.border}
          strokeWidth={1}
        />
        <Circle cx={half} cy={half} r={half - 5} fill="url(#grain)" />
      </Svg>
      <Animated.View
        style={{
          position: 'absolute',
          inset: 4,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ rotate: spin }],
        }}
      >
        <Svg
          width={innerSize}
          height={innerSize}
          viewBox={`0 0 ${String(innerSize)} ${String(innerSize)}`}
        >
          <Circle
            cx={innerSize / 2}
            cy={innerSize / 2}
            r={innerSize / 2 - 2}
            fill="none"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth={2}
            strokeDasharray={`${String(dashOn)} ${String(dashOff)}`}
          />
        </Svg>
      </Animated.View>
      <View
        style={{
          position: 'absolute',
          top: half - labelRadius,
          left: half - labelRadius,
          width: labelRadius * 2,
          height: labelRadius * 2,
          borderRadius: labelRadius,
          backgroundColor: labelColor,
        }}
      />
    </View>
  );
}
