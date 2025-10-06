import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { setTokens, popPendingIntent } from '../lib/session';
import { useRouter } from 'expo-router';
import { login as apiLogin, cart as getCart } from '../lib/api';
import Constants from 'expo-constants';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? Constants.expoConfig?.extra?.apiUrl ?? "http://127.0.0.1:8000";

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const router = useRouter();

  async function handleLogin() {
    try {
      const data = await apiLogin(username, password);
      await setTokens({ access: data.access, refresh: data.refresh });
      setMsg('Logged in.');
      const intent = await popPendingIntent();
      if (intent?.type === 'checkout') {
        try { await getCart(); } catch {}
            router.replace({ pathname: '/checkout', params: { email: intent.email || '' } });
        } else {
          router.replace('/'); 
      }
    } catch (e) {
      setMsg('Login failed.');
    }
  }

  return (
    <View style={{ padding: 16, gap: 8 }}>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Login</Text>
      <TextInput placeholder="Username" value={username} onChangeText={setUsername} style={styles.input} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
      <Pressable onPress={handleLogin} style={styles.btn}><Text style={{ color: 'white' }}>Login</Text></Pressable>
      <Text>{msg}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, height: 40, backgroundColor: 'white' },
  btn: { backgroundColor: '#111827', padding: 12, borderRadius: 8, alignSelf: 'flex-start' }
});
