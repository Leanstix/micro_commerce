import AsyncStorage from '@react-native-async-storage/async-storage';
const INTENT = 'pending_intent';

const SK = 'session_key';
const AT = 'access_token';
const RT = 'refresh_token';

function uuid() {
  const rnd = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${rnd()}${rnd()}-${rnd()}-${rnd()}-${rnd()}-${rnd()}${rnd()}${rnd()}`;
}

export async function getSessionKey() {
  let sk = await AsyncStorage.getItem(SK);
  if (!sk) {
    sk = uuid();
    await AsyncStorage.setItem(SK, sk);
  }
  return sk;
}

export async function setTokens({ access, refresh }) {
  if (access) await AsyncStorage.setItem(AT, access);
  if (refresh) await AsyncStorage.setItem(RT, refresh);
}

export async function getAccessToken() {
  return AsyncStorage.getItem(AT);
}

export async function getRefreshToken() {
  return AsyncStorage.getItem(RT);
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([AT, RT]);
}


export async function setPendingIntent(intentObj) {
  await AsyncStorage.setItem(INTENT, JSON.stringify(intentObj));
}
export async function popPendingIntent() {
  const raw = await AsyncStorage.getItem(INTENT);
  if (!raw) return null;
  await AsyncStorage.removeItem(INTENT);
  try { return JSON.parse(raw); } catch { return null; }
}
