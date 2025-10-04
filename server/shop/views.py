from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import permissions
from .models import Product, CartItem, Order
from .serializers import ProductOut, ProductIn, CartItemIn, CartOut, CheckoutIn, CartItemQty, CartItemOut
from .filters import ProductFilter
from .permissions import IsAdmin
from .services import get_or_create_cart, checkout_cart, OutOfStock

# Helpers
def _cart_from_request(request):
    session_key = request.headers.get("X-Session-Key")
    return get_or_create_cart(request.user, session_key)

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
        pid = data.validated_data["product_id"]; qty = data.validated_data["quantity"]
        item, created = CartItem.objects.get_or_create(cart=cart, product_id=pid, defaults={"quantity": qty})
        if not created:
            item.quantity = qty
            item.save()
        return Response({"ok": True}, status=201)

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
        data = CheckoutIn(data=request.body and request.data); data.is_valid(raise_exception=True)
        try:
            order = checkout_cart(cart, data.validated_data.get("email"), request.user)
        except OutOfStock as e:
            return Response(
                {"error":"OUT_OF_STOCK","detail":"Insufficient stock",
                 "meta":{"product_id":e.product_id,"requested":e.requested,"available":e.available}},
                 status=409)
        if not order:
            return Response({"error":"EMPTY_CART"}, status=400)
        return Response({"order_id": str(order.id), "status": order.status, "total_cents": order.total_cents}, status=201)
    
class MyOrdersView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        orders = Order.objects.filter(user=request.user).order_by("-created_at")
        # very small inline serializer to avoid a new file
        return Response([
            {
                "id": str(o.id),
                "status": o.status,
                "total_cents": o.total_cents,
                "created_at": o.created_at,
            } for o in orders
        ])
