# api/models.py
from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal
import uuid
import datetime

# Post model (je bestaande code blijft hetzelfde)
class Post(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    is_published = models.BooleanField(default=True)  # ← Nieuw veld toegevoegd
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

# Comment model (je bestaande code blijft hetzelfde)  
class Comment(models.Model):
    post = models.ForeignKey(Post, related_name='comments', on_delete=models.CASCADE)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Comment by {self.author.username} on {self.post.title}'

# STAP 2: ENHANCED PRODUCT MODEL MET IMAGE SUPPORT
class Product(models.Model):
    """HealClinics Producten Model - Nederlandse Markt Met Afbeeldingen"""
    name_nl = models.CharField(max_length=200, help_text="Nederlandse productnaam")
    description = models.TextField()
    
    # STAP 2: IMAGE FIELD TOEGEVOEGD
    image = models.ImageField(
        upload_to='products/',
        null=True,
        blank=True,
        help_text="Product afbeelding (max 5MB)"
    )
    
    price = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        default=0.00,
        help_text="Prijs inclusief 21% BTW in EUR (zoals weergegeven aan klanten)"
    )
    
    # STAP 2: UITGEBREIDE NEDERLANDSE CATEGORIEËN
    CATEGORY_CHOICES = [
        ('honing', 'Biologische Honing'),
        ('manuka', 'Manuka Honing'),
        ('cupping', 'Cupping Tools & Sets'),
        ('cupping_cups', 'Cupping Cups'),
        ('cupping_accessories', 'Cupping Accessoires'),
        ('supplementen', 'Voedingssupplementen'),
        ('vitamines', 'Vitamines & Mineralen'),
        ('kruiden', 'Kruidentherapie'),
        ('oliën', 'Etherische Oliën'),
        ('massage', 'Massage Producten'),
        ('wellness', 'Wellness & Ontspanning'),
        ('boeken', 'Therapeutische Boeken'),
        ('apparatuur', 'Medische Apparatuur'),
    ]
    
    category = models.CharField(
        max_length=50, 
        choices=CATEGORY_CHOICES,
        help_text="Product categorie"
    )
    
    # STAP 2: SEO EN MARKETING VELDEN
    short_description = models.CharField(
        max_length=160, 
        blank=True,
        help_text="Korte beschrijving voor zoekresultaten (max 160 karakters)"
    )
    
    features = models.TextField(
        blank=True,
        help_text="Belangrijke productkenmerken (één per regel)"
    )
    
    # STAP 2: INVENTORY EN SALES VELDEN
    sku = models.CharField(
        max_length=50, 
        unique=True, 
        blank=True,
        help_text="Stock Keeping Unit (wordt automatisch gegenereerd)"
    )
    
    stock = models.PositiveIntegerField(default=0, help_text="Voorraad aantal")
    low_stock_threshold = models.PositiveIntegerField(default=10, help_text="Waarschuwing bij lage voorraad")
    
    # STAP 2: PRODUCT STATUS EN ZICHTBAARHEID
    is_active = models.BooleanField(default=True, help_text="Actief in webshop")
    is_featured = models.BooleanField(default=False, help_text="Featured product op homepage")
    
    # STAP 2: PRICING EN PROMOTIE VELDEN
    original_price = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Oorspronkelijke prijs (voor kortingen)"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_featured', '-created_at']
        verbose_name = 'Product'
        verbose_name_plural = 'Producten'
    
    def __str__(self):
        return self.name_nl
    
    def save(self, *args, **kwargs):
        # Auto-generate SKU if not provided
        if not self.sku:
            self.sku = self.generate_sku()
        super().save(*args, **kwargs)
    
    def generate_sku(self):
        """Generate unique SKU for product"""
        import uuid
        prefix = self.category.upper()[:3] if self.category else 'PRD'
        unique_id = str(uuid.uuid4())[:8].upper()
        return f"HC-{prefix}-{unique_id}"
    
    @property
    def price_excl_btw(self):
        """Prijs exclusief BTW (alleen voor administratieve doeleinden)"""
        if self.price is None or self.price == 0:
            return None
        
        # Zorg dat price altijd een Decimal is
        price = self.price
        if isinstance(price, float):
            price = Decimal(str(price))
        elif not isinstance(price, Decimal):
            price = Decimal(str(price))
        
        return price / Decimal('1.21')
    
    @property
    def btw_amount(self):
        """BTW bedrag (voor administratie en facturen)"""
        if self.price_excl_btw is None:
            return None
        return self.price - self.price_excl_btw
    
    @property
    def display_price(self):
        """Prijs voor weergave in webshop (inclusief BTW)"""
        return self.price
    
    # STAP 2: NIEUWE PROPERTIES VOOR ENHANCED FEATURES
    @property
    def is_on_sale(self):
        """Check if product is on sale"""
        return self.original_price and self.original_price > self.price
    
    @property
    def sale_percentage(self):
        """Calculate sale percentage"""
        if not self.is_on_sale:
            return 0
        return int(((self.original_price - self.price) / self.original_price) * 100)
    
    @property
    def is_low_stock(self):
        """Check if product has low stock"""
        return self.stock <= self.low_stock_threshold
    
    def get_absolute_url(self):
        """URL for product detail page"""
        return f"/products/{self.id}/"
    
    def get_features_list(self):
        """Convert features text to list"""
        if not self.features:
            return []
        return [feature.strip() for feature in self.features.split('\n') if feature.strip()]

