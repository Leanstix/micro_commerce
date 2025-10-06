import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { colors, radius } from '../../lib/theme';
import { me } from '../../lib/api';
import { logout } from '../../lib/session';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function Account() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useFocusEffect(useCallback(() => {
    let mounted = true;
    (async () => {
      try { const u = await me(); if (mounted) setUser(u); }
      catch (error) { if (mounted) setUser(null); }
    })();
    return () => { mounted = false; };
  }, []));

  return (
    <View style={{ flex:1, backgroundColor: colors.bg, padding: 16, gap: 12 }}>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>Account</Text>
      {user ? (
        <>
          <Text style={{ color: colors.subtext }}>Signed in as {user.email}</Text>
          <Pressable
            style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, padding: 12, borderRadius: radius }}
            onPress={() => router.push('/(tabs)/orders')}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>View my orders</Text>
          </Pressable>
          <Pressable
            style={{ backgroundColor: '#991b1b', padding: 12, borderRadius: radius }}
            onPress={async () => {
              await logout();
              router.replace('/(tabs)');
            }}h
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>Log out</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Pressable
            style={{ backgroundColor: colors.primary, padding: 12, borderRadius: radius }}
            onPress={() => router.push('/login')}
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>Login</Text>
          </Pressable>
          <Pressable
            style={{ backgroundColor: colors.accent, padding: 12, borderRadius: radius }}
            onPress={() => router.push('/signup')}
          >
            <Text style={{ color: '#001826', fontWeight: '800' }}>Create account</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
