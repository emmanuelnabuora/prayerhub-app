import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Every animated component in the app (FlameGlow, entrance transitions, the
// live-room pulse) checks this before animating, matching the same
// motion-accessible principle already established on the landing page's
// particle system. Screens should render the same final state either way —
// this only ever removes motion, never removes content.
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduced(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
