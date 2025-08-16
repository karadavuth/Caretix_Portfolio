from django.core.wsgi import get_wsgi_application
import os

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myapi.settings')
application = get_wsgi_application()

from api.models import Product
from api.serializers import ProductSerializer
from django.http import JsonResponse

def handler(request):
    products = Product.objects.all()
    serializer = ProductSerializer(products, many=True)
    return JsonResponse(serializer.data, safe=False)
