import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, TextInput, StyleSheet, Alert, Image } from 'react-native';
import { colors, radius, spacing } from '../../lib/theme';
import { getCart, updateCartItem, deleteCartItem } from '../../lib/api';
import { useRouter } from 'expo-router';
import { me } from '../../lib/api';
import { setPendingIntent } from '../../lib/session';
import SmartImage from '../../components/SmartImage';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useRefetchOnFocus } from '../../lib/focusRefresh';

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
  useRefetchOnFocus(load);
  // useFocusEffect(useCallback(() => {
  //   load();
  // }, [loading]));

  if (loading) return <ActivityIndicator/>;

  const total = cart.items.reduce((s, it) => s + it.quantity * it.product.price_cents, 0);

  return (
    <View style={{ flex:1, padding: spacing, backgroundColor: colors.bg }}>
      <FlatList
        data={cart.items}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <SmartImage uri={item.product.image || item.product.image_url} style={{ width:56, height:56, borderRadius:10, marginRight:8 }} />
            <View style={{ flex:1, gap:2 }}>
              <Text style={{ fontWeight:'800', color: colors.text }}>{item.product.name}</Text>
              <Text style={{ color: colors.subtext }}>Qty: {item.quantity}</Text>
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
      <Text style={{ fontWeight:'800', marginTop: 8, color: colors.text }}>Total: {(total/100).toLocaleString(undefined, { style:'currency', currency:'NGN' })}</Text>
      <TextInput placeholder="Email for receipt (optional)" placeholderTextColor={colors.subtext} value={email} onChangeText={setEmail} style={styles.input}/>
      <Pressable
        onPress={async () => {
          try {
            await me();
            router.push({ pathname: '/checkout', params: { email } });
          } catch {
          await setPendingIntent({ type: 'checkout', email });
          router.push('/login');
          }
        }}
        style={styles.checkout}
      >
        <Text style={{ color:'white', fontWeight:'800' }}>Checkout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:colors.border, padding:12, borderRadius:radius, marginBottom:8, backgroundColor:colors.card, gap:8 },
  btn: { backgroundColor: colors.primary, paddingHorizontal:10, paddingVertical:6, borderRadius:8 },
  btnText: { color:'#fff', fontWeight:'800' },
  input: { borderWidth:1, borderColor:colors.border, borderRadius:radius, paddingHorizontal:12, height:40, backgroundColor:colors.card, color:colors.text, marginTop:8 },
  checkout: { backgroundColor: colors.accent, padding:14, borderRadius:12, alignItems:'center', marginTop:12 }
});
