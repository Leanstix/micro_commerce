import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function ProductCard({ item, onPress, onAdd }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Text style={styles.title}>{item.name}</Text>
      <Text numberOfLines={2} style={styles.desc}>{item.description}</Text>
      <View style={styles.row}>
        <Text style={styles.price}>
          {(item.price_cents/100).toLocaleString(undefined, { style:'currency', currency: item.currency || 'NGN' })}
        </Text>
        <Pressable onPress={onAdd} style={styles.btn}>
          <Text style={{ color: 'white', fontWeight: '600' }}>Add</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', marginBottom: 12, backgroundColor: 'white' },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  desc: { color: '#555' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  price: { fontWeight: '700' },
  btn: { backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }
});