# UserProfile model 
class UserProfile(models.Model):
    """Extended User Profile voor HealClinics klanten"""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone = models.CharField(max_length=15, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    newsletter_subscription = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - Profile"

# Address model (voor Nederlandse adresgegevens)
class Address(models.Model):
    """Nederlandse adresgegevens voor HealClinics gebruikers"""
    
    ADDRESS_TYPES = [
        ('shipping', 'Verzendadres'),
        ('billing', 'Factuuradres'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    address_type = models.CharField(max_length=10, choices=ADDRESS_TYPES, default='shipping')
    
    # Nederlandse adres velden
    first_name = models.CharField(max_length=100, verbose_name='Voornaam')
    last_name = models.CharField(max_length=100, verbose_name='Achternaam')
    company = models.CharField(max_length=200, blank=True, verbose_name='Bedrijf (optioneel)')
    street_address = models.CharField(max_length=255, verbose_name='Straat')
    house_number = models.CharField(max_length=10, verbose_name='Huisnummer')
    house_number_addition = models.CharField(max_length=10, blank=True, verbose_name='Toevoeging')
    postal_code = models.CharField(max_length=10, verbose_name='Postcode')
    city = models.CharField(max_length=100, verbose_name='Plaats')
    province = models.CharField(max_length=100, default='Nederland', verbose_name='Provincie')
    country = models.CharField(max_length=100, default='Nederland', verbose_name='Land')
    
    # Standaard adres markering
    is_default_shipping = models.BooleanField(default=False, verbose_name='Standaard verzendadres')
    is_default_billing = models.BooleanField(default=False, verbose_name='Standaard factuuradres')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Adres'
        verbose_name_plural = 'Adressen'
        ordering = ['-is_default_shipping', '-is_default_billing', '-created_at']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.street_address} {self.house_number}, {self.city}"
    
    def get_full_address(self):
        """Retourneer volledig Nederlands geformatteerd adres"""
        address_parts = []
        
        # Naam
        name = f"{self.first_name} {self.last_name}"
        if self.company:
            name = f"{self.company}\n{name}"
        address_parts.append(name)
        
        # Straat + huisnummer
        street = f"{self.street_address} {self.house_number}"
        if self.house_number_addition:
            street += f" {self.house_number_addition}"
        address_parts.append(street)
        
        # Postcode + plaats
        address_parts.append(f"{self.postal_code} {self.city}")
        
        # Land (als niet Nederland)
        if self.country.lower() != 'nederland':
            address_parts.append(self.country)
        
        return '\n'.join(address_parts)
    
    def save(self, *args, **kwargs):
        # Zorg dat er maar één standaard verzendadres per gebruiker is
        if self.is_default_shipping:
            Address.objects.filter(
                user=self.user, 
                is_default_shipping=True
            ).exclude(pk=self.pk).update(is_default_shipping=False)
        
        # Zorg dat er maar één standaard factuuradres per gebruiker is
        if self.is_default_billing:
            Address.objects.filter(
                user=self.user, 
                is_default_billing=True
            ).exclude(pk=self.pk).update(is_default_billing=False)
        
        super().save(*args, **kwargs)

# NIEUWE CHECKOUT MODELS - Shopping Cart eerst
class ShoppingCart(models.Model):
    """Winkelwagen sessie management"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Winkelwagen'
        verbose_name_plural = 'Winkelwagens'
    
    def __str__(self):
        return f"Winkelwagen {self.user.email}"
    
    def get_total_items(self):
        return sum(item.quantity for item in self.items.all())
    
    def get_subtotal(self):
        return sum(item.get_total_price() for item in self.items.all())
    
    def get_tax_amount(self):
        return self.get_subtotal() * Decimal('0.21')  # 21% Nederlandse BTW
    
    def get_total_with_tax(self):
        return self.get_subtotal() + self.get_tax_amount()

class CartItem(models.Model):
    """Winkelwagen items"""
    
    cart = models.ForeignKey(ShoppingCart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Winkelwagen Item'
        verbose_name_plural = 'Winkelwagen Items'
        unique_together = ['cart', 'product']
    
    def __str__(self):
        return f"{self.product.name_nl} x{self.quantity}"
    
    def get_total_price(self):
        return self.product.price * self.quantity

# Order model - SINGLE VERSION MET ALLE FEATURES
class Order(models.Model):
    """Nederlandse bestellingen voor HealClinics - COMPLETE VERSION"""
    
    ORDER_STATUS_CHOICES = [
        ('pending', 'In afwachting'),
        ('confirmed', 'Bevestigd'),
        ('processing', 'In behandeling'),
        ('shipped', 'Verzonden'),
        ('delivered', 'Geleverd'),
        ('cancelled', 'Geannuleerd'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Wachtend op betaling'),
        ('paid', 'Betaald'),
        ('failed', 'Mislukt'),
        ('refunded', 'Terugbetaald'),
    ]
    
    # Order identificatie
    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders', null=True, blank=True)
    
    # Customer info (voor guest checkout)
    customer_email = models.EmailField()
    customer_name = models.CharField(max_length=100)
    customer_phone = models.CharField(max_length=15, blank=True)
    
    # Order status
    status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    
    # Adres informatie (snapshot van adressen op moment van bestelling)
    shipping_address = models.ForeignKey(Address, on_delete=models.PROTECT, related_name='shipping_orders', null=True, blank=True)
    billing_address = models.ForeignKey(Address, on_delete=models.PROTECT, related_name='billing_orders', null=True, blank=True)
    
    # Fallback text fields voor guest orders
    shipping_address_text = models.TextField(blank=True)
    billing_address_text = models.TextField(blank=True)
    
    # Financiële informatie (Nederlandse BTW)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=4, default=Decimal('0.21'))  # 21% Nederlandse BTW
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Betaalinformatie
    payment_method = models.CharField(max_length=50, default='ideal')
    ideal_bank = models.CharField(max_length=50, blank=True)  # ING, Rabobank, etc.
    payment_reference = models.CharField(max_length=100, blank=True)
    
    # Tracking
    tracking_number = models.CharField(max_length=100, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    # Notities
    customer_notes = models.TextField(blank=True, verbose_name='Klant opmerkingen')
    admin_notes = models.TextField(blank=True, verbose_name='Admin notities')
    
    class Meta:
        verbose_name = 'Bestelling'
        verbose_name_plural = 'Bestellingen'
        ordering = ['-created_at']
    
    def __str__(self):
        if self.user:
            return f"Bestelling {self.order_number} - {self.user.email}"
        return f"Bestelling {self.order_number} - {self.customer_name}"
    
    def save(self, *args, **kwargs):
        # Auto-generate order number if not provided
        if not self.order_number:
            self.order_number = self.generate_order_number()
        
        # Set customer info from user if available
        if self.user and not self.customer_email:
            self.customer_email = self.user.email
            self.customer_name = f"{self.user.first_name} {self.user.last_name}".strip() or self.user.username
        
        # Calculate totals
        self.calculate_totals()
        super().save(*args, **kwargs)
    
    def generate_order_number(self):
        """Genereer uniek Nederlands ordernummer"""
        now = datetime.datetime.now()
        prefix = f"HC{now.year}{now.month:02d}{now.day:02d}"
        
        # Find the last order of the day
        last_order = Order.objects.filter(
            order_number__startswith=prefix
        ).order_by('-order_number').first()
        
        if last_order:
            last_sequence = int(last_order.order_number[-4:])
            sequence = last_sequence + 1
        else:
            sequence = 1
            
        return f"{prefix}{sequence:04d}"
    
    def calculate_totals(self):
        """Bereken Nederlandse BTW en totalen"""
        items_total = sum(item.total_price for item in self.items.all())
        self.subtotal = items_total
        self.tax_amount = self.subtotal * self.tax_rate
        self.total_amount = self.subtotal + self.tax_amount + self.shipping_cost
    
    def get_status_display_nl(self):
        """Nederlandse status weergave"""
        status_nl = {
            'pending': 'In afwachting',
            'confirmed': 'Bevestigd', 
            'processing': 'In behandeling',
            'shipped': 'Verzonden',
            'delivered': 'Geleverd',
            'cancelled': 'Geannuleerd',
        }
        return status_nl.get(self.status, self.status)
    
    def can_be_cancelled(self):
        """Check of bestelling geannuleerd kan worden"""
        return self.status in ['pending', 'confirmed']
    
    def get_total_amount(self):
        """Calculate total order amount including BTW - LEGACY COMPATIBILITY"""
        return self.total_amount
    
    def get_item_count(self):
        """Get total number of items in order"""
        return sum(item.quantity for item in self.items.all())

# OrderItem model - SINGLE VERSION MET ALLE FEATURES
class OrderItem(models.Model):
    """Nederlandse order items met product snapshot"""
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')  # Consistent related_name
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    
    # Product snapshot (prijzen kunnen wijzigen)
    product_name = models.CharField(max_length=200)
    product_sku = models.CharField(max_length=100, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)  # Consistent field name
    quantity = models.PositiveIntegerField(default=1)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Bestelling Item'
        verbose_name_plural = 'Bestelling Items'
        unique_together = ['order', 'product']
    
    def __str__(self):
        return f"{self.product_name} x{self.quantity}"
    
    def save(self, *args, **kwargs):
        # Snapshot product data
        if not self.product_name:
            self.product_name = self.product.name_nl
        if not self.product_sku:
            self.product_sku = getattr(self.product, 'sku', '')
        if not self.unit_price:
            self.unit_price = self.product.price
        
        # Calculate total
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)
    
    def get_total_price(self):
        """Calculate total price for this item - LEGACY COMPATIBILITY"""
        return self.total_price


# Add this PaymentTransaction model to support Mollie integration
class PaymentTransaction(models.Model):
    TRANSACTION_STATUS_CHOICES = [
        ('open', 'Open'),
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payment_transactions')
    mollie_payment_id = models.CharField(max_length=100, unique=True, db_index=True)
    status = models.CharField(max_length=20, choices=TRANSACTION_STATUS_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=50, blank=True)
    
    # Webhook data storage
    webhook_data = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['mollie_payment_id']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Payment {self.mollie_payment_id} - {self.status}"
