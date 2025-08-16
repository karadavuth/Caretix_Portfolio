from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

# Router voor ViewSets
router = DefaultRouter()
router.register(r'products', views.ProductViewSet)  # Dit zorgt voor /api/products/ endpoints
router.register(r'posts', views.PostViewSet)
router.register(r'comments', views.CommentViewSet)
router.register(r'orders', views.OrderViewSet)

urlpatterns = [
    # Simple API endpoints
    path('hello/', views.hello_api, name='hello_api'),
    path('status/', views.api_status, name='api_status'),
    
    # Router endpoints (products, posts, etc.) - Dit handelt /api/products/ af
    path('', include(router.urls)),
    
    # Authentication endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/register/', views.register_user, name='register_user'),
    
    # Address management endpoints
    path('addresses/', views.user_addresses, name='user_addresses'),
    path('addresses/<int:address_id>/', views.user_address_detail, name='user_address_detail'),

    # Shopping Cart endpoints
    path('cart/', views.shopping_cart, name='shopping_cart'),
    path('cart/items/<int:item_id>/', views.cart_item_detail, name='cart_item_detail'),
    
    # Checkout endpoints
    path('checkout/init/', views.checkout_init, name='checkout_init'),
    path('checkout/process/', views.process_checkout, name='process_checkout'),
    path('orders/<int:order_id>/confirmation/', views.order_confirmation, name='order_confirmation'),

    # Address lookup endpoints
    path('address/lookup/', views.lookup_address, name='address_lookup'),
    path('address/suggest/', views.suggest_addresses, name='address_suggest'),
    
    # REMOVED: Conflicting product paths - router handles these automatically
    # path('products/', views.ProductListView.as_view(), name='product-list'),
    # path('products/<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
]
