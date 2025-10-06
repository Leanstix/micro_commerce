import { View, Text, Pressable, StyleSheet } from 'react-native';
import SmartImage from './SmartImage';
import Skeleton from './Skeleton';
import { colors, radius, spacing, shadow } from '../lib/theme';
import { useState } from 'react';

export default function ProductCard({ item, onPress, onAdd, width }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <Pressable onPress={onPress} style={[styles.card, width ? { width } : null]}>
      <View style={styles.imageWrap}>
        <SmartImage
          uri={item.image || item.image_url}
          style={[styles.image, width ? { height: Math.max(140, Math.floor(width)) } : null]}
          contentFit="cover"
          onLoadEnd={() => setLoaded(true)}
       />
        {!loaded && <Skeleton height="100%" radius={radius} />}
      </View>
      <View style={{ gap: 4 }}>
        <Text numberOfLines={1} style={styles.title}>{item.name}</Text>
        <Text numberOfLines={2} style={styles.desc}>{item.description}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.price}>
          {(item.price_cents/100).toLocaleString(undefined, { style:'currency', currency: item.currency || 'NGN' })}
        </Text>
        <Pressable
          onPress={onAdd}
          disabled={!item.stock || item.stock <= 0}
          style={[styles.btn, (!item.stock || item.stock <= 0) && { opacity: 0.4 }]}
        >
          <Text style={styles.btnText}>{(!item.stock || item.stock <= 0) ? 'Out of stock' : 'Add'}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing, marginBottom: spacing,
    ...shadow,
    gap: 8,
  },
  imageWrap: {
      height: 160,
      borderRadius: radius,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      position: 'relative',
  },
  image: { width: '100%', height: '100%' }, 
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  desc: { color: colors.subtext, fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  price: { fontWeight: '800', color: colors.text, fontSize: 14 },
  btn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '700' },
});
