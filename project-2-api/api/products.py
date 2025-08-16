import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myapi.settings')

import django
django.setup()

from django.http import JsonResponse
from api.models import Product
from api.serializers import ProductSerializer

def handler(request):
    if request.method == 'GET':
        products = Product.objects.all()
        serializer = ProductSerializer(products, many=True)
        return JsonResponse(serializer.data, safe=False)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)
