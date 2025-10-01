from django.urls import path
from . import views

urlpatterns = [
    path("products", views.ProductList.as_view()),
    path("products/<uuid:pk>", views.ProductDetail.as_view()),
    path("admin/products", views.AdminProductCreate.as_view()),
    path("admin/products/<uuid:pk>", views.AdminProductUpdate.as_view()),
    path("cart", views.CartView.as_view()),
    path("cart/items", views.CartItemCreate.as_view()),
    path("cart/items/<int:pk>", views.CartItemUpdate.as_view()),
    path("orders/checkout", views.CheckoutView.as_view()),
]
