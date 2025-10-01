# Micro-Commerce (Django + DRF)

A minimal micro-commerce API: products, cart, checkout, and basic admin product CRUD. JWT auth via SimpleJWT. Works with SQLite (dev) or Postgres (via `DATABASE_URL`).

## Quick Start (Local)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_shop
python manage.py runserver 0.0.0.0:8000
```

Open: `http://localhost:8000/admin` for admin.

## Docker (with Postgres)
```bash
docker compose up --build
```

## Endpoints

- `POST /api/auth/login` -> { access, refresh }
- `POST /api/auth/refresh`
- `GET /api/products?q=&min_price=&max_price=&page=&ordering=`
- `GET /api/products/<uuid>`
- `POST /api/admin/products` (staff only)
- `PATCH /api/admin/products/<uuid>` (staff only)
- `DELETE /api/admin/products/<uuid>` (staff only)
- `GET /api/cart` (uses `X-Session-Key` header for guests)
- `POST /api/cart/items` `{ product_id, quantity }`
- `PATCH /api/cart/items/<id>` `{ product_id, quantity }`
- `DELETE /api/cart/items/<id>`
- `POST /api/orders/checkout` `{ email? }`

> For guest cart, send a persistent header: `X-Session-Key: <uuid>`.

## Tests
```bash
pytest
```

## Notes
- Checkout is mocked to mark orders as `paid` without a gateway.
- Stock is decremented atomically using `select_for_update` + `F()` updates.
- Extend with real payments, addresses, and webhooks as needed.
