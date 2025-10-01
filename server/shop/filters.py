import django_filters as df
from .models import Product

class ProductFilter(df.FilterSet):
    q = df.CharFilter(field_name="name", lookup_expr="icontains")
    min_price = df.NumberFilter(field_name="price_cents", lookup_expr="gte")
    max_price = df.NumberFilter(field_name="price_cents", lookup_expr="lte")

    class Meta:
        model = Product
        fields = ["q", "min_price", "max_price"]
