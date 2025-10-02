from rest_framework import serializers
from .models import Product, Cart, CartItem, Order, OrderItem

class ProductOut(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = "__all__"

class ProductIn(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["name","description","price_cents","currency","sku","stock","is_active"]

class CartItemIn(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)

class CartItemOut(serializers.ModelSerializer):
    product = ProductOut()
    class Meta:
        model = CartItem
        fields = ["id","product","quantity"]

class CartOut(serializers.ModelSerializer):
    items = CartItemOut(many=True)
    class Meta:
        model = Cart
        fields = ["id","user","session_key","items","updated_at"]

class CheckoutIn(serializers.Serializer):
    email = serializers.EmailField(required=False)

class CartItemQty(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)
