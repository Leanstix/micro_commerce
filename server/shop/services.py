from django.db import transaction
from django.db.models import F
from django.utils import timezone
from .models import Cart, Order, OrderItem, Product, CartItem

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


class CheckoutError(Exception):
    """Raised for business-rule failures (empty cart, stock issues)."""
    def __init__(self, code, payload=None):
        super().__init__(code)
        self.code = code
        self.payload = payload or {}

@transaction.atomic
def checkout_cart(cart, email, user):
    """
    Convert a cart into a paid/pending Order.
    Returns the created Order instance.
    Raises CheckoutError for expected business failures.
    """
    if not user or not user.is_authenticated:
        raise CheckoutError("AUTH_REQUIRED")

    cart_items = list(
        CartItem.objects.select_for_update() 
        .select_related("product")
        .filter(cart=cart)
    )
    if not cart_items:
        raise CheckoutError("EMPTY_CART")

    conflicts = []
    for it in cart_items:
        p = it.product
        if it.quantity <= 0:
            conflicts.append({"product_id": str(p.id), "name": p.name, "requested": it.quantity, "available": p.stock})
        elif it.quantity > p.stock:
            conflicts.append({"product_id": str(p.id), "name": p.name, "requested": it.quantity, "available": p.stock})
    if conflicts:
        raise CheckoutError("INSUFFICIENT_STOCK_AT_CHECKOUT", {"items": conflicts})

    total_cents = 0
    for it in cart_items:
        total_cents += it.quantity * it.product.price_cents

    order = Order.objects.create(
        user=user,
        email=(email or user.email or ""),
        status="paid",
        total_cents=total_cents,
        created_at=timezone.now(), 
    )

    item_rows = []
    for it in cart_items:
        p = it.product
        subtotal = it.quantity * p.price_cents
        item_rows.append(
            OrderItem(
                order=order,
                product=p,
                quantity=it.quantity,
                unit_price_cents=p.price_cents,
            )
        )
        p.stock = p.stock - it.quantity
        p.save(update_fields=["stock"])

    OrderItem.objects.bulk_create(item_rows)

    CartItem.objects.filter(id__in=[ci.id for ci in cart_items]).delete()

    return order
