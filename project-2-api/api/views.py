# api/views.py - COMPLETE PERFORMANCE OPTIMIZED VERSION
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django.views.decorators.vary import vary_on_headers
from django.utils import timezone

from django.contrib.auth.models import User
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

import requests
import re
import logging
from django.core.cache import cache

from .models import Post, Comment, Product, Order, Address
from .serializers import PostSerializer, CommentSerializer, ProductSerializer, OrderSerializer

logger = logging.getLogger(__name__)

# API Status endpoints
@api_view(['GET'])
@cache_page(60 * 5)  # Cache for 5 minutes
def hello_api(request):
    return Response({
        'message': 'Hello from HealClinics E-Commerce API!',
        'status': 'success',
        'version': '2.0.0',
        'timestamp': timezone.now().isoformat()
    })

@api_view(['GET'])
@cache_page(60 * 2)  # Cache for 2 minutes
def api_status(request):
    return Response({
        'api_status': 'running',
        'endpoints': {
            'products': '/api/products/',
            'orders': '/api/orders/',
            'posts': '/api/posts/',
            'address_lookup': '/api/address/lookup/',
            'address_suggest': '/api/address/suggest/',
        },
        'performance': {
            'cache_enabled': True,
            'database_optimized': True
        }
    })

# Blog ViewSets (optimized)
@method_decorator(cache_page(60 * 10), name='list')  # Cache list for 10 minutes
@method_decorator(cache_page(60 * 30), name='retrieve')  # Cache detail for 30 minutes
class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.filter(is_published=True)  # FIXED: Added queryset attribute
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content']
    ordering = ['-created_at']
    
    def get_queryset(self):
        # Optimize database queries with select_related
        return Post.objects.filter(is_published=True).select_related('author')
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()  # FIXED: Added queryset attribute
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Optimize with select_related
        return Comment.objects.select_related('author', 'post')
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

