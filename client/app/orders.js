import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, Alert } from 'react-native';
import { myOrders } from '../lib/api';
import { useRouter } from 'expo-router';

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await myOrders();
        setOrders(res);
      } catch {
        Alert.alert('Login required', 'Please log in to see your orders.', [
          { text:'Login', onPress: ()=>router.push('/login') },
          { text:'Sign up', onPress: ()=>router.push('/signup') },
          { text:'Cancel' }
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <ActivityIndicator/>;

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>My Orders</Text>
      <FlatList
        data={orders || []}
        keyExtractor={(o)=>o.id}
        renderItem={({item})=>(
          <View style={{ padding:12, borderWidth:1, borderColor:'#ddd', borderRadius:8, marginBottom:8, backgroundColor:'white' }}>
            <Text style={{ fontWeight:'700' }}>#{item.id.slice(0,8)} • {item.status}</Text>
            <Text>{new Date(item.created_at).toLocaleString()}</Text>
            <Text>Total: {(item.total_cents/100).toLocaleString(undefined,{style:'currency',currency:'NGN'})}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No orders yet.</Text>}
      />
    </View>
  );
}
