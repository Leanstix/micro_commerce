import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

export function useRefetchOnFocus(fn, { minIntervalMs = 1200 } = {}) {
  const lastRun = useRef(0);

  const tryRun = useCallback(() => {
    const now = Date.now();
    if (now - lastRun.current < minIntervalMs) return;
    lastRun.current = now;
    Promise.resolve().then(fn).catch(() => {});
  }, [fn, minIntervalMs]);

  useFocusEffect(
    useCallback(() => {
      tryRun();
      return () => {};
    }, [tryRun])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') tryRun();
    });
    return () => sub.remove();
  }, [tryRun]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onVis = () => {
      if (document.visibilityState === 'visible') tryRun();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [tryRun]);
}
