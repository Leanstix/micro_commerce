import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import SmartImage from '../../components/SmartImage';
import Skeleton from '../../components/Skeleton';
import { colors, radius, spacing } from '../../lib/theme';
import { getProduct, addToCart } from '../../lib/api';

export default function ProductScreen() {
  const { id } = useLocalSearchParams();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getProduct(id);
      setP(data); setLoading(false);
    })();
  }, [id]);

  if (loading) return <ActivityIndicator/>;
  if (!p) return <Text>Not found</Text>;

  return (
    <View style={{ flex:1, backgroundColor: colors.bg }}>
      {!loaded && <Skeleton height={320} radius={0} />}
      <SmartImage uri={p.image || p.image_url} style={{ width:'100%', height: 320 }} contentFit="cover" onLoadEnd={()=>setLoaded(true)} />
      <View style={{ padding: spacing, gap: 8 }}>
        <Text style={{ fontSize: 22, fontWeight:'800', color: colors.text }}>{p.name}</Text>
        <Text style={{ color: colors.subtext }}>{p.description}</Text>
        <Text style={{ fontWeight:'800', color: colors.text, fontSize: 18 }}>
          {(p.price_cents/100).toLocaleString(undefined, { style:'currency', currency: p.currency||'NGN' })}
        </Text>
        <Pressable onPress={() => addToCart(p.id, 1)} style={{ backgroundColor: colors.primary, padding:12, borderRadius: radius, alignSelf:'flex-start' }}>
          <Text style={{ color:'#fff', fontWeight:'700' }}>Add to Cart</Text>
        </Pressable>
      </View>
    </View>
  );
}
