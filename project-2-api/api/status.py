from django.http import JsonResponse

def handler(request):
    return JsonResponse({"status": "API is live"})
