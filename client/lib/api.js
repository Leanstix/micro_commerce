import axios from 'axios';
import Constants from 'expo-constants';
import { getSessionKey, getAccessToken, getRefreshToken, setTokens, clearTokens } from './session';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? Constants.expoConfig?.extra?.apiUrl ?? "http://127.0.0.1:8000";
console.log("API_URL =", API_URL);
export const api = axios.create({ baseURL: `${API_URL}/api` });

api.interceptors.request.use(async (config) => {
  const sk = await getSessionKey();
  config.headers['X-Session-Key'] = sk;
  const token = await getAccessToken();
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let queue = [];

function onRefreshed(token) {
  queue.forEach(p => p.resolve(token));
  queue = [];
}
function onFailed(err) {
  queue.forEach(p => p.reject(err));
  queue = [];
}

export async function adminCreateProduct(fields) {
  const fd = new FormData();
  Object.entries(fields).forEach(([k,v]) => fd.append(k, v));
  const { data } = await api.post('/admin/products', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response && error.response.status === 401 && !original._retry) {
      original._retry = true;
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve: (t) => { original.headers['Authorization'] = `Bearer ${t}`; resolve(api(original)); }, reject });
        });
      }
      isRefreshing = true
      try {
        const refresh = await getRefreshToken();
        if (!refresh) throw new Error('no refresh');
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refresh });
        await setTokens({ access: data.access });
        isRefreshing = false;
        onRefreshed(data.access);
        original.headers['Authorization'] = `Bearer ${data.access}`;
        return api(original);
      } catch (e) {
        isRefreshing = false;
        onFailed(e);
        await clearTokens();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export async function listProducts(params = {}) {
  const { data } = await api.get('/products', { params });
  return data;
}
export async function getProduct(id) {
  const { data } = await api.get(`/products/${id}`);
  return data;
}
export async function addToCart(product_id, quantity = 1) {
  const { data } = await api.post('/cart/items', { product_id, quantity });
  return data;
}
export async function getCart() {
  const { data } = await api.get('/cart');
  return data;
}
export async function updateCartItem(id, quantity) {
  const { data } = await api.patch(`/cart/items/${id}`, { quantity });
  return data;
}
export async function deleteCartItem(id) {
  await api.delete(`/cart/items/${id}`);
}
export async function checkout(email) {
  const { data } = await api.post('/orders/checkout', email ? { email } : {});
  return data;
}
export async function login(username, password) {
  const sk = await getSessionKey();
  const { data } = await axios.post(
    `${API_URL}/api/auth/login`,
    { username, password },
    { headers: { 'X-Session-Key': sk } }
  );
  return data;
}

export async function signup(email, password) {
  const { data } = await axios.post(`${API_URL}/api/auth/signup`, { email, password });
  return data; 
}

export async function verifyEmail(token) {
  const { data } = await axios.get(`${API_URL}/api/auth/verify`, { params: { token } });
  return data; 
}

export async function me() {
  const { data } = await api.get('/auth/me');
  return data; 
}

export async function myOrders() {
  const { data } = await api.get('/orders/me');
  return data;
}
