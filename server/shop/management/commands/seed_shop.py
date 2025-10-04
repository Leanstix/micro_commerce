from django.core.management.base import BaseCommand
from shop.models import Product

DEMO = [
    {"name":"Black Sneakers","description":"Comfort fit","price_cents":250000,"currency":"NGN","sku":"SKU001","stock":20,"image_url":"https://picsum.photos/seed/sneakers/800/800"},
    {"name":"Formal Shoe","description":"Leather","price_cents":450000,"currency":"NGN","sku":"SKU002","stock":10,"image_url":"https://picsum.photos/seed/formal/800/800"},
    {"name":"T-Shirt","description":"Cotton","price_cents":80000,"currency":"NGN","sku":"SKU003","stock":50,"image_url":"https://picsum.photos/seed/tshirt/800/800"},
    {"name":"Jeans","description":"Slim fit","price_cents":200000,"currency":"NGN","sku":"SKU004","stock":35,"image_url":"https://picsum.photos/seed/jeans/800/800"},
    {"name":"Cap","description":"Adjustable","price_cents":30000,"currency":"NGN","sku":"SKU005","stock":100,"image_url":"https://picsum.photos/seed/cap/800/800"},
]

class Command(BaseCommand):
    help = "Seed demo products"
    def handle(self, *args, **kwargs):
        if Product.objects.exists():
            self.stdout.write("Products already seeded"); return
        Product.objects.bulk_create([Product(**d) for d in DEMO])
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(DEMO)} products"))
