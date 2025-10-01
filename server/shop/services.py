from django.db import transaction
from django.db.models import F
from .models import Cart, Order, OrderItem, Product

class OutOfStock(Exception):
    def __init__(self, product_id, requested, available):
        self.product_id = product_id; self.requested = requested; self.available = available

def get_or_create_cart(user=None, session_key=None):
    if user and getattr(user, "is_authenticated", False):
        cart, _ = Cart.objects.get_or_create(user=user)
    else:
        if not session_key:
            # a tiny fallback—callers should pass X-Session-Key
            session_key = "guest"
        cart, _ = Cart.objects.get_or_create(session_key=session_key)
    return cart

@transaction.atomic
def checkout_cart(cart: Cart, email: str | None, user):
    cart = Cart.objects.select_for_update().get(pk=cart.pk)
    items = list(cart.items.select_related("product"))
    if not items:
        return None

    total = 0
    # Lock each product
    product_ids = [it.product_id for it in items]
    locked = {p.id: p for p in Product.objects.select_for_update().filter(id__in=product_ids)}

    for it in items:
        p = locked[it.product_id]
        if it.quantity > p.stock:
            raise OutOfStock(str(p.id), it.quantity, p.stock)
        total += it.quantity * p.price_cents

    for it in items:
        Product.objects.filter(pk=it.product_id).update(stock=F("stock") - it.quantity)

    order = Order.objects.create(
        user=user if (user and getattr(user, "is_authenticated", False)) else None,
        email=email or (getattr(user, "email", "") if user and getattr(user, "is_authenticated", False) else ""),
        status="paid",
        total_cents=total,
    )
    OrderItem.objects.bulk_create([
        OrderItem(order=order, product=it.product, quantity=it.quantity, unit_price_cents=it.product.price_cents)
        for it in items
    ])
    cart.items.all().delete()
    return order
