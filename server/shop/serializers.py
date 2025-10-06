from rest_framework import serializers
from .models import Product, Cart, CartItem, Order, OrderItem
from django.contrib.auth.password_validation import validate_password
from django.core import exceptions as dj_exc

class SignupIn(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)

    def validate(self, attrs):
        pw = attrs["password"]
        try:
            validate_password(pw)
        except dj_exc.ValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        return attrs

class ProductOut(serializers.ModelSerializer):
    image = serializers.ImageField(read_only=True)
    class Meta:
        model = Product
        fields = "__all__"

class ProductIn(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    class Meta:
        model = Product
        fields = ["name","description","price_cents","currency","sku","stock","is_active","image"]

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

class OrderItemOut(serializers.ModelSerializer):
    product = ProductOut()
    class Meta:
        model = OrderItem
        fields = ["product", "quantity", "unit_price_cents", "id", "order"]

class OrderOut(serializers.ModelSerializer):
    items = OrderItemOut(many=True, read_only=True)
    class Meta:
        model = Order
        fields = ["id", "status", "total_cents", "created_at", "items"]
