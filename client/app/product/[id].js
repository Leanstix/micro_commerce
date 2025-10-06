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
        <Pressable 
          onPress={() => addToCart(p.id, 1)}
          disabled = {!p.stock || p.stock <= 0}
          style={[styles.btn, (!p.stock || p.stock <= 0) && { opacity: 0.4 }]}
        >
        <Text style={styles.btnText}>
          {(!p.stock || p.stock <= 0) ? 'Out of stock' : 'Add'}
        </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '700' },
})
