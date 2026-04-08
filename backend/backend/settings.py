from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-4t#j_htk)02381g2c)r$_2uayp4aibuoz%52fun5_3knbvt6j!'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = ['an-stock-analyzer-system.onrender.com', 'localhost', '127.0.0.1']

CSRF_TRUSTED_ORIGINS = [
    'https://*.loca.lt',
    'https://*.pythonanywhere.com',
    'https://an-stock-analyzer-system.onrender.com',
]

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_COOKIE_AGE = 1209600
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# Application definition
INSTALLED_APPS = [
    'unfold',
    'unfold.contrib.filters',
    'unfold.contrib.forms',
    'unfold.contrib.import_export',
    'unfold.contrib.guardian',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'store',
    'stock',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

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

WSGI_APPLICATION = 'backend.wsgi.application'

# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS Configuration
CORS_ALLOW_ALL_ORIGINS = True

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
    'DEFAULT_THROTTLE_CLASSES': ['rest_framework.throttling.AnonRateThrottle'],
    'DEFAULT_THROTTLE_RATES': {'anon': '60/min'}
}

# Cache (in-memory for dev)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'stockvision-cache',
    }
}

# Cache timeouts
MARKET_DATA_CACHE_TTL = 60
HISTORY_CACHE_TTL = 300
NEWS_CACHE_TTL = 600

# Auth redirects
LOGIN_URL = '/stock/login/'
LOGIN_REDIRECT_URL = '/stock/'
LOGOUT_REDIRECT_URL = '/stock/login/'

# Session
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_COOKIE_AGE = 1209600
SESSION_SAVE_EVERY_REQUEST = True

# Messages
MESSAGE_STORAGE = 'django.contrib.messages.storage.session.SessionStorage'

# Elite Professional Admin UI (Django Unfold)
UNFOLD = {
    "SITE_TITLE": "Stock Vision Admin",
    "SITE_HEADER": "Stock Vision",
    "SITE_URL": "/",
    "SITE_ICON": None,
    "ENVIRONMENT": "System Health: <span class='unfold-pulse'></span> ONLINE",
    "DASHBOARD_CALLBACK": "stock.views.dashboard_callback",
    "STYLES": [
        "stock/css/admin_custom.css",
    ],
    "SCRIPTS": [
        "https://cdn.jsdelivr.net/npm/chart.js",
        "stock/js/admin_dashboard.js",
    ],
    "COLORS": {
        "primary": {
            "50": "238 242 255",
            "100": "224 231 255",
            "200": "199 210 254",
            "300": "165 180 252",
            "400": "129 140 248",
            "500": "99 102 241",  # Indigo 500 (High-End SaaS Standard)
            "600": "79 70 229",
            "700": "67 56 202",
            "800": "55 48 163",
            "900": "49 46 129",
            "950": "30 27 75",
        },
    },
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": False,
        "navigation": [
            {
                "title": "Main Dashboard",
                "items": [
                    {
                        "title": "Admin Home",
                        "icon": "dashboard",
                        "link": "/admin/",
                        "permission": lambda request: request.user.is_staff,
                    },
                    {
                        "title": "StockVision Live",
                        "icon": "public",
                        "link": "/",
                    },
                ],
            },
            {
                "title": "User Management",
                "items": [
                    {
                        "title": "Core Users",
                        "icon": "group",
                        "link": "/admin/auth/user/",
                    },
                    {
                        "title": "Member Profiles",
                        "icon": "badge",
                        "link": "/admin/stock/userprofile/",
                    },
                    {
                        "title": "Subscription Orders",
                        "icon": "payments",
                        "link": "/admin/stock/subscriptionorder/",
                    },
                ],
            },
            {
                "title": "Market Operations",
                "items": [
                    {
                        "title": "Watchlist Monitor",
                        "icon": "analytics",
                        "link": "/admin/stock/watchlistitem/",
                    },
                    {
                        "title": "Portfolio Tracking",
                        "icon": "account_balance",
                        "link": "/admin/stock/portfolioholding/",
                    },
                    {
                        "title": "System Alerts",
                        "icon": "notifications_active",
                        "link": "/admin/stock/stockalert/",
                    },
                    {
                        "title": "Global News Feed",
                        "icon": "newspaper",
                        "link": "/admin/stock/newscache/",
                    },
                ],
            },
        ],
    },
}

# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('GMAIL_USER')
EMAIL_HOST_PASSWORD = os.environ.get('GMAIL_PASSWORD')
DEFAULT_FROM_EMAIL = f"StockVision <{os.environ.get('GMAIL_USER')}>"
