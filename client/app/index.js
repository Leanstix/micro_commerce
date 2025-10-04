import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, ActivityIndicator, TextInput, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../lib/theme';
import { useRouter } from 'expo-router';
import { listProducts, addToCart } from '../lib/api';
import ProductCard from '../components/ProductCard';

export default function ProductsList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchingMoreRef = useRef(false);
  const canLoadMoreRef = useRef(false);

  const router = useRouter();

  const fetchPage = useCallback(
    async ({ reset = false, pageNum = 1 } = {}) => {
      if (loading) return; 
      setLoading(true);
      try {
        const res = await listProducts({ page: pageNum, q });
        const items = res?.results ?? res ?? [];
        setHasMore(Boolean(res?.next ?? (items.length > 0 && items.length >= 1)));
        if (reset) {
          setData(items);
          setPage(1);
        } else {
          setData(prev => {
            const map = new Map();
            prev.forEach(it => map.set(it.id, it));
            items.forEach(it => map.set(it.id, it));
            return Array.from(map.values());
          });
        }
      } finally {
        setLoading(false);
        fetchingMoreRef.current = false;
      }
    },
    [q]
  );

  useEffect(() => {
    fetchPage({ reset: true, pageNum: 1 });
  }, [q, fetchPage]);

  const loadMore = async () => {
    if (fetchingMoreRef.current || loading || !hasMore || data.length === 0) return;
    if (!canLoadMoreRef.current) return; 
    fetchingMoreRef.current = true;
    const next = page + 1;
    setPage(next);
    await fetchPage({ pageNum: next });
  };

  return (
    <View style={{ flex: 1, padding: spacing, backgroundColor: colors.bg }}>
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Search products..."
          value={q}
          onChangeText={(text) => { setQ(text); setHasMore(true); }}
          style={styles.input}
          placeholderTextColor={colors.subtext}
        />
        <Pressable onPress={() => fetchPage({ reset: true, pageNum: 1 })} style={styles.refreshBtn}>
          <Text style={{ color: '#fff', fontWeight:'700' }}>Go</Text>
        </Pressable>
      </View>

      {loading && data.length === 0 ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => item.id ?? String(index)}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              onPress={() => router.push(`/product/${item.id}`)}
              onAdd={() => addToCart(item.id, 1).catch(() => {})}
            />
          )}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing }}
          contentContainerStyle={{ gap: spacing }}
          style={{ marginTop: spacing }}
          onEndReachedThreshold={0.2}
          onMomentumScrollBegin={() => { canLoadMoreRef.current = true; }}
          onEndReached={loadMore}
          ListFooterComponent={
            loading && data.length > 0 ? <ActivityIndicator style={{ marginVertical: 12 }} /> : <View style={{ height: 24 }} />
          }
          contentContainerStyle={{ paddingBottom: 100, minHeight: 1 }}
        />
      )}

      <Pressable style={styles.cartBtn} onPress={() => router.push('/cart')}>
        <Text style={{ color: 'white', fontWeight: '700' }}>Cart</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', gap: spacing, marginTop: 4 },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius, paddingHorizontal: 12, height: 42, backgroundColor: colors.card, color: colors.text },
  refreshBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, borderRadius: radius, justifyContent: 'center' },
  cartBtn: { position: 'absolute', right: 16, bottom: 16, backgroundColor: colors.accent, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24 }
});
