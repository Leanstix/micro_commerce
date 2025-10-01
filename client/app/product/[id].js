import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { getProduct, addToCart } from '../../lib/api';

export default function ProductScreen() {
  const { id } = useLocalSearchParams();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const data = await getProduct(id);
      setP(data); setLoading(false);
    })();
  }, [id]);

  if (loading) return <ActivityIndicator/>;
  if (!p) return <Text>Not found</Text>;

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight:'700' }}>{p.name}</Text>
      <Text>{p.description}</Text>
      <Text style={{ fontWeight:'700' }}>{(p.price_cents/100).toLocaleString(undefined, { style:'currency', currency: p.currency||'NGN' })}</Text>
      <Pressable onPress={() => addToCart(p.id, 1)} style={{ backgroundColor:'#111827', padding:12, borderRadius:8, alignSelf:'flex-start' }}>
        <Text style={{ color:'white' }}>Add to Cart</Text>
      </Pressable>
    </View>
  );
}
