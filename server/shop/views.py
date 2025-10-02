from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Product, CartItem
from .serializers import ProductOut, ProductIn, CartItemIn, CartOut, CheckoutIn, CartItemQty
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
        return Response(CartOut(cart).data)

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
