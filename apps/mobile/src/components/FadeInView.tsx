import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Used across Home/Pray/Live to give cards a soft entrance rather than
// popping in — one small, consistent motion signature reused everywhere
// instead of a different animation per screen. Skips entirely when the OS
// reduce-motion setting is on.
export default function FadeInView({ children, delay = 0, style }: {
  children: React.ReactNode; delay?: number; style?: any;
}) {
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reducedMotion ? 0 : 8)).current;

  useEffect(() => {
    if (reducedMotion) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 420, delay, useNativeDriver: true }),
    ]).start();
  }, [reducedMotion]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
