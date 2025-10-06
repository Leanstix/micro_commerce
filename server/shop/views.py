from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import permissions
from .models import Product, CartItem, Order, Cart
from .serializers import ProductOut, ProductIn, CartItemIn, CartOut, CheckoutIn, CartItemQty, CartItemOut, OrderOut, OrderItemOut
from .filters import ProductFilter
from .permissions import IsAdmin
from .services import get_or_create_cart, checkout_cart, OutOfStock, CheckoutError
from django.db import transaction

SESSION_HEADER = "X-Session-Key"

# Helpers
def _get_session_key(request):
    return request.headers.get(SESSION_HEADER) or request.COOKIES.get("sk")

def _merge_guest_into_user(user_cart: Cart, guest_cart: Cart):
    if not guest_cart or guest_cart.id == user_cart.id:
        return
    for it in guest_cart.items.select_related("product"):
        existing = user_cart.items.filter(product=it.product).first()
        if existing:
            existing.quantity = max(existing.quantity, it.quantity)
            existing.save(update_fields=["quantity"])
        else:
            user_cart.items.create(product=it.product, quantity=it.quantity)
    guest_cart.delete()

def _cart_from_request(request):
    if request.user and request.user.is_authenticated:
        with transaction.atomic():
            user_cart, _ = Cart.objects.select_for_update().get_or_create(user=request.user)
            sk = _get_session_key(request)
            if sk:
                guest = Cart.objects.select_for_update().filter(session_key=sk, user__isnull=True).first()
                if guest and guest.items.exists():
                    _merge_guest_into_user(user_cart, guest)
            return user_cart

    sk = _get_session_key(request)
    cart, _ = Cart.objects.get_or_create(session_key=sk, user=None)
    return cart

# Products (public)
class ProductList(generics.ListAPIView):
    queryset = Product.objects.filter(is_active=True).order_by("-created_at")
    serializer_class = ProductOut
    filterset_class = ProductFilter
    ordering_fields = ["created_at","price_cents","name"]

class ProductDetail(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductOut
    lookup_field = "pk"

# Admin products
class AdminProductCreate(generics.CreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductIn
    permission_classes = [IsAdmin]

class AdminProductUpdate(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductIn
    permission_classes = [IsAdmin]
    lookup_field = "pk"

# Cart endpoints
class CartView(APIView):
    def get(self, request):
        cart = _cart_from_request(request)
        items = CartItem.objects.filter(cart=cart).select_related("product")
        data = CartItemOut(items, many=True, context={"request": request}).data 
        total = sum(i.product.price_cents * i.quantity for i in items)
        return Response({"items": data, "total_cents": total})

class CartItemCreate(APIView):
    def post(self, request):
        cart = _cart_from_request(request)
        data = CartItemIn(data=request.data); data.is_valid(raise_exception=True)
        try:
            product = Product.objects.get(pk=data.validated_data["product_id"], is_active=True)
        except Product.DoesNotExist:
            return Response({"error": "PRODUCT_NOT_FOUND"}, status=status.HTTP_404_NOT_FOUND)

        existing = CartItem.objects.filter(cart=cart, product=product).first()
        already = existing.quantity if existing else 0
        incoming = data.validated_data["quantity"]

        if product.stock <= 0:
            return Response(
                {"error": "OUT_OF_STOCK", "detail": "No units left", "meta": {"product_id": str(product.id), "available": 0}},
                status=status.HTTP_409_CONFLICT
            )
        if already + incoming > product.stock:
            return Response(
                {
                    "error": "INSUFFICIENT_STOCK",
                    "detail": "Requested quantity exceeds stock",
                    "meta": {
                        "product_id": str(product.id),
                        "requested_total": already + incoming,
                        "available": product.stock,
                        "can_add_now": max(0, product.stock - already)
                    },
                },
                status=status.HTTP_409_CONFLICT
            )
        item, _ = CartItem.objects.get_or_create(cart=cart, product=product, defaults={"quantity": 0})
        item.quantity = already + incoming
        item.save()
        return Response({"id": item.id, "quantity": item.quantity}, status=status.HTTP_201_CREATED)

class CartItemUpdate(APIView):
    def patch(self, request, pk):
        cart = _cart_from_request(request)
        data = CartItemQty(data=request.data); data.is_valid(raise_exception=True)
        try:
            item = CartItem.objects.get(pk=pk, cart=cart)
        except CartItem.DoesNotExist:
            return Response(status=404)
        item.quantity = data.validated_data["quantity"]
        p = item.product
        if data.validated_data["quantity"] > p.stock:
            return Response(
                {"error":"OUT_OF_STOCK","detail":"Insufficient stock",
                "meta":{"product_id": str(p.id), "requested": data.validated_data["quantity"], "available": p.stock}},
                status=409
            )
        item.save()
        return Response({"ok": True})

    def delete(self, request, pk):
        cart = _cart_from_request(request)
        CartItem.objects.filter(pk=pk, cart=cart).delete()
        return Response(status=204)

class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        cart = _cart_from_request(request)
        data = CheckoutIn(data=request.data or {})
        data.is_valid(raise_exception=True)

        conflicts = []
        for it in cart.items.select_related("product"):
            if it.quantity > it.product.stock:
                conflicts.append({
                    "product_id": str(it.product.id),
                    "name": it.product.name,
                    "requested": it.quantity,
                    "available": it.product.stock,
                })
        if conflicts:
            return Response({"error": "INSUFFICIENT_STOCK_AT_CHECKOUT", "items": conflicts}, status=status.HTTP_409_CONFLICT)
        try:
            order = checkout_cart(
                cart,
                data.validated_data.get("email") or request.user.email,
                request.user
            )
        except CheckoutError as e:
            code = str(e)
            if code == "EMPTY_CART":
                return Response({"error": "EMPTY_CART"}, status=status.HTTP_400_BAD_REQUEST)
            if code == "INSUFFICIENT_STOCK":
                return Response({"error": "INSUFFICIENT_STOCK_AT_CHECKOUT"}, status=status.HTTP_409_CONFLICT)
            return Response({"error": "CHECKOUT_FAILED"}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"id": str(order.id), "status": order.status, "total_cents": order.total_cents},
            status=status.HTTP_201_CREATED
        )
        
        return Response({"id": str(order.id), "status": order.status, "total_cents": order.total_cents}, status=status.HTTP_201_CREATED)
    
class MyOrdersView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        orders = Order.objects.filter(user=request.user).order_by("-created_at")
        return Response([
            {
                "id": str(o.id),
                "status": o.status,
                "total_cents": o.total_cents,
                "created_at": o.created_at,
            } for o in orders
        ])

class OrderDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            o = Order.objects.prefetch_related("items__product").get(pk=pk, user=request.user)
        except Order.DoesNotExist:
            return Response(status=404)
        return Response(OrderOut(o, context={"request": request}).data)
