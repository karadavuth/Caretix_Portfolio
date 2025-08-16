from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from ..services.address_service import get_address_service
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def lookup_address(request):
    """
    Lookup address by postcode and house number
    GET /api/address/lookup/?postcode=1012NX&house_number=1&house_number_addition=A
    """
    postcode = request.GET.get('postcode', '').strip()
    house_number = request.GET.get('house_number', '').strip()
    house_number_addition = request.GET.get('house_number_addition', '').strip()
    
    if not postcode:
        return Response({
            'success': False,
            'error': 'Postcode is verplicht'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not house_number:
        return Response({
            'success': False,
            'error': 'Huisnummer is verplicht'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        address_service = get_address_service()
        result = address_service.lookup_address(postcode, house_number, house_number_addition)
        
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_404_NOT_FOUND)
            
    except Exception as e:
        logger.error(f"Address lookup error: {str(e)}")
        return Response({
            'success': False,
            'error': 'Er ging iets mis bij het opzoeken van het adres'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def suggest_addresses(request):
    """
    Get address suggestions for autocomplete
    GET /api/address/suggest/?q=kalverstraat+amsterdam
    """
    query = request.GET.get('q', '').strip()
    
    if len(query) < 3:
        return Response({
            'success': True,
            'suggestions': []
        }, status=status.HTTP_200_OK)
    
    try:
        address_service = get_address_service()
        result = address_service.suggest_addresses(query)
        
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Address suggestions error: {str(e)}")
        return Response({
            'success': False,
            'suggestions': [],
            'error': 'Er ging iets mis bij het ophalen van adressuggesties'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
