import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TextInput, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { listProducts, addToCart } from '../lib/api';
import ProductCard from '../components/ProductCard';

export default function ProductsList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const router = useRouter();

  async function fetchPage(reset=false) {
    setLoading(true);
    const res = await listProducts({ page, q });
    setData(reset ? res.results ?? res : [...data, ...(res.results ?? res)]);
    setLoading(false);
  }

  useEffect(() => { fetchPage(true); }, [q]);

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Search products..."
          value={q}
          onChangeText={setQ}
          style={styles.input}
        />
        <Pressable onPress={() => fetchPage(true)} style={styles.refreshBtn}><Text style={{color:'white'}}>Go</Text></Pressable>
      </View>
      {loading && data.length === 0 ? <ActivityIndicator/> : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              onPress={() => router.push(`/product/${item.id}`)}
              onAdd={() => addToCart(item.id, 1).then(()=>{})}
            />
          )}
          onEndReached={() => { setPage(p => p+1); fetchPage(); }}
        />
      )}
      <Pressable style={styles.cartBtn} onPress={()=>router.push('/cart')}>
        <Text style={{ color:'white', fontWeight:'700' }}>Cart</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection:'row', gap:8, marginBottom: 8 },
  input: { flex:1, borderWidth:1, borderColor:'#ccc', borderRadius:8, paddingHorizontal:10, height:40, backgroundColor:'white' },
  refreshBtn: { backgroundColor:'#111827', paddingHorizontal:12, borderRadius:8, justifyContent:'center' },
  cartBtn: { position:'absolute', right:16, bottom:16, backgroundColor:'#111827', paddingHorizontal:18, paddingVertical:12, borderRadius:24 }
});
