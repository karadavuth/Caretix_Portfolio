from django.contrib import admin
from django.utils.html import format_html
from .models import Post, Comment, Product, Order, OrderItem, Address, ShoppingCart, CartItem, UserProfile

# STAP 5: ENHANCED PRODUCT ADMIN MET IMAGE SUPPORT
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        'image_thumbnail', 'name_nl', 'sku', 'price', 'category', 
        'stock', 'is_low_stock', 'is_featured', 'is_active', 'created_at'
    ]
    # ✅ FIXED: Match field name from list_display
    list_display_links = ['name_nl']  # Was 'name', nu 'name_nl'
    
    list_filter = ['category', 'is_active', 'is_featured', 'created_at']
    search_fields = ['name_nl', 'sku', 'description', 'short_description']
    ordering = ['-created_at']
    readonly_fields = ['sku', 'image_preview', 'price_excl_btw', 'btw_amount', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basis Informatie', {
            'fields': ('name_nl', 'short_description', 'description', 'features')
        }),
        ('Media', {
            'fields': ('image', 'image_preview')
        }),
        ('Prijzen & BTW', {
            'fields': ('price', 'original_price', 'price_excl_btw', 'btw_amount'),
            'description': 'Prijzen zijn inclusief 21% Nederlandse BTW'
        }),
        ('Categorie & SKU', {
            'fields': ('category', 'sku')
        }),
        ('Voorraad', {
            'fields': ('stock', 'low_stock_threshold')
        }),
        ('Status & Zichtbaarheid', {
            'fields': ('is_active', 'is_featured')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def image_thumbnail(self, obj):
        """Display small thumbnail in list view"""
        if obj.image:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 4px;" />',
                obj.image.url
            )
        return "Geen afbeelding"
    image_thumbnail.short_description = 'Afbeelding'
    
    def image_preview(self, obj):
        """Display larger image preview in detail view"""
        if obj.image:
            return format_html(
                '<img src="{}" width="300" style="max-height: 300px; object-fit: contain; border: 1px solid #ddd; border-radius: 4px;" />',
                obj.image.url
            )
        return "Geen afbeelding geüpload"
    image_preview.short_description = 'Afbeelding Voorbeeld'
    
    def is_low_stock(self, obj):
        """Display low stock warning"""
        if obj.is_low_stock:
            return format_html(
                '<span style="color: red; font-weight: bold;">⚠️ Laag ({})</span>',
                obj.stock
            )
        return f"✅ {obj.stock}"
    is_low_stock.short_description = 'Voorraad Status'
    
    def save_model(self, request, obj, form, change):
        """Add custom save logic"""
        super().save_model(request, obj, form, change)
        
        # Log product changes
        if change:
            print(f"Product updated: {obj.name_nl} by {request.user}")
        else:
            print(f"New product created: {obj.name_nl} by {request.user}")

# Rest van je admin classes blijven exact hetzelfde...

# Order Item Admin - FIXED FIELD NAMES  
@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'product_name', 'unit_price', 'quantity', 'total_price']
    list_filter = ['order__status']
    search_fields = ['product_name', 'order__order_number']
    ordering = ['-created_at']

# Order Admin
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'customer_name', 'customer_email', 'status', 'payment_status', 'total_amount', 'created_at']
    list_filter = ['status', 'payment_status', 'payment_method']
    search_fields = ['order_number', 'customer_email', 'customer_name']
    ordering = ['-created_at']
    readonly_fields = ['order_number', 'created_at', 'updated_at']

# Address Admin
@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ['user', 'address_type', 'full_name', 'city', 'postal_code', 'is_default_shipping', 'is_default_billing']
    list_filter = ['address_type', 'city', 'is_default_shipping', 'is_default_billing']
    search_fields = ['first_name', 'last_name', 'city', 'postal_code']
    
    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    full_name.short_description = 'Naam'

# Shopping Cart Admin
@admin.register(ShoppingCart)
class ShoppingCartAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_items', 'subtotal', 'updated_at']
    search_fields = ['user__username', 'user__email']
    
    def total_items(self, obj):
        return obj.get_total_items()
    total_items.short_description = 'Items'
    
    def subtotal(self, obj):
        return f"€{obj.get_subtotal():.2f}"
    subtotal.short_description = 'Subtotaal'

# Cart Item Admin
@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['cart', 'product', 'quantity', 'total_price']
    list_filter = ['product__category']
    
    def total_price(self, obj):
        return f"€{obj.get_total_price():.2f}"
    total_price.short_description = 'Totaal'

# Basic model registrations
@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'is_published', 'created_at']
    list_filter = ['is_published', 'created_at']
    search_fields = ['title', 'content']

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['post', 'author', 'created_at']
    list_filter = ['created_at']
    search_fields = ['content', 'author__username']

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone', 'newsletter_subscription', 'created_at']
    list_filter = ['newsletter_subscription']
    search_fields = ['user__username', 'user__email', 'phone']
