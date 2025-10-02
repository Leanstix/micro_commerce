import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, TextInput, StyleSheet, Alert } from 'react-native';
import { getCart, updateCartItem, deleteCartItem } from '../lib/api';
import { useRouter } from 'expo-router';

export default function CartScreen() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const router = useRouter();

  async function load() {
    setLoading(true);
    const data = await getCart();
    setCart(data); setLoading(false);
  }
  useEffect(()=>{ load(); }, []);

  if (loading) return <ActivityIndicator/>;

  const total = cart.items.reduce((s, it) => s + it.quantity * it.product.price_cents, 0);

  return (
    <View style={{ flex:1, padding: 12 }}>
      <FlatList
        data={cart.items}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex:1 }}>
              <Text style={{ fontWeight:'700' }}>{item.product.name}</Text>
              <Text>Qty: {item.quantity}</Text>
            </View>
            <Pressable
              style={styles.btn}
              onPress={async () => {
                try {
                  await updateCartItem(item.id, item.quantity + 1);
                  await load();
                } catch (e) {
                  const status = e?.response?.status;
                  if (status === 409) {
                    const meta = e.response?.data?.meta;
                    const available = meta?.available ?? 0;
                    Alert.alert(
                      'Out of stock',
                      `Only ${available} left for "${item.product.name}".`,
                      [
                        {
                          text: 'Set to available',
                          onPress: async () => {
                            if (available > 0) {
                              await updateCartItem(item.id, available).catch(() => {});
                            } else {
                              await deleteCartItem(item.id).catch(() => {});
                            }
                            await load();
                          }
                        },
                        { text: 'OK' }
                      ]
                    );
                  } else {
                    Alert.alert('Error', 'Could not update quantity.');
                  }
                }
              }}
            >
              <Text style={styles.btnText}>+</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={() => updateCartItem(item.id, Math.max(1, item.quantity - 1)).then(load)}><Text style={styles.btnText}>-</Text></Pressable>
            <Pressable style={[styles.btn, { backgroundColor:'#991b1b' }]} onPress={() => deleteCartItem(item.id).then(load)}><Text style={styles.btnText}>x</Text></Pressable>
          </View>
        )}
        ListFooterComponent={<View style={{ height: 20 }} />}
      />
      <Text style={{ fontWeight:'700', marginTop: 8 }}>Total: {(total/100).toLocaleString(undefined, { style:'currency', currency:'NGN' })}</Text>
      <TextInput placeholder="Email for receipt (optional)" value={email} onChangeText={setEmail} style={styles.input}/>
      <Pressable onPress={()=>router.push({ pathname:'/checkout', params: { email }})} style={styles.checkout}>
        <Text style={{ color:'white', fontWeight:'700' }}>Checkout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:'#ddd', padding:12, borderRadius:8, marginBottom:8, backgroundColor:'white', gap:8 },
  btn: { backgroundColor:'#111827', paddingHorizontal:10, paddingVertical:6, borderRadius:6 },
  btnText: { color:'white', fontWeight:'700' },
  input: { borderWidth:1, borderColor:'#ccc', borderRadius:8, paddingHorizontal:10, height:40, backgroundColor:'white', marginTop:8 },
  checkout: { backgroundColor:'#111827', padding:14, borderRadius:10, alignItems:'center', marginTop:12 }
});
