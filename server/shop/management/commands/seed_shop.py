from django.core.management.base import BaseCommand
from shop.models import Product

DEMO = [
    {"name":"Black Sneakers","description":"Comfort fit","price_cents":250000,"currency":"NGN","sku":"SKU001","stock":20},
    {"name":"Formal Shoe","description":"Leather","price_cents":450000,"currency":"NGN","sku":"SKU002","stock":10},
    {"name":"T-Shirt","description":"Cotton","price_cents":80000,"currency":"NGN","sku":"SKU003","stock":50},
    {"name":"Jeans","description":"Slim fit","price_cents":200000,"currency":"NGN","sku":"SKU004","stock":35},
    {"name":"Cap","description":"Adjustable","price_cents":30000,"currency":"NGN","sku":"SKU005","stock":100},
]

class Command(BaseCommand):
    help = "Seed demo products"
    def handle(self, *args, **kwargs):
        if Product.objects.exists():
            self.stdout.write("Products already seeded"); return
        Product.objects.bulk_create([Product(**d) for d in DEMO])
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(DEMO)} products"))
