import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, Pressable, Alert } from 'react-native';
import { getOrder } from '../../lib/api';
import { colors, radius } from '../../lib/theme';
import SmartImage from '../../components/SmartImage';

export default function Receipt() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); setNotFound(true); return; }
    (async () => {
      setLoading(true);
      try {
        const o = await getOrder(id);
        setOrder(o);
      } catch (e) {
        const status = e?.response?.status;
        if (status === 401) {
          Alert.alert('Login required', 'Sign in to view your receipt.', [
            { text: 'Login', onPress: () => router.replace('/login') },
            { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
          ]);
        } else if (status === 404) {
          setNotFound(true);
        } else {
          Alert.alert('Error', 'Could not load receipt. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <ActivityIndicator />;

  if (notFound || !order) {
    return (
      <View style={{ flex:1, backgroundColor: colors.bg, padding: 16 }}>
        <Text style={{ color:'#fff', fontSize:18, fontWeight:'800', marginBottom: 8 }}>Receipt</Text>
        <Text style={{ color: colors.subtext, marginBottom: 12 }}>We couldn’t find that order.</Text>
        <Pressable onPress={() => router.replace('/(tabs)/orders')}>
          <Text style={{ color: '#5b8cff', fontWeight: '800' }}>Back to Orders</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex:1, backgroundColor: colors.bg, padding: 16 }}>
      <Text style={{ color:'#fff', fontSize:22, fontWeight:'800', marginBottom:8 }}>Receipt</Text>
      <Text style={{ color: colors.subtext, marginBottom:8 }}>
        #{String(order.id).slice(0,8)} • {order.status} • {new Date(order.created_at).toLocaleString()}
      </Text>
      <FlatList
        data={order.items ?? []}
        keyExtractor={(_, idx)=>String(idx)}
        renderItem={({ item }) => (
          <View style={{ flexDirection:'row', gap:10, alignItems:'center', borderWidth:1, borderColor:colors.border, backgroundColor:colors.card, padding:10, borderRadius:radius, marginBottom:8 }}>
            <SmartImage uri={item.product?.image || item.product?.image_url} style={{ width:48, height:48, borderRadius:8 }} />
            <View style={{ flex:1 }}>
              <Text style={{ color:'#fff', fontWeight:'800' }}>{item.product?.name ?? 'Product'}</Text>
              <Text style={{ color: colors.subtext }}>x{item.quantity}</Text>
            </View>
            <Text style={{ color:'#fff', fontWeight:'800' }}>
              {((item.unit_price_cents ?? 0)/100).toLocaleString(undefined,{style:'currency',currency:item.product?.currency||'NGN'})}
            </Text>
          </View>
        )}
        ListFooterComponent={
          <View style={{ marginTop: 8, borderTopWidth:1, borderTopColor: colors.border, paddingTop: 8 }}>
            <Text style={{ color:'#fff', fontWeight:'900', textAlign:'right' }}>
              Total: {(Number(order.total_cents||0)/100).toLocaleString(undefined,{style:'currency',currency:'NGN'})}
            </Text>
          </View>
        }
      />
    </View>
  );
}
