from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import (
    Post, Comment, Product, Order, OrderItem,
    UserProfile, Address, ShoppingCart, CartItem  # ← TOEGEVOEGD: Checkout models
)

# User & Authentication Serializers
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'date_joined']

class UserRegistrationSerializer(serializers.ModelSerializer):
    """Nederlandse user registratie serializer"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'password', 'password_confirm')
        
    def validate_email(self, value):
        """Check for unique email"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Dit e-mailadres is al in gebruik.")
        return value
    
    def validate(self, attrs):
        """Validate password confirmation"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Wachtwoorden komen niet overeen.'
            })
        return attrs
    
    def create(self, validated_data):
        """Create user with hashed password"""
        validated_data.pop('password_confirm')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password']
        )
        
        # Create UserProfile
        UserProfile.objects.create(user=user)
        
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    """User profile serializer voor account management"""
    user = serializers.StringRelatedField()
    
    class Meta:
        model = UserProfile
        fields = '__all__'

# Blog Serializers
class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'content', 'author', 'created_at']

class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    comments_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'author', 'created_at', 'updated_at', 
                 'is_published', 'comments', 'comments_count']
    
    def get_comments_count(self, obj):
        return obj.comments.count()

# STAP 6: ENHANCED PRODUCT SERIALIZERS MET IMAGE SUPPORT
class ProductSerializer(serializers.ModelSerializer):
    display_price = serializers.ReadOnlyField()
    price_excl_btw = serializers.ReadOnlyField()
    btw_amount = serializers.ReadOnlyField()
    is_on_sale = serializers.ReadOnlyField()
    sale_percentage = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()
    features_list = serializers.ReadOnlyField(source='get_features_list')
    absolute_url = serializers.ReadOnlyField(source='get_absolute_url')
    
    # STAP 6: IMAGE SUPPORT - Full URL for frontend consumption
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name_nl', 'description', 'short_description', 'features_list',
            'image', 'image_url', 'price', 'display_price', 'original_price',
            'price_excl_btw', 'btw_amount', 'is_on_sale', 'sale_percentage',
            'category', 'sku', 'stock', 'low_stock_threshold', 'is_low_stock',
            'is_active', 'is_featured', 'absolute_url', 'created_at', 'updated_at'
        ]
    
    def get_image_url(self, obj):
        """Return full URL for product image"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

class ProductAdminSerializer(ProductSerializer):
    """Extended serializer voor admin gebruik"""
    
    class Meta(ProductSerializer.Meta):
        # Inherit all fields from ProductSerializer
        fields = ProductSerializer.Meta.fields + []  # Add any admin-specific fields here if needed

# Shopping Cart Serializers - UPDATED MET IMAGE SUPPORT
class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name_nl', read_only=True)
    product_image_url = serializers.SerializerMethodField()  # UPDATED: Using SerializerMethodField for full URL
    unit_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    total_price = serializers.SerializerMethodField()
    
    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'product_name', 'product_image_url',
            'unit_price', 'quantity', 'total_price'
        ]
    
    def get_total_price(self, obj):
        return obj.get_total_price()
    
    def get_product_image_url(self, obj):
        """Return full URL for product image in cart"""
        if obj.product.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.product.image.url)
            return obj.product.image.url
        return None

class ShoppingCartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()
    tax_amount = serializers.SerializerMethodField()
    total_with_tax = serializers.SerializerMethodField()
    
    class Meta:
        model = ShoppingCart
        fields = [
            'id', 'items', 'total_items', 'subtotal', 
            'tax_amount', 'total_with_tax', 'updated_at'
        ]
    
    def get_total_items(self, obj):
        return obj.get_total_items()
    
    def get_subtotal(self, obj):
        return obj.get_subtotal()
    
    def get_tax_amount(self, obj):
        return obj.get_tax_amount()
    
    def get_total_with_tax(self, obj):
        return obj.get_total_with_tax()

# Order Serializers - SINGLE CLEAN VERSION
class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(read_only=True)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_name', 'product_sku', 
            'unit_price', 'quantity', 'total_price'
        ]

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display_nl', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'status_display', 'payment_status',
            'shipping_address', 'billing_address', 'subtotal', 'tax_amount', 
            'shipping_cost', 'total_amount', 'payment_method', 'ideal_bank',
            'customer_notes', 'created_at', 'updated_at', 'items'
        ]

# Address Serializer
class AddressSerializer(serializers.ModelSerializer):
    full_address = serializers.CharField(source='get_full_address', read_only=True)
    
    class Meta:
        model = Address
        fields = [
            'id', 'address_type', 'first_name', 'last_name', 'company',
            'street_address', 'house_number', 'house_number_addition',
            'postal_code', 'city', 'province', 'country',
            'is_default_shipping', 'is_default_billing', 'full_address'
        ]

# Checkout Serializer
class CheckoutSerializer(serializers.Serializer):
    """Nederlandse checkout data validation"""
    
    shipping_address_id = serializers.IntegerField()
    billing_address_id = serializers.IntegerField()
    payment_method = serializers.CharField(default='ideal')
    ideal_bank = serializers.CharField(required=False, allow_blank=True)
    customer_notes = serializers.CharField(required=False, allow_blank=True, max_length=500)
    terms_accepted = serializers.BooleanField()
    
    def validate(self, data):
        if not data.get('terms_accepted'):
            raise serializers.ValidationError("Je moet akkoord gaan met de algemene voorwaarden")
        
        if data.get('payment_method') == 'ideal' and not data.get('ideal_bank'):
            raise serializers.ValidationError("Selecteer je iDEAL bank")
        
        return data
