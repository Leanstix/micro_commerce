import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen name="index" options={{ title: "Products" }} />
        <Stack.Screen name="product/[id]" options={{ title: "Product" }} />
        <Stack.Screen name="cart" options={{ title: "Cart" }} />
        <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
        <Stack.Screen name="login" options={{ title: "Login" }} />
        <Stack.Screen name="orders" options={{ title: "My Orders" }} />
        <Stack.Screen name="admin/products" options={{ title: "Admin: Products" }} />
      </Stack>
    </SafeAreaProvider>
  );
}
