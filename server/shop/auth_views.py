from django.contrib.auth.models import User
from django.core import signing
from django.utils import timezone
from django.conf import settings
from django.db import transaction
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .services import get_or_create_cart
from .serializers import SignupIn
from .models import Cart

SIGNER_SALT = "microcommerce.email.verify"
TOKEN_MAX_AGE = 60 * 60 * 24  # 24 hours

def make_verify_token(user_id: int) -> str:
    return signing.TimestampSigner(salt=SIGNER_SALT).sign(user_id)

def verify_token_value(token: str) -> int:
    # returns user_id or raises
    unsigned = signing.TimestampSigner(salt=SIGNER_SALT).unsign(token, max_age=TOKEN_MAX_AGE)
    return int(unsigned)

class SignupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = SignupIn(data=request.data); data.is_valid(raise_exception=True)
        email = data.validated_data["email"].lower()
        password = data.validated_data["password"]
        if User.objects.filter(email__iexact=email).exists():
            return Response({"error":"EMAIL_TAKEN"}, status=400)
        # username == email for simplicity
        user = User.objects.create_user(username=email, email=email, password=password, is_active=False)
        token = make_verify_token(user.id)
        verify_link = f'{settings.SITE_URL}/api/auth/verify?token={token}'
        # "Send" email (console backend) + also return link in dev to make testing easy
        # In prod: send mail and don't return the link
        print(f"[VERIFY] {email} -> {verify_link}")
        return Response({"ok": True, "verify_link": verify_link}, status=201)

class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        token = request.query_params.get("token")
        if not token:
            return Response({"error":"MISSING_TOKEN"}, status=400)
        try:
            uid = verify_token_value(token)
        except signing.BadSignature:
            return Response({"error":"INVALID_TOKEN"}, status=400)
        except signing.SignatureExpired:
            return Response({"error":"TOKEN_EXPIRED"}, status=400)

        try:
            user = User.objects.get(pk=uid)
        except User.DoesNotExist:
            return Response({"error":"USER_NOT_FOUND"}, status=404)

        if not user.is_active:
            user.is_active = True
            user.date_joined = timezone.now()
            user.save(update_fields=["is_active", "date_joined"])
        return Response({"ok": True})

class TokenObtainMergeSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # standard JWT issuance
        data = super().validate(attrs)

        # Merge guest cart (X-Session-Key) into the user's cart
        request = self.context["request"]
        sk = request.headers.get("X-Session-Key")
        if sk:
            try:
                with transaction.atomic():
                    guest_cart = Cart.objects.select_for_update().filter(session_key=sk).first()
                    if guest_cart:
                        user_cart, _ = Cart.objects.get_or_create(user=self.user)
                        # move items: upsert quantities
                        for it in guest_cart.items.select_related("product"):
                            existing = user_cart.items.filter(product=it.product).first()
                            if existing:
                                existing.quantity = max(existing.quantity, it.quantity)
                                existing.save()
                            else:
                                user_cart.items.create(product=it.product, quantity=it.quantity)
                        guest_cart.delete()
            except Exception:
                # don't block login if merge fails
                pass

        data["user"] = {"id": self.user.id, "email": self.user.email, "username": self.user.username}
        return data

class TokenObtainMergeView(TokenObtainPairView):
    serializer_class = TokenObtainMergeSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        u = request.user
        return Response({"id": u.id, "email": u.email, "username": u.username, "is_staff": u.is_staff})
