# Micro-Commerce (Django + Expo) — README

A compact full-stack micro-commerce app: **Django + DRF** backend and **Expo (React Native)** client.  
Features: products with images (served locally via `/media/`), guest carts with session key, signup + email verify, login with **guest→user cart merge**, checkout → **order receipt**, orders history, responsive product grid, tabs nav, logout, and re-fetch on tab focus. **Admin-only controls use the built-in Django Admin dashboard** (no custom admin UI, no S3 required).

---

## Table of Contents
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Setup & Run](#setup--run)
  - [Backend (Django)](#backend-django)
  - [Frontend (Expo / React Native)](#frontend-expo--react-native)
- [Environment Variables](#environment-variables)
- [Admin (Django Admin)](#admin-django-admin)
- [API Overview](#api-overview)
  - [Auth](#auth)
  - [Products](#products)
  - [Cart (Guest + Authenticated)](#cart-guest--authenticated)
  - [Orders](#orders)
- [Examples (curl)](#examples-curl)
- [Technology Stack](#technology-stack)
- [Known Limitations & Notes](#known-limitations--notes)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Prerequisites
- **Python** 3.10–3.12
- **Node** 18 or 20 (LTS)
- **npm** / **pnpm** / **yarn**
- Optional: Android/iOS toolchains if running native builds (Expo Go is fine for dev)

---

## Project Structure
```
micro_commerce/
├── server/
│   ├── microcommerce/            # Django project
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── ...
│   ├── shop/
│   │   ├── models.py             # Product, Cart, CartItem, Order, OrderItem
│   │   ├── admin.py              # Django Admin registration & customizations
│   │   ├── serializers.py
│   │   ├── views.py              # Products, Cart, Orders, Auth endpoints
│   │   ├── auth_views.py         # Signup, verify, /me (if split)
│   │   ├── services.py           # checkout_cart, helpers
│   │   ├── urls.py
│   │   └── management/commands/seed_shop.py
│   └── media/                    # Local uploaded product images (dev)
└── client/
    ├── app/
    │   ├── _layout.js
    │   ├── (tabs)/
    │   │   ├── _layout.js        # bottom tabs: Shop / Cart / Orders / Account
    │   │   ├── index.js          # responsive product grid
    │   │   ├── cart.js
    │   │   ├── orders.js
    │   │   └── account.js
    │   ├── product/[id].js
    │   ├── checkout.js
    │   ├── login.js
    │   ├── signup.js
    │   └── verify.js
    ├── components/
    │   ├── ProductCard.js
    │   ├── SmartImage.js
    │   ├── SmartImage.web.js
    │   └── Skeleton.js
    ├── lib/
    │   ├── api.js
    │   ├── session.js
    │   ├── theme.js
    │   ├── layout.js
    │   └── focusRefresh.js
    └── app.config.* / app.json
```

---

## Setup & Run

### Backend (Django)

1) **Create venv & install**
```bash
cd server
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements.txt \
  || pip install django djangorestframework djangorestframework-simplejwt Pillow corsheaders
```

2) **Configure settings** (`microcommerce/settings.py`)
```python
INSTALLED_APPS += ["rest_framework", "corsheaders", "shop", "django.contrib.admin", "django.contrib.auth"]
MIDDLEWARE = ["corsheaders.middleware.CorsMiddleware", *MIDDLEWARE]

# Dev email (verification links printed to console)
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
DEFAULT_FROM_EMAIL = "no-reply@microcommerce.local"

# Media (local dev)
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# CORS (dev-wide; restrict in prod)
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_HEADERS = ["content-type", "authorization", "x-session-key"]

# Used in verification links
SITE_URL = os.environ.get("SITE_URL", "http://127.0.0.1:8000")
```

3) **Migrate & seed**
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py seed_shop
```

4) **Create admin user**
```bash
python manage.py createsuperuser
# then follow prompts to set email/username/password
```

5) **Run**
```bash
python manage.py runserver 0.0.0.0:8000
```
Django serves `/media/` files in DEBUG mode. Django Admin at **http://127.0.0.1:8000/admin/**.

---

### Frontend (Expo / React Native)

1) **Install**
```bash
cd ../client
npm install
npx expo install expo-image expo-linear-gradient @react-native-async-storage/async-storage
```

2) **Set API URL**
- `.env` or app config:
```
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000
```

3) **Start**
```bash
npx expo start -c
```
Press **w** for web, or open in Expo Go.

4) **Flow**
- Browse as guest, add items (guest cart via `X-Session-Key`).
- Checkout prompts login/signup → verify email (console link in dev) → login merges guest cart.
- Checkout creates order → receipt page.
- Orders tab shows history.

---

## Environment Variables

**Backend**
- `SITE_URL` — Base for verify links (default `http://127.0.0.1:8000`)

**Frontend**
- `EXPO_PUBLIC_API_URL` — e.g., `http://127.0.0.1:8000`

---

## Admin (Django Admin)

Use **Django Admin** for all admin-only controls:
- Manage **Products** (create, edit, upload images, adjust stock, toggle active)
- View **Orders** & **OrderItems**
- Inspect **Carts** (optional)
- Manage **Users**

Access: `http://127.0.0.1:8000/admin/` with your superuser account.  
Customize `shop/admin.py` to tweak list displays, filters, search, inlines (e.g., `OrderItemInline` under `Order`).

---

## API Overview

### Headers used globally
- `Authorization: Bearer <access>` (for auth endpoints)
- `X-Session-Key: <guest session key>` (always send; guest carts & merge)

---

### Auth

#### `POST /api/auth/signup`
Request:
```json
{ "email": "sam@example.com", "password": "StrongPassw0rd!" }
```
**201**
```json
{ "ok": true, "verify_link": "http://127.0.0.1:8000/api/auth/verify?token=..." }
```

#### `GET /api/auth/verify?token=...`
**200** `{ "ok": true }`  
**400** `{ "error": "INVALID_TOKEN" | "TOKEN_EXPIRED" }`

#### `POST /api/auth/login`
Merges guest cart → user cart when `X-Session-Key` is present.
```json
{ "username": "sam@example.com", "password": "StrongPassw0rd!" }
```
**200**
```json
{
  "access":"<jwt>",
  "refresh":"<jwt>",
  "user":{"id":1,"email":"sam@example.com","username":"sam@example.com"}
}
```

#### `GET /api/auth/me` (auth)
**200**
```json
{ "id":1, "email":"sam@example.com", "username":"sam@example.com", "is_staff":false }
```

---

### Products

#### `GET /api/products?q=&page=1`
**200**
```json
[
  {
    "id":"a5f0...41fc",
    "name":"Black Sneakers",
    "description":"Comfort fit",
    "price_cents":250000,
    "currency":"NGN",
    "sku":"SKU001",
    "stock":20,
    "is_active":true,
    "image":"http://127.0.0.1:8000/media/products/sneaker.jpg"
  }
]
```

#### `GET /api/products/<uuid>`
Product detail.

> **Admin**: manage products entirely via **Django Admin** (`/admin/`). No separate admin API required.

---

### Cart (Guest & Authenticated)

Cart identity:
- **Guest** → `session_key` (header `X-Session-Key`)
- **Authenticated** → user cart.  
  Guest cart is **merged** into user cart on login and also **merged on any authed request** (defensive).

#### `GET /api/cart`
**200**
```json
{
  "items":[
    {
      "id":12,
      "quantity":2,
      "product":{
        "id":"a5f0...41fc","name":"Black Sneakers",
        "price_cents":250000,"currency":"NGN","sku":"SKU001",
        "stock":20,
        "image":"http://127.0.0.1:8000/media/products/sneaker.jpg"
      }
    }
  ],
  "total_cents":500000
}
```

#### `POST /api/cart/items`
Add or increment item (strict stock checks).
```json
{ "product_id":"a5f0...41fc", "quantity":1 }
```
**201** `{ "id":12, "quantity":2 }`  
**409** Out/insufficient stock
```json
{
  "error":"INSUFFICIENT_STOCK",
  "detail":"Requested quantity exceeds stock",
  "meta":{"product_id":"a5f0...41fc","requested_total":8,"available":5,"can_add_now":3}
}
```

#### `PATCH /api/cart/items/<id>`
Change quantity (strict).
```json
{ "quantity":3 }
```
**200** `{ "ok": true, "quantity": 3 }`  
**409** insufficient stock.

#### `DELETE /api/cart/items/<id>`
Remove item.

---

### Orders

#### `POST /api/orders/checkout` (auth)
Creates Order from current cart, decrements stock, clears cart.
**Headers**: `Authorization`, `X-Session-Key`  
**Body**: `{ "email": "receipt@example.com" }` (optional)
**201**
```json
{ "id":"9f8a...2c1e", "status":"paid", "total_cents":500000 }
```
**400** `{ "error":"EMPTY_CART" }`  
**409** (stock changed)
```json
{
  "error":"INSUFFICIENT_STOCK_AT_CHECKOUT",
  "items":[{"product_id":"...","name":"Black Sneakers","requested":3,"available":1}]
}
```

#### `GET /api/orders/me` (auth)
**200**
```json
[
  { "id":"9f8a...2c1e","status":"paid","total_cents":500000,"created_at":"2025-10-06T01:45:00Z" }
]
```

#### `GET /api/orders/<uuid>` (auth) — Receipt
**200**
```json
{
  "id":"9f8a...2c1e",
  "status":"paid",
  "total_cents":500000,
  "created_at":"2025-10-06T01:45:00Z",
  "items":[
    {
      "product":{
        "id":"a5f0...41fc","name":"Black Sneakers",
        "price_cents":250000,"currency":"NGN","sku":"SKU001",
        "image":"http://127.0.0.1:8000/media/products/sneaker.jpg"
      },
      "quantity":2,
      "unit_price_cents":250000,
      "subtotal_cents":500000
    }
  ]
}
```

---

## Examples (curl)

```bash
API=http://127.0.0.1:8000
SK=guest-123   # choose any random string

# Products
curl -s "$API/api/products?q=sneaker"

# Guest add to cart
curl -s -X POST "$API/api/cart/items" \
  -H "X-Session-Key: $SK" -H "Content-Type: application/json" \
  -d '{"product_id":"<uuid>","quantity":1}'

# Login (merge guest cart)
JWT=$(curl -s -X POST "$API/api/auth/login" \
  -H "X-Session-Key: $SK" -H "Content-Type: application/json" \
  -d '{"username":"sam@example.com","password":"StrongPassw0rd!"}' | jq -r .access)

# Checkout
curl -s -X POST "$API/api/orders/checkout" \
  -H "Authorization: Bearer $JWT" -H "X-Session-Key: $SK" \
  -H "Content-Type: application/json" -d '{}'

# Receipt
curl -s "$API/api/orders/<uuid>" \
  -H "Authorization: Bearer $JWT"
```

---

## Technology Stack

**Backend**
- Django, Django REST Framework
- SimpleJWT (JWT auth)
- Pillow (image uploads)
- django-cors-headers
- SQLite (dev) / PostgreSQL (prod ready)
- **Django Admin** for admin controls

**Frontend**
- Expo (React Native) + Expo Router
- `expo-image` (native caching) + web fallback (`SmartImage.web.js`)
- AsyncStorage (tokens & session key)
- Responsive grid (`useWindowDimensions`)
- `useFocusEffect` + AppState → re-fetch on tab focus/foreground

---

## Known Limitations & Notes
- **Payments mocked**: `checkout` marks orders `paid`. Integrate a PSP and move status changes to webhooks for real money.
- **Dev email**: verification emails print to console. Configure SMTP for real mail.
- **CORS** permissive in dev. Lock down origins/headers in prod.
- **Cart merge rule** uses **max(existing, incoming)** when merging guest→user (avoid double counts). Change to **sum** if that matches your business logic.
- **Images**: stored and served locally via `/media/` in dev. For production, consider a CDN/fronting web server for static/media performance.
- **Security**: add rate limits, strong password validators, HTTPS, secure cookies, and production CORS settings.

---

## Troubleshooting

- **`EMPTY_CART` after login during checkout**
  - Ensure all cart/checkout endpoints call a shared `_cart_from_request()` that:
    - returns **user cart** if authenticated,
    - and **merges** any guest cart (from `X-Session-Key`) into the user cart on **every authed request** (idempotent).
  - Client must send `X-Session-Key` on **all** requests, including `login`.

- **CORS preflight error for `X-Session-Key`**
  - Add `"x-session-key"` to `CORS_ALLOW_HEADERS` and allow your Expo dev origin.

- **Images missing in cart/receipt**
  - In serializers, pass `context={"request": request}` so `ImageField` becomes **absolute URL**.
  - Client `SmartImage` converts relative `/media/...` to absolute using `EXPO_PUBLIC_API_URL`.

- **Tabs not refreshing**
  - Each tab screen calls `useRefetchOnFocus(loadFn)` from `lib/focusRefresh.js`.

---

## License
MIT — do what you want, just don’t sue me.
