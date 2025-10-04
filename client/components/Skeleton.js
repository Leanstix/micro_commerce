import { useEffect, useRef } from 'react';
import { Animated, Easing, View, StyleSheet } from 'react-native';

export default function Skeleton({ width='100%', height=100, radius=12, dark=true }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

   return (
    <Animated.View
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius: radius,
          opacity,
          backgroundColor: dark ? '#1f2a44' : '#e5e7eb',
          position: 'absolute',        // overlay on top
          top: 0, left: 0, right: 0, bottom: 0
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' }
});
