import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';
import { useReducedMotion } from '../hooks/useReducedMotion';

// The asymmetric flame mark from the logo system, reused here as the app's
// signature loading/empty-state element instead of a generic spinner —
// candlelight and a folded prayer note, per the original brand mark. A slow
// breathing scale (not a spin) so it reads as alive/prayerful rather than
// "processing." Static when reduce-motion is on.
export default function FlameMark({ size = 40 }: { size?: number }) {
  const reducedMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reducedMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.08, duration: 1400, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reducedMotion]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Svg width={size} height={size * 1.3} viewBox="0 0 40 52">
          <Path
            d="M20 2C13 12 8 20 8 30a12 12 0 0024 0c0-6-2-11-6-16 1 5-1 8-3 9-3-8 1-14-3-21z"
            fill={colors.flame}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({ container: { alignItems: 'center', justifyContent: 'center' } });
