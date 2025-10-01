# MicroCommerce — React Native (Expo) Client (Fixed)

This build removes deprecated `expo-router/babel` usage and adds the `expo-router` app plugin required for SDK 50/51.

## Run
```bash
npm install
# Set your API URL to your machine's LAN IP for device/emulator:
export EXPO_PUBLIC_API_URL=http://192.168.0.23:8000
npx expo start
```
Or edit `app.json` → `expo.extra.apiUrl`.

If you still hit bundler issues, clear caches:
```bash
rm -rf node_modules .expo .expo-shared && npm install
npx expo start -c
```
