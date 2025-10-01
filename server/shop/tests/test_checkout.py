import pytest
from shop.models import Product, Cart, CartItem

@pytest.mark.django_db
def test_checkout_decrements_stock(client):
    p = Product.objects.create(name="Test", price_cents=1000, sku="X", stock=3)
    cart = Cart.objects.create(session_key="abc")
    CartItem.objects.create(cart=cart, product=p, quantity=2)
    res = client.post("/api/orders/checkout", HTTP_X_SESSION_KEY="abc")
    assert res.status_code == 201
    p.refresh_from_db()
    assert p.stock == 1

@pytest.mark.django_db
def test_out_of_stock_409(client):
    p = Product.objects.create(name="Test", price_cents=1000, sku="Y", stock=1)
    cart = Cart.objects.create(session_key="abc")
    CartItem.objects.create(cart=cart, product=p, quantity=3)
    res = client.post("/api/orders/checkout", HTTP_X_SESSION_KEY="abc")
    assert res.status_code == 409
    assert res.json()["error"] == "OUT_OF_STOCK"
