import os
from pathlib import Path
from datetime import timedelta
import dj_database_url  # ✅ NEW: For Railway PostgreSQL

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# ✅ PRODUCTION: Environment-based secret key
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure--$#o0x&yi%h#ji0b6f_d_+8zzp0-z4mut)v#k#@@%sv(r#az!z')

# ✅ PRODUCTION: Environment-based debug setting
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

# ✅ PRODUCTION: Allow Railway and Vercel hosts
ALLOWED_HOSTS = ['*']  # Railway handles domain routing

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',  # ✅ Already present
    'django_filters',
    
    # Local apps
    'api',
]

# UPDATED: CORS Middleware MUST be first
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # ✅ FIRST - CRITICAL!
    'django.middleware.common.CommonMiddleware',  # ✅ MOVED UP
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'myapi.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'myapi.wsgi.application'

# ✅ PRODUCTION: Database configuration with Railway PostgreSQL support
if 'DATABASE_URL' in os.environ:
    # Production: Use Railway PostgreSQL
    DATABASES = {
        'default': dj_database_url.config(
            default=os.getenv('DATABASE_URL'),
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    # Development: Use SQLite
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'  # UPDATED: consistent naming

# Media Files Configuration
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ============================================================================
# CORS SETTINGS - ENHANCED FOR PRODUCTION
# ============================================================================

# ✅ PRODUCTION: CORS settings for Vercel + Railway
CORS_ALLOWED_ORIGINS = [
    "https://healclinics.vercel.app",  # ✅ Your live frontend
    "http://localhost:3000",                # Development
    "http://127.0.0.1:3000",               # Development
    "http://localhost:3001",               # Backup port
    "http://127.0.0.1:3001",
]

# ✅ DEVELOPMENT ONLY - disable in production
CORS_ALLOW_ALL_ORIGINS = DEBUG  # Only true in development

# Allow credentials (cookies, authorization headers)
CORS_ALLOW_CREDENTIALS = True

# Allow specific headers
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'cache-control',  # Added for caching
    'pragma',         # Added for caching
]

# Allow all standard HTTP methods
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Preflight request cache time (24 hours)
CORS_PREFLIGHT_MAX_AGE = 86400

# ============================================================================
# REST FRAMEWORK CONFIGURATION - ENHANCED
# ============================================================================

REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',  # JSON ONLY for API
        'rest_framework.renderers.BrowsableAPIRenderer',  # For testing in browser
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',  # For file uploads
        'rest_framework.parsers.FormParser',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',  # For browsable API
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',  # Allow unauthenticated access
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
    
    # ✅ PRODUCTION: Reasonable rate limiting
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '200/hour',  # ✅ INCREASED for deployment
        'user': '2000/hour'  # ✅ INCREASED for deployment
    }
}

# JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
}

# File Upload Settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
DATA_UPLOAD_MAX_MEMORY_SIZE = FILE_UPLOAD_MAX_MEMORY_SIZE

# Allowed image formats
ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB

# ============================================================================
# MOLLIE PAYMENT INTEGRATION - HEALCLINICS
# ============================================================================

# Mollie Configuration
MOLLIE_API_KEY = os.getenv('MOLLIE_API_KEY', 'test_dHar4XY7LxsDOtmnkVtjNVWXLSlXsM')
MOLLIE_WEBHOOK_URL = os.getenv('MOLLIE_WEBHOOK_URL', 'http://127.0.0.1:8080/api/webhooks/mollie/')

# ✅ PRODUCTION: Frontend URL for payment redirects
FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://healclinics.vercel.app')

# ============================================================================
# CACHING CONFIGURATION - FOR PERFORMANCE
# ============================================================================

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'healclinics-cache',
        'TIMEOUT': 300,  # 5 minutes default
        'OPTIONS': {
            'MAX_ENTRIES': 1000,
        }
    }
}

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

# Create logs directory if it doesn't exist
LOGS_DIR = BASE_DIR / 'logs'
LOGS_DIR.mkdir(exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': LOGS_DIR / 'healclinics.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'api.services.mollie_service': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'api.views': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console', 'file'],
            'level': 'ERROR',
            'propagate': False,
        },
        'corsheaders': {  # Added for CORS debugging
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# ============================================================================
# EMAIL CONFIGURATION (for order confirmations)
# ============================================================================

# Development - emails printed to console
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Default email settings
DEFAULT_FROM_EMAIL = 'HealClinics <info@healclinics.nl>'
SERVER_EMAIL = DEFAULT_FROM_EMAIL

# ============================================================================
# HEALCLINICS SPECIFIC SETTINGS
# ============================================================================

# Dutch tax rate
DUTCH_VAT_RATE = 0.21

# Order settings
ORDER_NUMBER_PREFIX = 'HC'
ORDER_EXPIRY_HOURS = 24

# Payment settings
PAYMENT_TIMEOUT_MINUTES = 15
PAYMENT_RETRY_ATTEMPTS = 3

# Shipping settings
FREE_SHIPPING_THRESHOLD = 50.00  # Free shipping above €50
DEFAULT_SHIPPING_COST = 4.95

# Product settings
PRODUCTS_PER_PAGE = 12
FEATURED_PRODUCTS_COUNT = 8

# ✅ PRODUCTION: Security settings
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_REDIRECT_EXEMPT = []
    SECURE_REFERRER_POLICY = 'same-origin'
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    
    # Disable CORS_ALLOW_ALL_ORIGINS in production
    CORS_ALLOW_ALL_ORIGINS = False

# ============================================================================
# UUID FIELD SUPPORT (for Order.uuid field)
# ============================================================================

# Ensure UUID support is available
try:
    import uuid
    UUID_SUPPORT = True
except ImportError:
    UUID_SUPPORT = False
