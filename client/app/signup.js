import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { signup } from '../lib/api';
import { useRouter } from 'expo-router';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  async function onSignup() {
    try {
      const { verify_link } = await signup(email, password);
      Alert.alert('Verify your email', `Open this link (dev):\n${verify_link}`);
      router.push('/verify');
    } catch (e) {
      Alert.alert('Signup failed', e?.response?.data?.error || 'Try a different email / password');
    }
  }

  return (
    <View style={{ padding: 16, gap: 8 }}>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Create account</Text>
      <TextInput placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="Password (min 8 chars)" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
      <Pressable onPress={onSignup} style={styles.btn}><Text style={{ color: 'white' }}>Sign up</Text></Pressable>
      <Pressable onPress={() => router.push('/login')}><Text>Have an account? Log in</Text></Pressable>
    </View>
  );
}
const styles = StyleSheet.create({ input:{borderWidth:1,borderColor:'#ccc',borderRadius:8,paddingHorizontal:10,height:40,backgroundColor:'white'}, btn:{backgroundColor:'#111827',padding:12,borderRadius:8,alignSelf:'flex-start'} });
