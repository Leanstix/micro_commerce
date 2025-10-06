import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, Alert } from 'react-native';
import { myOrders } from '../../lib/api';
import { colors, radius } from '../../lib/theme';
import { useRouter } from 'expo-router';
import { useRefetchOnFocus } from '../../lib/focusRefresh';

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      setOrders(await myOrders());
    } catch {
      Alert.alert('Login required', 'Please log in to see your orders.', [
        { text:'Login', onPress: ()=>router.push('/login') },
        { text:'Sign up', onPress: ()=>router.push('/signup') },
        { text:'Cancel' }
      ]);
    } finally { setLoading(false); }
  }
  useRefetchOnFocus(loadOrders);

  if (loading) return <ActivityIndicator />;

  return (
    <View style={{ flex:1, backgroundColor: colors.bg, padding: 16 }}>
      <Text style={{ color:'#fff', fontSize: 20, fontWeight:'800', marginBottom: 8 }}>My Orders</Text>
      <FlatList
        data={orders || []}
        keyExtractor={(o)=>o.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={()=>router.push(`/orders/${item.id}`)}
            style={{ padding:12, borderWidth:1, borderColor:colors.border, borderRadius:radius, marginBottom:8, backgroundColor:colors.card }}
          >
            <Text style={{ color:'#fff', fontWeight:'800' }}>#{item.id.slice(0,8)} • {item.status}</Text>
            <Text style={{ color: colors.subtext }}>{new Date(item.created_at).toLocaleString()}</Text>
            <Text style={{ color:'#fff', fontWeight:'800' }}>
              {(item.total_cents/100).toLocaleString(undefined,{style:'currency',currency:'NGN'})}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={{ color: colors.subtext }}>No orders yet.</Text>}
      />
    </View>
  );
}