# E-commerce ViewSets (HEAVILY OPTIMIZED)
@method_decorator(cache_page(60 * 15), name='list')
@method_decorator(cache_page(60 * 60), name='retrieve')
@method_decorator(vary_on_headers('Accept-Language'), name='list')
class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """HealClinics Producten API - FIXED Field References"""
    # Base queryset - MUST match actual model fields
    queryset = Product.objects.filter(is_active=True).order_by('name_nl')
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name_nl', 'description']
    ordering = ['name_nl']
    
    def get_queryset(self):
        # SIMPLIFIED - No .only() to prevent field errors
        return Product.objects.filter(is_active=True).order_by('name_nl')
    
    def list(self, request, *args, **kwargs):
        try:
            # Enhanced error handling
            response = super().list(request, *args, **kwargs)
            response['X-Cache-Status'] = 'HIT' if hasattr(request, '_cache_hit') else 'MISS'
            response['X-Total-Products'] = self.get_queryset().count()
            return response
        except Exception as e:
            logger.error(f"ProductViewSet list error: {e}")
            return Response({
                'error': 'Product listing temporarily unavailable',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(cache_page(60 * 5), name='list')
class OrderViewSet(viewsets.ModelViewSet):
    """Bestellingen API - Optimized"""
    # FIXED: Added queryset attribute - REQUIRED FOR ROUTER  
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Optimize with select_related and prefetch_related
        base_queryset = Order.objects.select_related('user').prefetch_related('items__product')
        
        if self.request.user.is_staff:
            return base_queryset.all()
        return base_queryset.filter(user=self.request.user)

# JWT Token (enhanced with logging)
class HealClinicsTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer met logging"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['is_staff'] = user.is_staff
        
        logger.info(f"JWT token generated for user: {user.email}")
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'is_staff': self.user.is_staff,
        }
        
        return data

class HealClinicsTokenObtainPairView(TokenObtainPairView):
    serializer_class = HealClinicsTokenObtainPairSerializer

# User Registration
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Nederlandse user registratie"""
    
    try:
        data = request.data
        
        # Basic validation
        required_fields = ['email', 'first_name', 'last_name', 'password', 'password_confirm']
        for field in required_fields:
            if not data.get(field):
                return Response({
                    'error': f'{field.replace("_", " ").title()} is verplicht'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Email validation
        try:
            validate_email(data['email'])
        except ValidationError:
            return Response({
                'error': 'Voer een geldig e-mailadres in'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check unique email
        if User.objects.filter(email=data['email']).exists():
            return Response({
                'error': 'Dit e-mailadres is al in gebruik'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Password validation
        if data['password'] != data['password_confirm']:
            return Response({
                'error': 'Wachtwoorden komen niet overeen'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(data['password']) < 8:
            return Response({
                'error': 'Wachtwoord moet minimaal 8 tekens lang zijn'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user
        user = User.objects.create_user(
            username=data['email'],
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            password=data['password']
        )
        
        refresh = RefreshToken.for_user(user)
        
        logger.info(f"New user registered: {user.email}")
        
        return Response({
            'message': 'Account succesvol aangemaakt! Welkom bij HealClinics Nederland!',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_staff': user.is_staff,
            },
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return Response({
            'error': f'Registratie fout: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Address API Views
def validate_dutch_postal_code(postal_code):
    """Valideer Nederlandse postcode format (1234 AB)"""
    pattern = r'^[1-9][0-9]{3}\s?[A-Z]{2}$'  # Fixed regex
    return bool(re.match(pattern, postal_code.upper().replace(' ', ' ')))

# Address Management Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def user_addresses(request):
    """Get all addresses for authenticated user or create new address"""
    
    if request.method == 'GET':
        # Use select_related for optimization
        addresses = Address.objects.filter(user=request.user).select_related('user')
        addresses_data = []
        
        for address in addresses:
            addresses_data.append({
                'id': address.id,
                'address_type': address.address_type,
                'first_name': address.first_name,
                'last_name': address.last_name,
                'company': address.company,
                'street_address': address.street_address,
                'house_number': address.house_number,
                'house_number_addition': address.house_number_addition,
                'postal_code': address.postal_code,
                'city': address.city,
                'province': address.province,
                'country': address.country,
                'is_default_shipping': address.is_default_shipping,
                'is_default_billing': address.is_default_billing,
                'full_address': address.get_full_address(),
                'created_at': address.created_at,
            })
        
        return Response({
            'addresses': addresses_data,
            'count': len(addresses_data)
        })
    
    elif request.method == 'POST':
        data = request.data
        
        required_fields = [
            'first_name', 'last_name', 'street_address', 
            'house_number', 'postal_code', 'city'
        ]
        
        for field in required_fields:
            if not data.get(field):
                return Response({
                    'error': f'{field.replace("_", " ").title()} is verplicht'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        postal_code = data.get('postal_code', '').strip()
        if not validate_dutch_postal_code(postal_code):
            return Response({
                'error': 'Voer een geldige Nederlandse postcode in (bijv. 1234 AB)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        formatted_postal_code = postal_code.upper().replace(' ', '')
        formatted_postal_code = f"{formatted_postal_code[:4]} {formatted_postal_code[4:]}"
        
        try:
            address = Address.objects.create(
                user=request.user,
                address_type=data.get('address_type', 'shipping'),
                first_name=data.get('first_name'),
                last_name=data.get('last_name'),
                company=data.get('company', ''),
                street_address=data.get('street_address'),
                house_number=data.get('house_number'),
                house_number_addition=data.get('house_number_addition', ''),
                postal_code=formatted_postal_code,
                city=data.get('city').title(),
                province=data.get('province', 'Nederland'),
                country=data.get('country', 'Nederland'),
                is_default_shipping=data.get('is_default_shipping', False),
                is_default_billing=data.get('is_default_billing', False),
            )
            
            return Response({
                'message': 'Adres succesvol toegevoegd!',
                'address': {
                    'id': address.id,
                    'address_type': address.address_type,
                    'first_name': address.first_name,
                    'last_name': address.last_name,
                    'company': address.company,
                    'street_address': address.street_address,
                    'house_number': address.house_number,
                    'house_number_addition': address.house_number_addition,
                    'postal_code': address.postal_code,
                    'city': address.city,
                    'province': address.province,
                    'country': address.country,
                    'is_default_shipping': address.is_default_shipping,
                    'is_default_billing': address.is_default_billing,
                    'full_address': address.get_full_address(),
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Address creation error: {str(e)}")
            return Response({
                'error': f'Fout bij het toevoegen van adres: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def user_address_detail(request, address_id):
    """Update or delete specific address"""
    
    try:
        address = Address.objects.get(id=address_id, user=request.user)
    except Address.DoesNotExist:
        return Response({
            'error': 'Adres niet gevonden'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'PUT':
        data = request.data
        
        # Update address fields
        address.first_name = data.get('first_name', address.first_name)
        address.last_name = data.get('last_name', address.last_name)
        address.company = data.get('company', address.company)
        address.street_address = data.get('street_address', address.street_address)
        address.house_number = data.get('house_number', address.house_number)
        address.house_number_addition = data.get('house_number_addition', address.house_number_addition)
        address.city = data.get('city', address.city).title()
        address.province = data.get('province', address.province)
        address.country = data.get('country', address.country)
        
        # Postcode validatie bij update
        if 'postal_code' in data:
            postal_code = data.get('postal_code', '').strip()
            if not validate_dutch_postal_code(postal_code):
                return Response({
                    'error': 'Voer een geldige Nederlandse postcode in (bijv. 1234 AB)'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            formatted_postal_code = postal_code.upper().replace(' ', '')
            address.postal_code = f"{formatted_postal_code[:4]} {formatted_postal_code[4:]}"
        
        # Update default settings
        if 'is_default_shipping' in data:
            address.is_default_shipping = data.get('is_default_shipping', False)
        if 'is_default_billing' in data:
            address.is_default_billing = data.get('is_default_billing', False)
        
        address.save()
        
        return Response({
            'message': 'Adres succesvol bijgewerkt!',
            'address': {
                'id': address.id,
                'full_address': address.get_full_address(),
                'is_default_shipping': address.is_default_shipping,
                'is_default_billing': address.is_default_billing,
            }
        })
    
    elif request.method == 'DELETE':
        address_info = f"{address.street_address} {address.house_number}, {address.city}"
        address.delete()
        
        return Response({
            'message': f'Adres {address_info} succesvol verwijderd'
        })

# Django Checkout Views (if you have these models)
try:
    from .models import OrderItem, ShoppingCart, CartItem
    from .serializers import ShoppingCartSerializer, CartItemSerializer, CheckoutSerializer
    from decimal import Decimal
    from django.db import transaction

    # Nederlandse iDEAL banken configuratie
    IDEAL_BANKS = [
        {'code': 'ING', 'name': 'ING Bank'},
        {'code': 'RABO', 'name': 'Rabobank'},
        {'code': 'ABNAMRO', 'name': 'ABN AMRO'},
        {'code': 'SNS', 'name': 'SNS Bank'},
        {'code': 'ASNB', 'name': 'ASN Bank'},
        {'code': 'BUNQ', 'name': 'bunq'},
        {'code': 'KNAB', 'name': 'Knab'},
        {'code': 'REGIOBANK', 'name': 'RegioBank'},
    ]

    # Cart Management Views
    @api_view(['GET', 'POST'])
    @permission_classes([IsAuthenticated])
    def shopping_cart(request):
        """Winkelwagen beheer voor ingelogde gebruikers"""
        
        # Get or create cart
        cart, created = ShoppingCart.objects.get_or_create(user=request.user)
        
        if request.method == 'GET':
            serializer = ShoppingCartSerializer(cart)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Add item to cart
            product_id = request.data.get('product_id')
            quantity = int(request.data.get('quantity', 1))
            
            try:
                product = Product.objects.get(id=product_id, is_active=True)
            except Product.DoesNotExist:
                return Response({
                    'error': 'Product niet gevonden'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Add or update cart item
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={'quantity': quantity}
            )
            
            if not created:
                cart_item.quantity += quantity
                cart_item.save()
            
            return Response({
                'message': f'{product.name_nl} toegevoegd aan winkelwagen',
                'cart_total_items': cart.get_total_items()
            })

    @api_view(['PUT', 'DELETE'])
    @permission_classes([IsAuthenticated])
    def cart_item_detail(request, item_id):
        """Update of verwijder winkelwagen item"""
        
        try:
            cart_item = CartItem.objects.get(
                id=item_id,
                cart__user=request.user
            )
        except CartItem.DoesNotExist:
            return Response({
                'error': 'Winkelwagen item niet gevonden'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if request.method == 'PUT':
            quantity = int(request.data.get('quantity', 1))
            if quantity > 0:
                cart_item.quantity = quantity
                cart_item.save()
                return Response({
                    'message': 'Aantal bijgewerkt',
                    'quantity': cart_item.quantity
                })
            else:
                cart_item.delete()
                return Response({'message': 'Product verwijderd uit winkelwagen'})
        
        elif request.method == 'DELETE':
            product_name = cart_item.product.name_nl
            cart_item.delete()
            return Response({
                'message': f'{product_name} verwijderd uit winkelwagen'
            })

    # Checkout Process Views
    @api_view(['GET'])
    @permission_classes([IsAuthenticated])
    def checkout_init(request):
        """Initialize Nederlandse checkout proces"""
        
        # Get user cart
        try:
            cart = ShoppingCart.objects.get(user=request.user)
            if not cart.items.exists():
                return Response({
                    'error': 'Je winkelwagen is leeg'
                }, status=status.HTTP_400_BAD_REQUEST)
        except ShoppingCart.DoesNotExist:
            return Response({
                'error': 'Geen winkelwagen gevonden'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user addresses
        addresses = Address.objects.filter(user=request.user)
        addresses_data = []
        for address in addresses:
            addresses_data.append({
                'id': address.id,
                'address_type': address.address_type,
                'full_address': address.get_full_address(),
                'is_default_shipping': address.is_default_shipping,
                'is_default_billing': address.is_default_billing,
            })
        
        # Prepare checkout data
        cart_serializer = ShoppingCartSerializer(cart)
        
        return Response({
            'cart': cart_serializer.data,
            'addresses': addresses_data,
            'ideal_banks': IDEAL_BANKS,
            'shipping_cost': Decimal('4.95'),  # Nederlandse verzendkosten
            'tax_rate': 0.21,  # Nederlandse BTW
        })

    @api_view(['POST'])
    @permission_classes([IsAuthenticated])
    def process_checkout(request):
        """Nederlandse checkout verwerking"""
        
        serializer = CheckoutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        
        # Get user cart
        try:
            cart = ShoppingCart.objects.get(user=request.user)
            if not cart.items.exists():
                return Response({
                    'error': 'Je winkelwagen is leeg'
                }, status=status.HTTP_400_BAD_REQUEST)
        except ShoppingCart.DoesNotExist:
            return Response({
                'error': 'Geen winkelwagen gevonden'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate addresses
        try:
            shipping_address = Address.objects.get(
                id=validated_data['shipping_address_id'],
                user=request.user
            )
            billing_address = Address.objects.get(
                id=validated_data['billing_address_id'],
                user=request.user
            )
        except Address.DoesNotExist:
            return Response({
                'error': 'Geselecteerd adres niet gevonden'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Create order
                order = Order.objects.create(
                    user=request.user,
                    shipping_address=shipping_address,
                    billing_address=billing_address,
                    payment_method=validated_data.get('payment_method', 'ideal'),
                    ideal_bank=validated_data.get('ideal_bank', ''),
                    customer_notes=validated_data.get('customer_notes', ''),
                    shipping_cost=Decimal('4.95'),  # Nederlandse verzendkosten
                )
                
                # Create order items from cart
                for cart_item in cart.items.all():
                    OrderItem.objects.create(
                        order=order,
                        product=cart_item.product,
                        product_name=cart_item.product.name_nl,
                        product_sku=getattr(cart_item.product, 'sku', ''),
                        unit_price=cart_item.product.price,
                        quantity=cart_item.quantity,
                        total_price=cart_item.get_total_price(),
                    )
                
                # Calculate order totals
                order.calculate_totals()
                order.save()
                
                # Clear cart after successful order
                cart.items.all().delete()
                
                # TODO: Process payment with iDEAL (integrate payment provider)
                # For now, mark as pending
                order.status = 'confirmed'
                order.payment_status = 'paid'  # Simulate successful payment
                order.save()
                
                # Prepare response
                order_serializer = OrderSerializer(order)
                
                return Response({
                    'message': 'Bestelling succesvol geplaatst!',
                    'order': order_serializer.data,
                    'order_number': order.order_number,
                    'payment_url': f'/checkout/payment/{order.id}/'  # Voor iDEAL redirect
                }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            logger.error(f"Checkout processing error: {str(e)}")
            return Response({
                'error': f'Fout bij verwerken bestelling: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @api_view(['GET'])
    @permission_classes([IsAuthenticated]) 
    def order_confirmation(request, order_id):
        """Nederlandse order bevestiging"""
        
        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response({
                'error': 'Bestelling niet gevonden'
            }, status=status.HTTP_404_NOT_FOUND)
        
        order_serializer = OrderSerializer(order)
        
        return Response({
            'order': order_serializer.data,
            'message': f'Bedankt voor je bestelling! Je ontvangt binnen enkele minuten een bevestigingsmail.',
            'estimated_delivery': '2-3 werkdagen',
            'customer_service': 'info@healclinics.nl'
        })

except ImportError as e:
    logger.warning(f"Some checkout models not available: {e}")
    # Define placeholder views if models don't exist
    @api_view(['GET'])
    @permission_classes([IsAuthenticated])
    def shopping_cart(request):
        return Response({'message': 'Cart models not configured yet'})

# Enhanced PDOK Address Service
class PDOKAddressService:
    """PDOK Address Service - Enhanced met caching en error handling"""
    
    def __init__(self):
        self.base_url = "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free"
        self.timeout = 5
        self.cache_timeout = 60 * 60 * 24  # 24 hours
    
    def lookup_address(self, postcode: str, house_number: str) -> dict:
        try:
            # Clean postcode
            clean_postcode = re.sub(r'\s+', '', postcode.upper())
            
            # Validate postcode format
            if not re.match(r'^[1-9][0-9]{3}[A-Z]{2}$', clean_postcode):
                return {'success': False, 'error': 'Ongeldige postcode format'}
            
            # Enhanced cache key
            cache_key = f"pdok_address_{clean_postcode}_{house_number}"
            cached = cache.get(cache_key)
            if cached:
                logger.info(f"Address lookup cache HIT: {cache_key}")
                return cached
            
            # API call with better error handling
            params = {
                'fq': f'postcode:{clean_postcode} AND huisnummer:{house_number}',
                'rows': 1,
                'fl': 'straatnaam,huisnummer,postcode,woonplaatsnaam,provincienaam'
            }
            
            logger.info(f"PDOK API call: {self.base_url} with params: {params}")
            
            response = requests.get(
                self.base_url, 
                params=params, 
                timeout=self.timeout,
                headers={'User-Agent': 'HealClinics-Shop/1.0'}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('response', {}).get('numFound', 0) > 0:
                    doc = data['response']['docs'][0]
                    
                    result = {
                        'success': True,
                        'address': {
                            'street': doc.get('straatnaam', ''),
                            'house_number': str(doc.get('huisnummer', '')),
                            'postal_code': f"{clean_postcode[:4]} {clean_postcode[4:]}",
                            'city': doc.get('woonplaatsnaam', ''),
                            'province': doc.get('provincienaam', ''),
                            'country': 'Nederland'
                        }
                    }
                    
                    # Cache successful results
                    cache.set(cache_key, result, self.cache_timeout)
                    logger.info(f"Address lookup successful and cached: {cache_key}")
                    return result
                else:
                    logger.warning(f"PDOK: No results found for {clean_postcode} {house_number}")
                    
            return {'success': False, 'error': 'Adres niet gevonden'}
            
        except requests.RequestException as e:
            logger.error(f"PDOK API error: {str(e)}")
            return {'success': False, 'error': 'Adres service tijdelijk niet beschikbaar'}
        except Exception as e:
            logger.error(f"Address lookup error: {str(e)}")
            return {'success': False, 'error': 'Er ging iets mis'}

# Enhanced Address Endpoints
@api_view(['GET'])
@permission_classes([AllowAny])
@cache_page(60 * 60)  # Cache for 1 hour
def lookup_address(request):
    """Address lookup endpoint - Enhanced met caching"""
    postcode = request.GET.get('postcode', '').strip()
    house_number = request.GET.get('house_number', '').strip()
    
    if not postcode or not house_number:
        return Response({
            'success': False,
            'error': 'Postcode en huisnummer zijn verplicht'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Performance logging
    import time
    start_time = time.time()
    
    service = PDOKAddressService()
    result = service.lookup_address(postcode, house_number)
    
    end_time = time.time()
    logger.info(f"Address lookup took {end_time - start_time:.2f}s for {postcode} {house_number}")
    
    return Response(result, 
        status=status.HTTP_200_OK if result['success'] else status.HTTP_404_NOT_FOUND)

@api_view(['GET'])  
@permission_classes([AllowAny])
@cache_page(60 * 5)  # Cache suggestions for 5 minutes
def suggest_addresses(request):
    """Address suggestions endpoint - Enhanced"""
    query = request.GET.get('q', '').strip()
    
    if len(query) < 3:
        return Response({'success': True, 'suggestions': []})
    
    # Enhanced mock suggestions met meer Nederlandse steden
    suggestions = [
        {'formatted_address': f'{query} 1, 1012 NX Amsterdam', 'street': query, 'house_number': '1', 'postal_code': '1012 NX', 'city': 'Amsterdam'},
        {'formatted_address': f'{query} 2, 2513 AA Den Haag', 'street': query, 'house_number': '2', 'postal_code': '2513 AA', 'city': 'Den Haag'},
        {'formatted_address': f'{query} 3, 3011 AD Rotterdam', 'street': query, 'house_number': '3', 'postal_code': '3011 AD', 'city': 'Rotterdam'},
        {'formatted_address': f'{query} 4, 3512 JE Utrecht', 'street': query, 'house_number': '4', 'postal_code': '3512 JE', 'city': 'Utrecht'},
        {'formatted_address': f'{query} 5, 5611 EM Eindhoven', 'street': query, 'house_number': '5', 'postal_code': '5611 EM', 'city': 'Eindhoven'}
    ]
    
    # Filter suggestions based on query
    filtered_suggestions = [s for s in suggestions if query.lower() in s['formatted_address'].lower()]
    
    logger.info(f"Address suggestions for '{query}': {len(filtered_suggestions)} results")
    
    return Response({'success': True, 'suggestions': filtered_suggestions[:5]})
