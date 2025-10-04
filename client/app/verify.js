import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { verifyEmail } from '../lib/api';
import { useRouter } from 'expo-router';

export default function Verify() {
  const [token, setToken] = useState('');
  const router = useRouter();

  async function onVerify() {
    try {
      await verifyEmail(token);
      Alert.alert('Verified', 'Your account is now active. Please log in.');
      router.replace('/login');
    } catch (e) {
      Alert.alert('Verification failed', e?.response?.data?.error || 'Invalid or expired token');
    }
  }

  return (
    <View style={{ padding:16, gap:8 }}>
      <Text style={{ fontSize:18, fontWeight:'700' }}>Verify Email</Text>
      <Text style={{ color:'#444' }}>Paste the token from the link (dev) or paste the full link’s token query param.</Text>
      <TextInput placeholder="token" value={token} onChangeText={setToken} style={styles.input}/>
      <Pressable onPress={onVerify} style={styles.btn}><Text style={{ color:'white' }}>Verify</Text></Pressable>
    </View>
  );
}
const styles = StyleSheet.create({ input:{borderWidth:1,borderColor:'#ccc',borderRadius:8,paddingHorizontal:10,height:40,backgroundColor:'white'}, btn:{backgroundColor:'#111827',padding:12,borderRadius:8,alignSelf:'flex-start'} });
