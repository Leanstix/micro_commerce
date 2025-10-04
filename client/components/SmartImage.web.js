import { Image as RNImage } from 'react-native';
import Constants from 'expo-constants';

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  'http://127.0.0.1:8000';

function absolutize(uri) {
  if (!uri) return null;
  if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;
  if (uri.startsWith('/')) return `${API_BASE}${uri}`;
  return `${API_BASE}/${uri}`;
}

export default function SmartImage({ uri, style, ...rest }) {
  const src = absolutize(uri);
  return <RNImage source={src ? { uri: src } : null} style={style} {...rest} />;
}
