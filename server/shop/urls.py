from django.urls import path
from . import views
from .auth_views import SignupView, VerifyEmailView, TokenObtainMergeView, MeView

urlpatterns = [
    path("auth/signup", SignupView.as_view()),
    path("auth/verify", VerifyEmailView.as_view()),
    path("auth/login", TokenObtainMergeView.as_view()),
    path("auth/me", MeView.as_view()),
    path("products", views.ProductList.as_view()),
    path("products/<uuid:pk>", views.ProductDetail.as_view()),
    path("admin/products", views.AdminProductCreate.as_view()),
    path("admin/products/<uuid:pk>", views.AdminProductUpdate.as_view()),
    path("cart", views.CartView.as_view()),
    path("cart/items", views.CartItemCreate.as_view()),
    path("cart/items/<int:pk>", views.CartItemUpdate.as_view()),
    path("orders/checkout", views.CheckoutView.as_view()),
    path("orders/me", views.MyOrdersView.as_view()),
    path("orders/<uuid:pk>", views.OrderDetailView.as_view()),
]
