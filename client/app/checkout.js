import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { checkout } from '../lib/api';

export default function CheckoutScreen() {
  const { email } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const router = useRouter();

  async function doCheckout() {
    setLoading(true);
    try {
      const res = await checkout(email);
      setResult(res);
      if (res?.id) {
        router.replace(`/orders/${res.id}`);
        return;
      }
    } catch (e) {
      const s = e?.response?.status;
      if (s === 409) {
        const items = e.response?.data?.items || [];
        const msg = items.map(i => `• ${i.name}: requested ${i.requested}, available ${i.available}`).join('\n');
        alert(`Stock changed:\n${msg}`);
      } else {
        alert('Checkout failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ padding:16, gap:12 }}>
      <Text style={{ fontSize:18, fontWeight:'700' }}>Confirm Checkout</Text>
      <Text>Email: {email || '—'}</Text>
      <Pressable onPress={doCheckout} style={{ backgroundColor:'#111827', padding:12, borderRadius:8, alignSelf:'flex-start' }}>
        <Text style={{ color:'white' }}>Pay (Mock)</Text>
      </Pressable>
      {loading && <ActivityIndicator/>}
      {result && <Text selectable>{JSON.stringify(result, null, 2)}</Text>}
      {(result?.id || result?.order_id) && (
        <Pressable onPress={()=>router.replace(`/orders/${result.id ?? result.order_id}`)} style={{ marginTop: 12 }}>
          <Text style={{ color: '#5b8cff', fontWeight: '800' }}>View receipt</Text>
        </Pressable>
      )}
      <Pressable onPress={()=>router.replace('/')} style={{ marginTop: 8 }}><Text>Back to shop</Text></Pressable>
    </View>
  );
}
